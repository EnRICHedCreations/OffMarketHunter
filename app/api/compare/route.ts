import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/compare?ids=1,2,3
 * Get properties for comparison
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { error: 'Missing ids parameter' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);
    const ids = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid ids parameter' },
        { status: 400 }
      );
    }

    if (ids.length > 3) {
      return NextResponse.json(
        { error: 'Maximum 3 properties can be compared' },
        { status: 400 }
      );
    }

    // Get properties with user ownership verification
    // Build IN clause manually since vercel/postgres doesn't support array parameters
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const query = `
      SELECT
        p.*,
        w.name as watchlist_name
      FROM properties p
      INNER JOIN watchlists w ON p.watchlist_id = w.id
      WHERE p.id IN (${placeholders}) AND w.user_id = $${ids.length + 1}
      ORDER BY p.id
    `;

    const result = await sql.query(query, [...ids, userId]);

    // Convert DECIMAL fields to numbers
    const properties = result.rows.map((row: any) => ({
      ...row,
      current_list_price: row.current_list_price ? parseFloat(row.current_list_price) : null,
      original_list_price: row.original_list_price ? parseFloat(row.original_list_price) : null,
      total_price_reduction_amount: row.total_price_reduction_amount ? parseFloat(row.total_price_reduction_amount) : null,
      total_price_reduction_percent: row.total_price_reduction_percent ? parseFloat(row.total_price_reduction_percent) : null,
      motivation_score: row.motivation_score ? parseFloat(row.motivation_score) : null,
      motivation_score_dom: row.motivation_score_dom ? parseFloat(row.motivation_score_dom) : null,
      motivation_score_reductions: row.motivation_score_reductions ? parseFloat(row.motivation_score_reductions) : null,
      motivation_score_off_market: row.motivation_score_off_market ? parseFloat(row.motivation_score_off_market) : null,
      motivation_score_status: row.motivation_score_status ? parseFloat(row.motivation_score_status) : null,
      motivation_score_market: row.motivation_score_market ? parseFloat(row.motivation_score_market) : null,
    }));

    return NextResponse.json({
      success: true,
      properties,
    });
  } catch (error) {
    console.error('Error fetching properties for comparison:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties', details: String(error) },
      { status: 500 }
    );
  }
}
