import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';
import { z } from 'zod';

const watchlistUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  location: z.string().min(2).optional(),
  price_min: z.number().nullable().optional(),
  price_max: z.number().nullable().optional(),
  beds_min: z.number().nullable().optional(),
  beds_max: z.number().nullable().optional(),
  baths_min: z.number().nullable().optional(),
  baths_max: z.number().nullable().optional(),
  sqft_min: z.number().nullable().optional(),
  sqft_max: z.number().nullable().optional(),
  lot_sqft_min: z.number().nullable().optional(),
  lot_sqft_max: z.number().nullable().optional(),
  year_built_min: z.number().nullable().optional(),
  year_built_max: z.number().nullable().optional(),
  property_types: z.array(z.string()).nullable().optional(),
  track_off_market: z.boolean().optional(),
  track_price_reductions: z.boolean().optional(),
  track_expired: z.boolean().optional(),
  alert_threshold: z.number().min(50).max(100).optional(),
  is_active: z.boolean().optional(),
});

// GET /api/watchlists/[id] - Get single watchlist
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    console.log(`[GET /api/watchlists/${id}] User ID: ${session.user.id}, Watchlist ID: ${id}`);

    // First check if watchlist exists at all
    const checkExists = await sql`
      SELECT id, user_id FROM watchlists WHERE id = ${id}
    `;

    if (checkExists.rows.length === 0) {
      console.log(`[GET /api/watchlists/${id}] Watchlist does not exist`);
      return NextResponse.json({ error: 'Watchlist not found' }, { status: 404 });
    }

    console.log(`[GET /api/watchlists/${id}] Watchlist exists with user_id: ${checkExists.rows[0].user_id}`);

    const result = await sql`
      SELECT * FROM watchlists
      WHERE id = ${id} AND user_id = ${session.user.id}
    `;

    if (result.rows.length === 0) {
      console.log(`[GET /api/watchlists/${id}] User ${session.user.id} does not own this watchlist (owner: ${checkExists.rows[0].user_id})`);
      return NextResponse.json({ error: 'Watchlist not found' }, { status: 404 });
    }

    console.log(`[GET /api/watchlists/${id}] Successfully fetched watchlist`);
    return NextResponse.json({ watchlist: result.rows[0] });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

// PUT /api/watchlists/[id] - Update watchlist
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const checkResult = await sql`
      SELECT id FROM watchlists
      WHERE id = ${id} AND user_id = ${session.user.id}
    `;

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Watchlist not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = watchlistUpdateSchema.parse(body);

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'property_types') {
          updates.push(`${key} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          updates.push(`${key} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    });

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    values.push(id);
    values.push(session.user.id);

    const query = `
      UPDATE watchlists
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await sql.query(query, values);

    return NextResponse.json({ watchlist: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    console.error('Error updating watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to update watchlist' },
      { status: 500 }
    );
  }
}

// DELETE /api/watchlists/[id] - Delete watchlist
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const result = await sql`
      DELETE FROM watchlists
      WHERE id = ${id} AND user_id = ${session.user.id}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Watchlist not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete watchlist' },
      { status: 500 }
    );
  }
}
