import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PUT /api/alerts/read-all
 * Mark all alerts as read for the current user
 */
export async function PUT() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Mark all unread alerts as read
    const result = await sql`
      UPDATE alerts
      SET read_at = NOW()
      WHERE user_id = ${userId}
        AND read_at IS NULL
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      marked_read: result.rows.length,
    });

  } catch (error) {
    console.error('Error marking all alerts as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all alerts as read', details: String(error) },
      { status: 500 }
    );
  }
}
