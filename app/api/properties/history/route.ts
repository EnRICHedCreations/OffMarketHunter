import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

// GET /api/properties/history?id=X - Get property history
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const propertyId = parseInt(id);

    // Verify user owns this property via watchlist
    const ownerCheck = await sql`
      SELECT p.id
      FROM properties p
      INNER JOIN watchlists w ON p.watchlist_id = w.id
      WHERE p.id = ${propertyId} AND w.user_id = ${session.user.id}
    `;

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Get property history
    const history = await sql`
      SELECT *
      FROM property_history
      WHERE property_id = ${propertyId}
      ORDER BY event_date DESC
    `;

    // Convert DECIMAL fields from strings to numbers
    const convertedHistory = history.rows.map(row => ({
      ...row,
      old_price: row.old_price ? parseFloat(row.old_price) : null,
      new_price: row.new_price ? parseFloat(row.new_price) : null,
      price_change_amount: row.price_change_amount ? parseFloat(row.price_change_amount) : null,
      price_change_percent: row.price_change_percent ? parseFloat(row.price_change_percent) : null,
    }));

    return NextResponse.json({
      success: true,
      history: convertedHistory,
    });
  } catch (error) {
    console.error('Error fetching property history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property history' },
      { status: 500 }
    );
  }
}
