import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/interested
 * Get all properties the user has marked as interested
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Get all interested properties for this user
    const result = await sql`
      SELECT
        p.*,
        w.name as watchlist_name,
        pi.marked_at
      FROM property_interest pi
      INNER JOIN properties p ON pi.property_id = p.id
      INNER JOIN watchlists w ON p.watchlist_id = w.id
      WHERE pi.user_id = ${userId}
      ORDER BY pi.marked_at DESC
    `;

    // Convert DECIMAL fields to numbers
    const properties = result.rows.map((row: any) => ({
      ...row,
      current_list_price: row.current_list_price ? parseFloat(row.current_list_price) : null,
      original_list_price: row.original_list_price ? parseFloat(row.original_list_price) : null,
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
      count: properties.length,
    });
  } catch (error) {
    console.error('Error fetching interested properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interested properties', details: String(error) },
      { status: 500 }
    );
  }
}
