import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/properties/interest
 * Mark a property as interested or remove interest
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { property_id, interested } = body;

    if (!property_id) {
      return NextResponse.json(
        { error: 'property_id is required' },
        { status: 400 }
      );
    }

    const propId = parseInt(property_id);

    // Verify user owns this property via watchlist
    const ownerCheck = await sql`
      SELECT p.id
      FROM properties p
      INNER JOIN watchlists w ON p.watchlist_id = w.id
      WHERE p.id = ${propId} AND w.user_id = ${userId}
    `;

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (interested) {
      // Add or update interest
      await sql`
        INSERT INTO property_interest (property_id, user_id, marked_at)
        VALUES (${propId}, ${userId}, NOW())
        ON CONFLICT (property_id, user_id)
        DO UPDATE SET marked_at = NOW()
      `;

      return NextResponse.json({
        success: true,
        interested: true,
        message: 'Property marked as interested',
      });
    } else {
      // Remove interest
      await sql`
        DELETE FROM property_interest
        WHERE property_id = ${propId} AND user_id = ${userId}
      `;

      return NextResponse.json({
        success: true,
        interested: false,
        message: 'Interest removed',
      });
    }
  } catch (error) {
    console.error('Error updating property interest:', error);
    return NextResponse.json(
      { error: 'Failed to update interest', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/properties/interest?property_id=X
 * Check if user is interested in a property
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Missing property_id parameter' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);
    const propId = parseInt(propertyId);

    // Check if user has marked this property as interested
    const result = await sql`
      SELECT id, marked_at
      FROM property_interest
      WHERE property_id = ${propId} AND user_id = ${userId}
    `;

    return NextResponse.json({
      success: true,
      interested: result.rows.length > 0,
      marked_at: result.rows.length > 0 ? result.rows[0].marked_at : null,
    });
  } catch (error) {
    console.error('Error checking property interest:', error);
    return NextResponse.json(
      { error: 'Failed to check interest', details: String(error) },
      { status: 500 }
    );
  }
}
