import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/preferences
 * Get user preferences
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Get user info and preferences
    const result = await sql`
      SELECT
        u.id,
        u.name,
        u.email,
        COALESCE(up.alert_threshold, 70) as alert_threshold
      FROM users u
      LEFT JOIN user_preferences up ON u.id = up.user_id
      WHERE u.id = ${userId}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    return NextResponse.json({
      success: true,
      preferences: {
        name: user.name,
        email: user.email,
        alert_threshold: parseInt(user.alert_threshold),
      },
    });

  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/preferences
 * Update user preferences
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
    const body = await request.json();

    // Update name if provided
    if (body.name !== undefined) {
      await sql`
        UPDATE users
        SET name = ${body.name}
        WHERE id = ${userId}
      `;
    }

    // Update alert threshold if provided
    if (body.alert_threshold !== undefined) {
      // Check if preferences record exists
      const existingPrefs = await sql`
        SELECT id FROM user_preferences WHERE user_id = ${userId}
      `;

      if (existingPrefs.rows.length > 0) {
        await sql`
          UPDATE user_preferences
          SET alert_threshold = ${body.alert_threshold}
          WHERE user_id = ${userId}
        `;
      } else {
        await sql`
          INSERT INTO user_preferences (user_id, alert_threshold)
          VALUES (${userId}, ${body.alert_threshold})
        `;
      }

      // Update alert_threshold on all user's watchlists
      await sql`
        UPDATE watchlists
        SET alert_threshold = ${body.alert_threshold}
        WHERE user_id = ${userId}
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
    });

  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences', details: String(error) },
      { status: 500 }
    );
  }
}
