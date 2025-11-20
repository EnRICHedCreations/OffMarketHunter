import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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
    const { id } = await context.params;
    const propertyId = parseInt(id);

    // Verify user owns this property (through watchlist)
    const propertyCheck = await sql`
      SELECT p.id
      FROM properties p
      INNER JOIN watchlists w ON p.watchlist_id = w.id
      WHERE p.id = ${propertyId} AND w.user_id = ${userId}
    `;

    if (propertyCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Property not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch property history
    const history = await sql`
      SELECT
        id,
        event_type,
        event_date,
        old_status,
        new_status,
        old_price,
        new_price,
        price_change_amount,
        price_change_percent,
        notes
      FROM property_history
      WHERE property_id = ${propertyId}
      ORDER BY event_date DESC
    `;

    return NextResponse.json({
      success: true,
      history: history.rows,
    });

  } catch (error) {
    console.error('Error fetching property history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property history', details: String(error) },
      { status: 500 }
    );
  }
}
