import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const propertyId = body.property_id;
    const watchlistId = body.watchlist_id;

    // If property_id is provided, calculate for single property
    // If watchlist_id is provided, calculate for all properties in that watchlist
    // Otherwise, calculate for all user's properties
    let properties;

    if (propertyId) {
      // Get single property
      const result = await sql`
        SELECT p.*, w.user_id
        FROM properties p
        INNER JOIN watchlists w ON p.watchlist_id = w.id
        WHERE p.id = ${propertyId} AND w.user_id = ${session.user.id}
      `;

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
      }

      properties = result.rows;
    } else if (watchlistId) {
      // Get all properties in the watchlist
      const result = await sql`
        SELECT p.*, w.user_id
        FROM properties p
        INNER JOIN watchlists w ON p.watchlist_id = w.id
        WHERE p.watchlist_id = ${watchlistId} AND w.user_id = ${session.user.id}
      `;

      properties = result.rows;
    } else {
      // Get all user's properties
      const result = await sql`
        SELECT p.*
        FROM properties p
        INNER JOIN watchlists w ON p.watchlist_id = w.id
        WHERE w.user_id = ${session.user.id}
      `;

      properties = result.rows;
    }

    let updated = 0;
    let errors = 0;

    for (const property of properties) {
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

        // Call Python scoring endpoint
        const scoringResponse = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/score_motivation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            property: propertyData,
            history: historyResult.rows,
            market: {
              avg_days_on_market: 60, // Default market average
            },
          }),
        });

        if (!scoringResponse.ok) {
          console.error(`Failed to score property ${property.id}`);
          errors++;
          continue;
        }

        const scoringData = await scoringResponse.json();
        const score = scoringData.score;

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

        updated++;
      } catch (error) {
        console.error(`Error scoring property ${property.id}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      errors,
      total: properties.length,
    });
  } catch (error) {
    console.error('Error calculating motivation scores:', error);
    return NextResponse.json(
      { error: 'Failed to calculate scores' },
      { status: 500 }
    );
  }
}
