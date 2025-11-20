import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PropertyInput {
  property_id: string;
  full_street_line: string;
  city: string;
  state: string;
  zip_code: string;
  county?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  lot_sqft?: number | null;
  year_built?: number | null;
  property_type?: string | null;
  current_status: string;
  current_list_price?: number | null;
  list_date?: string | null;
  agent_name?: string | null;
  agent_email?: string | null;
  agent_phone?: string | null;
  broker_name?: string | null;
  mls_id?: string | null;
  primary_photo?: string | null;
  photos?: string[];
  description?: string | null;
  raw_data: any;
}

interface StorePropertiesRequest {
  watchlist_id: number;
  properties: PropertyInput[];
}

export async function POST(request: Request) {
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
    const body: StorePropertiesRequest = await request.json();
    const { watchlist_id, properties } = body;

    if (!watchlist_id || !properties || !Array.isArray(properties)) {
      return NextResponse.json(
        { error: 'Invalid request. watchlist_id and properties array required.' },
        { status: 400 }
      );
    }

    // Verify watchlist ownership
    const watchlistResult = await sql`
      SELECT id FROM watchlists
      WHERE id = ${watchlist_id} AND user_id = ${userId}
    `;

    if (watchlistResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Watchlist not found or access denied' },
        { status: 404 }
      );
    }

    let newCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    // Process each property
    for (const prop of properties) {
      try {
        if (!prop.property_id) {
          errors.push('Property missing property_id');
          continue;
        }

        // Check if property already exists
        const existingProperty = await sql`
          SELECT id, current_list_price, current_status
          FROM properties
          WHERE property_id = ${prop.property_id}
        `;

        if (existingProperty.rows.length > 0) {
          // UPDATE existing property
          await sql`
            UPDATE properties SET
              full_street_line = ${prop.full_street_line},
              city = ${prop.city},
              state = ${prop.state},
              zip_code = ${prop.zip_code},
              county = ${prop.county},
              latitude = ${prop.latitude},
              longitude = ${prop.longitude},
              beds = ${prop.beds},
              baths = ${prop.baths},
              sqft = ${prop.sqft},
              lot_sqft = ${prop.lot_sqft},
              year_built = ${prop.year_built},
              property_type = ${prop.property_type},
              current_status = ${prop.current_status},
              current_list_price = ${prop.current_list_price},
              agent_name = ${prop.agent_name},
              agent_email = ${prop.agent_email},
              agent_phone = ${prop.agent_phone},
              broker_name = ${prop.broker_name},
              mls_id = ${prop.mls_id},
              primary_photo = ${prop.primary_photo},
              photos = ${JSON.stringify(prop.photos || [])},
              description_text = ${prop.description},
              raw_data = ${JSON.stringify(prop.raw_data)},
              updated_at = NOW()
            WHERE property_id = ${prop.property_id}
          `;
          updatedCount++;
        } else {
          // INSERT new property
          await sql`
            INSERT INTO properties (
              property_id,
              watchlist_id,
              full_street_line,
              city,
              state,
              zip_code,
              county,
              latitude,
              longitude,
              beds,
              baths,
              sqft,
              lot_sqft,
              year_built,
              property_type,
              current_status,
              current_list_price,
              original_list_date,
              original_list_price,
              agent_name,
              agent_email,
              agent_phone,
              broker_name,
              mls_id,
              primary_photo,
              photos,
              description_text,
              raw_data,
              created_at,
              updated_at
            ) VALUES (
              ${prop.property_id},
              ${watchlist_id},
              ${prop.full_street_line},
              ${prop.city},
              ${prop.state},
              ${prop.zip_code},
              ${prop.county},
              ${prop.latitude},
              ${prop.longitude},
              ${prop.beds},
              ${prop.baths},
              ${prop.sqft},
              ${prop.lot_sqft},
              ${prop.year_built},
              ${prop.property_type},
              ${prop.current_status},
              ${prop.current_list_price},
              ${prop.list_date || null},
              ${prop.current_list_price},
              ${prop.agent_name},
              ${prop.agent_email},
              ${prop.agent_phone},
              ${prop.broker_name},
              ${prop.mls_id},
              ${prop.primary_photo},
              ${JSON.stringify(prop.photos || [])},
              ${prop.description},
              ${JSON.stringify(prop.raw_data)},
              NOW(),
              NOW()
            )
          `;
          newCount++;
        }
      } catch (err) {
        console.error('Error processing property:', prop.property_id, err);
        errors.push(`Failed to save property ${prop.property_id}: ${String(err)}`);
      }
    }

    // Update watchlist last_scraped_at
    await sql`
      UPDATE watchlists
      SET last_scraped_at = NOW()
      WHERE id = ${watchlist_id}
    `;

    return NextResponse.json({
      success: true,
      new_count: newCount,
      updated_count: updatedCount,
      total_processed: properties.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Error storing properties:', error);
    return NextResponse.json(
      { error: 'Failed to store properties', details: String(error) },
      { status: 500 }
    );
  }
}
