import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/alerts
 * Get all alerts for the current user
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const alertType = searchParams.get('type');

    // Build query with optional filters
    let result;

    if (alertType && unreadOnly) {
      result = await sql`
        SELECT
          a.*,
          p.property_id,
          p.full_street_line,
          p.city,
          p.state,
          p.zip_code,
          p.current_list_price,
          p.primary_photo,
          p.beds,
          p.baths,
          p.sqft,
          w.name as watchlist_name
        FROM alerts a
        INNER JOIN properties p ON a.property_id = p.id
        INNER JOIN watchlists w ON a.watchlist_id = w.id
        WHERE a.user_id = ${userId}
          AND a.alert_type = ${alertType}
          AND a.read_at IS NULL
        ORDER BY a.sent_at DESC
      `;
    } else if (alertType) {
      result = await sql`
        SELECT
          a.*,
          p.property_id,
          p.full_street_line,
          p.city,
          p.state,
          p.zip_code,
          p.current_list_price,
          p.primary_photo,
          p.beds,
          p.baths,
          p.sqft,
          w.name as watchlist_name
        FROM alerts a
        INNER JOIN properties p ON a.property_id = p.id
        INNER JOIN watchlists w ON a.watchlist_id = w.id
        WHERE a.user_id = ${userId}
          AND a.alert_type = ${alertType}
        ORDER BY a.sent_at DESC
      `;
    } else if (unreadOnly) {
      result = await sql`
        SELECT
          a.*,
          p.property_id,
          p.full_street_line,
          p.city,
          p.state,
          p.zip_code,
          p.current_list_price,
          p.primary_photo,
          p.beds,
          p.baths,
          p.sqft,
          w.name as watchlist_name
        FROM alerts a
        INNER JOIN properties p ON a.property_id = p.id
        INNER JOIN watchlists w ON a.watchlist_id = w.id
        WHERE a.user_id = ${userId}
          AND a.read_at IS NULL
        ORDER BY a.sent_at DESC
      `;
    } else {
      result = await sql`
        SELECT
          a.*,
          p.property_id,
          p.full_street_line,
          p.city,
          p.state,
          p.zip_code,
          p.current_list_price,
          p.primary_photo,
          p.beds,
          p.baths,
          p.sqft,
          w.name as watchlist_name
        FROM alerts a
        INNER JOIN properties p ON a.property_id = p.id
        INNER JOIN watchlists w ON a.watchlist_id = w.id
        WHERE a.user_id = ${userId}
        ORDER BY a.sent_at DESC
      `;
    }

    return NextResponse.json({
      success: true,
      alerts: result.rows,
      count: result.rows.length,
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts', details: String(error) },
      { status: 500 }
    );
  }
}
