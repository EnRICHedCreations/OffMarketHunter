import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Import the Python scoring logic (we'll call via HTTP)
async function calculateMotivationScore(
  propertyData: any,
  propertyHistory: any[],
  marketData: any
) {
  // For development, use localhost. For production on Vercel, this won't work
  // due to auth issues, so we'll need to implement scoring directly in TypeScript
  // or use a cron job with proper authentication bypass.

  // TEMPORARY TYPESCRIPT IMPLEMENTATION (same logic as Python)

  const dom = propertyData.days_on_market || 0;
  let domScore = 0;
  if (dom < 30) domScore = 5;
  else if (dom < 60) domScore = 10;
  else if (dom < 90) domScore = 15;
  else if (dom < 120) domScore = 20;
  else domScore = 25;

  const reductionCount = propertyData.price_reduction_count || 0;
  const reductionPercent = propertyData.total_price_reduction_percent || 0;
  const countScore = Math.min(reductionCount * 7, 15);
  const percentScore = Math.min(reductionPercent * 0.75, 15);
  const reductionScore = countScore + percentScore;

  let offMarketDays = 0;
  const currentStatus = (propertyData.current_status || '').toLowerCase();
  let offMarketScore = 0;

  if (['off_market', 'off market', 'withdrawn'].includes(currentStatus)) {
    const listDate = propertyData.list_date;
    if (listDate) {
      try {
        const listDt = new Date(listDate);
        offMarketDays = Math.floor((Date.now() - listDt.getTime()) / (1000 * 60 * 60 * 24));
      } catch {
        offMarketDays = 30;
      }
    }
  }

  if (offMarketDays < 7) offMarketScore = 20;
  else if (offMarketDays < 30) offMarketScore = 15;
  else if (offMarketDays < 90) offMarketScore = 10;
  else offMarketScore = 5;

  let statusScore = 0;
  for (const h of propertyHistory) {
    const oldStatus = (h.old_status || '').toLowerCase();
    const newStatus = (h.new_status || '').toLowerCase();

    if (['pending', 'contingent'].includes(oldStatus) &&
        ['off_market', 'off market', 'withdrawn'].includes(newStatus)) {
      statusScore += 10;
      break;
    }
  }

  if (currentStatus === 'expired') {
    statusScore += 5;
  }
  statusScore = Math.min(statusScore, 15);

  const marketAvgDom = marketData.avg_days_on_market || 60;
  let marketScore = 3;
  if (dom > marketAvgDom * 1.5) marketScore = 10;
  else if (dom > marketAvgDom * 1.2) marketScore = 7;
  else if (dom > marketAvgDom) marketScore = 5;

  const totalScore = domScore + reductionScore + offMarketScore + statusScore + marketScore;

  return {
    total: Math.round(totalScore * 100) / 100,
    dom_component: Math.round(domScore * 100) / 100,
    reduction_component: Math.round(reductionScore * 100) / 100,
    off_market_component: Math.round(offMarketScore * 100) / 100,
    status_component: Math.round(statusScore * 100) / 100,
    market_component: Math.round(marketScore * 100) / 100,
  };
}

export async function POST(request: Request) {
  try {
    // Check authentication (either user session OR cron secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isCronRequest = cronSecret && authHeader === `Bearer ${cronSecret}`;

    let userId: number | null = null;

    if (isCronRequest) {
      // Cron job request - we'll get user_id from watchlist
      const body = await request.json();
      const { watchlist_id } = body;

      const watchlistResult = await sql`
        SELECT user_id FROM watchlists WHERE id = ${watchlist_id}
      `;

      if (watchlistResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Watchlist not found' },
          { status: 404 }
        );
      }

      userId = watchlistResult.rows[0].user_id;
    } else {
      // Regular user request
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      userId = parseInt(session.user.id);
    }

    const body = await request.json();
    const { watchlist_id } = body;

    if (!watchlist_id) {
      return NextResponse.json(
        { error: 'watchlist_id required' },
        { status: 400 }
      );
    }

    // Verify watchlist ownership
    const watchlistResult = await sql`
      SELECT id FROM watchlists
      WHERE id = ${watchlist_id} AND user_id = ${userId}
    `;

    if (watchlistResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Watchlist not found or access denied' },
        { status: 404 }
      );
    }

    // Get all properties for this watchlist
    const propertiesResult = await sql`
      SELECT * FROM properties
      WHERE watchlist_id = ${watchlist_id}
    `;

    let scoredCount = 0;
    const errors: string[] = [];

    // Score each property
    for (const property of propertiesResult.rows) {
      try {
        // Fetch property history
        const historyResult = await sql`
          SELECT * FROM property_history
          WHERE property_id = ${property.id}
          ORDER BY event_date DESC
        `;

        // Prepare data for scoring
        const propertyData = {
          days_on_market: property.raw_data?.days_on_market || 0,
          price_reduction_count: property.price_reduction_count || 0,
          total_price_reduction_percent: property.total_price_reduction_percent || 0,
          current_status: property.current_status,
          list_date: property.list_date,
        };

        // Calculate score using TypeScript implementation
        const score = await calculateMotivationScore(
          propertyData,
          historyResult.rows,
          { avg_days_on_market: 60 }
        );

        // Update property with scores
        await sql`
          UPDATE properties
          SET
            motivation_score = ${score.total},
            motivation_score_dom = ${score.dom_component},
            motivation_score_reductions = ${score.reduction_component},
            motivation_score_off_market = ${score.off_market_component},
            motivation_score_status = ${score.status_component},
            motivation_score_market = ${score.market_component},
            updated_at = NOW()
          WHERE id = ${property.id}
        `;

        scoredCount++;
      } catch (err) {
        console.error(`Error scoring property ${property.id}:`, err);
        errors.push(`Failed to score property ${property.id}: ${String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      scored_count: scoredCount,
      total_properties: propertiesResult.rows.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Error scoring properties:', error);
    return NextResponse.json(
      { error: 'Failed to score properties', details: String(error) },
      { status: 500 }
    );
  }
}
