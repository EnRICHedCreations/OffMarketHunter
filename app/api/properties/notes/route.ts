import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/properties/notes?property_id=X
 * Get all notes for a property
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

    // Get all notes for this property
    const result = await sql`
      SELECT
        n.id,
        n.note_text,
        n.created_at,
        n.updated_at,
        u.name as author_name
      FROM property_notes n
      INNER JOIN users u ON n.user_id = u.id
      WHERE n.property_id = ${propId}
      ORDER BY n.created_at DESC
    `;

    return NextResponse.json({
      success: true,
      notes: result.rows,
    });
  } catch (error) {
    console.error('Error fetching property notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/properties/notes
 * Create a new note for a property
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { property_id, note_text } = body;

    if (!property_id || !note_text) {
      return NextResponse.json(
        { error: 'property_id and note_text are required' },
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

    // Create the note
    const result = await sql`
      INSERT INTO property_notes (property_id, user_id, note_text)
      VALUES (${propId}, ${userId}, ${note_text})
      RETURNING id, note_text, created_at, updated_at
    `;

    return NextResponse.json({
      success: true,
      note: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating property note:', error);
    return NextResponse.json(
      { error: 'Failed to create note', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/properties/notes?id=X
 * Update an existing note
 */
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('id');

    if (!noteId) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { note_text } = body;

    if (!note_text) {
      return NextResponse.json({ error: 'note_text is required' }, { status: 400 });
    }

    // Verify user owns this note
    const ownerCheck = await sql`
      SELECT n.id
      FROM property_notes n
      WHERE n.id = ${parseInt(noteId)} AND n.user_id = ${userId}
    `;

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Update the note
    const result = await sql`
      UPDATE property_notes
      SET note_text = ${note_text}, updated_at = NOW()
      WHERE id = ${parseInt(noteId)}
      RETURNING id, note_text, created_at, updated_at
    `;

    return NextResponse.json({
      success: true,
      note: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating property note:', error);
    return NextResponse.json(
      { error: 'Failed to update note', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/properties/notes?id=X
 * Delete a note
 */
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('id');

    if (!noteId) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    // Verify user owns this note
    const ownerCheck = await sql`
      SELECT n.id
      FROM property_notes n
      WHERE n.id = ${parseInt(noteId)} AND n.user_id = ${userId}
    `;

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Delete the note
    await sql`
      DELETE FROM property_notes
      WHERE id = ${parseInt(noteId)}
    `;

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting property note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note', details: String(error) },
      { status: 500 }
    );
  }
}
