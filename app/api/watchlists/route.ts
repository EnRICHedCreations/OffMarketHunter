import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';
import { z } from 'zod';

const watchlistCreateSchema = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
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
  track_off_market: z.boolean().default(true),
  track_price_reductions: z.boolean().default(true),
  track_expired: z.boolean().default(true),
  alert_threshold: z.number().min(50).max(100).default(80),
});

// GET /api/watchlists - List user's watchlists
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await sql`
      SELECT
        w.*,
        COUNT(p.id) as property_count
      FROM watchlists w
      LEFT JOIN properties p ON p.watchlist_id = w.id
      WHERE w.user_id = ${session.user.id}
      GROUP BY w.id
      ORDER BY w.created_at DESC
    `;

    return NextResponse.json({ watchlists: result.rows });
  } catch (error) {
    console.error('Error fetching watchlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlists' },
      { status: 500 }
    );
  }
}

// POST /api/watchlists - Create watchlist
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = watchlistCreateSchema.parse(body);

    const result = await sql`
      INSERT INTO watchlists (
        user_id, name, location,
        price_min, price_max,
        beds_min, beds_max,
        baths_min, baths_max,
        sqft_min, sqft_max,
        lot_sqft_min, lot_sqft_max,
        year_built_min, year_built_max,
        property_types,
        track_off_market, track_price_reductions, track_expired,
        alert_threshold,
        is_active,
        created_at, updated_at
      )
      VALUES (
        ${session.user.id}, ${validatedData.name}, ${validatedData.location},
        ${validatedData.price_min}, ${validatedData.price_max},
        ${validatedData.beds_min}, ${validatedData.beds_max},
        ${validatedData.baths_min}, ${validatedData.baths_max},
        ${validatedData.sqft_min}, ${validatedData.sqft_max},
        ${validatedData.lot_sqft_min}, ${validatedData.lot_sqft_max},
        ${validatedData.year_built_min}, ${validatedData.year_built_max},
        ${JSON.stringify(validatedData.property_types)},
        ${validatedData.track_off_market}, ${validatedData.track_price_reductions}, ${validatedData.track_expired},
        ${validatedData.alert_threshold},
        true,
        NOW(), NOW()
      )
      RETURNING *
    `;

    return NextResponse.json(
      { watchlist: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    console.error('Error creating watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to create watchlist' },
      { status: 500 }
    );
  }
}
