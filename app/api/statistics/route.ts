import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/statistics
 * Get market statistics for user's properties
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Overall statistics
    const overallStats = await sql`
      SELECT
        COUNT(*) as total_properties,
        COUNT(CASE WHEN current_status = 'off_market' THEN 1 END) as off_market_count,
        COUNT(CASE WHEN current_status != 'off_market' THEN 1 END) as for_sale_count,
        AVG(motivation_score) as avg_motivation_score,
        AVG(current_list_price) as avg_price,
        SUM(price_reduction_count) as total_price_reductions,
        AVG(total_days_on_market) as avg_days_on_market,
        COUNT(CASE WHEN motivation_score > 70 THEN 1 END) as high_motivation_count
      FROM properties p
      INNER JOIN watchlists w ON p.watchlist_id = w.id
      WHERE w.user_id = ${userId}
    `;

    // Statistics by watchlist
    const byWatchlist = await sql`
      SELECT
        w.id as watchlist_id,
        w.name as watchlist_name,
        COUNT(p.id) as property_count,
        AVG(p.motivation_score) as avg_score,
        AVG(p.current_list_price) as avg_price
      FROM watchlists w
      LEFT JOIN properties p ON p.watchlist_id = w.id
      WHERE w.user_id = ${userId}
      GROUP BY w.id, w.name
      HAVING COUNT(p.id) > 0
      ORDER BY property_count DESC
    `;

    // Statistics by property type
    const byPropertyType = await sql`
      SELECT
        p.property_type,
        COUNT(*) as count,
        AVG(p.motivation_score) as avg_score,
        AVG(p.current_list_price) as avg_price
      FROM properties p
      INNER JOIN watchlists w ON p.watchlist_id = w.id
      WHERE w.user_id = ${userId} AND p.property_type IS NOT NULL
      GROUP BY p.property_type
      ORDER BY count DESC
    `;

    // Convert DECIMAL fields to numbers
    const overall = overallStats.rows[0];
    const statistics = {
      total_properties: parseInt(overall.total_properties || '0'),
      off_market_count: parseInt(overall.off_market_count || '0'),
      for_sale_count: parseInt(overall.for_sale_count || '0'),
      avg_motivation_score: overall.avg_motivation_score ? parseFloat(overall.avg_motivation_score) : 0,
      avg_price: overall.avg_price ? parseFloat(overall.avg_price) : 0,
      total_price_reductions: parseInt(overall.total_price_reductions || '0'),
      avg_days_on_market: overall.avg_days_on_market ? parseFloat(overall.avg_days_on_market) : 0,
      high_motivation_count: parseInt(overall.high_motivation_count || '0'),
      by_watchlist: byWatchlist.rows.map((row: any) => ({
        watchlist_id: row.watchlist_id,
        watchlist_name: row.watchlist_name,
        property_count: parseInt(row.property_count),
        avg_score: row.avg_score ? parseFloat(row.avg_score) : 0,
        avg_price: row.avg_price ? parseFloat(row.avg_price) : 0,
      })),
      by_property_type: byPropertyType.rows.map((row: any) => ({
        property_type: row.property_type,
        count: parseInt(row.count),
        avg_score: row.avg_score ? parseFloat(row.avg_score) : 0,
        avg_price: row.avg_price ? parseFloat(row.avg_price) : 0,
      })),
      recent_trends: [], // Placeholder for future trend analysis
    };

    return NextResponse.json({
      success: true,
      statistics,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics', details: String(error) },
      { status: 500 }
    );
  }
}
