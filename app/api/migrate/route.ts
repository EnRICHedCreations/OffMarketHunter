import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/migrate
 * Run database migrations (admin only)
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run phase 12 migration
    await sql`
      -- Property notes table
      CREATE TABLE IF NOT EXISTS property_notes (
          id SERIAL PRIMARY KEY,
          property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          note_text TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      -- Property interest tracking table
      CREATE TABLE IF NOT EXISTS property_interest (
          id SERIAL PRIMARY KEY,
          property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          interest_level VARCHAR(50) DEFAULT 'interested',
          notes TEXT,
          marked_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(property_id, user_id)
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_notes_property ON property_notes(property_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notes_user ON property_notes(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_interest_property ON property_interest(property_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_interest_user ON property_interest(user_id, marked_at DESC)`;

    // Fix numeric field overflows
    await sql`
      ALTER TABLE properties
        ALTER COLUMN motivation_score TYPE DECIMAL(6, 2),
        ALTER COLUMN motivation_score_dom TYPE DECIMAL(6, 2),
        ALTER COLUMN motivation_score_reductions TYPE DECIMAL(6, 2),
        ALTER COLUMN motivation_score_off_market TYPE DECIMAL(6, 2),
        ALTER COLUMN motivation_score_status TYPE DECIMAL(6, 2),
        ALTER COLUMN motivation_score_market TYPE DECIMAL(6, 2)
    `;

    await sql`ALTER TABLE properties ALTER COLUMN total_price_reduction_percent TYPE DECIMAL(6, 2)`;
    await sql`ALTER TABLE property_history ALTER COLUMN price_change_percent TYPE DECIMAL(6, 2)`;
    await sql`ALTER TABLE properties ALTER COLUMN lot_sqft TYPE BIGINT`;
    await sql`ALTER TABLE alerts ALTER COLUMN motivation_score TYPE DECIMAL(6, 2)`;

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    );
  }
}
