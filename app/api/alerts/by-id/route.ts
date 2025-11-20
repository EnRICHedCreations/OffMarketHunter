import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PUT /api/alerts/by-id?id=X
 * Mark an alert as read
 */
export async function PUT(request: Request) {
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
    const alertId = searchParams.get('id');

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID required' },
        { status: 400 }
      );
    }

    // Verify alert ownership
    const verifyResult = await sql`
      SELECT id FROM alerts
      WHERE id = ${parseInt(alertId)} AND user_id = ${userId}
    `;

    if (verifyResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Alert not found or access denied' },
        { status: 404 }
      );
    }

    // Mark as read
    await sql`
      UPDATE alerts
      SET read_at = NOW()
      WHERE id = ${parseInt(alertId)}
    `;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error marking alert as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark alert as read', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/alerts/by-id?id=X
 * Delete an alert
 */
export async function DELETE(request: Request) {
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
    const alertId = searchParams.get('id');

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID required' },
        { status: 400 }
      );
    }

    // Verify alert ownership and delete
    const result = await sql`
      DELETE FROM alerts
      WHERE id = ${parseInt(alertId)} AND user_id = ${userId}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Alert not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert', details: String(error) },
      { status: 500 }
    );
  }
}
