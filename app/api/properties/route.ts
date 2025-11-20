import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);

    // Get filter parameters
    const watchlistId = searchParams.get('watchlist_id');
    const status = searchParams.get('status');
    const priceMin = searchParams.get('price_min');
    const priceMax = searchParams.get('price_max');
    const bedsMin = searchParams.get('beds_min');
    const bathsMin = searchParams.get('baths_min');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'DESC';

    // Build WHERE clause
    let whereConditions = ['w.user_id = $1'];
    let queryParams: any[] = [userId];
    let paramIndex = 2;

    if (watchlistId) {
      whereConditions.push(`p.watchlist_id = $${paramIndex}`);
      queryParams.push(parseInt(watchlistId));
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`p.current_status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (priceMin) {
      whereConditions.push(`p.current_list_price >= $${paramIndex}`);
      queryParams.push(parseFloat(priceMin));
      paramIndex++;
    }

    if (priceMax) {
      whereConditions.push(`p.current_list_price <= $${paramIndex}`);
      queryParams.push(parseFloat(priceMax));
      paramIndex++;
    }

    if (bedsMin) {
      whereConditions.push(`p.beds >= $${paramIndex}`);
      queryParams.push(parseInt(bedsMin));
      paramIndex++;
    }

    if (bathsMin) {
      whereConditions.push(`p.baths >= $${paramIndex}`);
      queryParams.push(parseFloat(bathsMin));
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Validate sort column
    const validSortColumns = ['created_at', 'current_list_price', 'motivation_score'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Query with raw SQL to handle dynamic parameters
    const query = `
      SELECT
        p.id,
        p.property_id,
        p.full_street_line,
        p.city,
        p.state,
        p.zip_code,
        p.beds,
        p.baths,
        p.sqft,
        p.current_status,
        p.current_list_price,
        p.primary_photo,
        p.motivation_score,
        p.raw_data,
        p.created_at,
        w.name as watchlist_name
      FROM properties p
      INNER JOIN watchlists w ON p.watchlist_id = w.id
      WHERE ${whereClause}
      ORDER BY p.${sortColumn} ${order}
      LIMIT 100
    `;

    const result = await sql.query(query, queryParams);

    return NextResponse.json({
      success: true,
      properties: result.rows,
      count: result.rows.length,
    });

  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties', details: String(error) },
      { status: 500 }
    );
  }
}
