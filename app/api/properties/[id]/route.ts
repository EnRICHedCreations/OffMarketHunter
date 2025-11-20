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

    // Fetch property with user ownership verification
    const result = await sql`
      SELECT
        p.*,
        w.name as watchlist_name,
        w.user_id
      FROM properties p
      INNER JOIN watchlists w ON p.watchlist_id = w.id
      WHERE p.id = ${propertyId}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    const property = result.rows[0];

    // Verify user owns this property (through watchlist)
    if (property.user_id !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      property,
    });

  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property', details: String(error) },
      { status: 500 }
    );
  }
}
