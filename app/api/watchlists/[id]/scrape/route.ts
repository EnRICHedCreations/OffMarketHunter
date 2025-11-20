import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';
import { scrapeOffMarketProperties } from '@/lib/scraper';

// POST /api/watchlists/[id]/scrape - Trigger scraping for a watchlist
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get watchlist with ownership verification
    const watchlistResult = await sql`
      SELECT * FROM watchlists
      WHERE id = ${id} AND user_id = ${session.user.id} AND is_active = true
    `;

    if (watchlistResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Watchlist not found or inactive' },
        { status: 404 }
      );
    }

    const watchlist = watchlistResult.rows[0];

    // Scrape properties
    const scrapedProperties = await scrapeOffMarketProperties({
      location: watchlist.location,
      price_min: watchlist.price_min,
      price_max: watchlist.price_max,
      beds_min: watchlist.beds_min,
      beds_max: watchlist.beds_max,
      baths_min: watchlist.baths_min,
      baths_max: watchlist.baths_max,
      sqft_min: watchlist.sqft_min,
      sqft_max: watchlist.sqft_max,
      lot_sqft_min: watchlist.lot_sqft_min,
      lot_sqft_max: watchlist.lot_sqft_max,
      year_built_min: watchlist.year_built_min,
      year_built_max: watchlist.year_built_max,
      property_types: watchlist.property_types,
    });

    // Store properties in database
    let newCount = 0;
    let updatedCount = 0;

    for (const property of scrapedProperties) {
      // Check if property already exists
      const existingResult = await sql`
        SELECT id FROM properties
        WHERE property_id = ${property.property_id}
      `;

      if (existingResult.rows.length > 0) {
        // Update existing property
        await sql`
          UPDATE properties
          SET
            current_status = ${property.current_status},
            current_list_price = ${property.current_list_price},
            beds = ${property.beds},
            baths = ${property.baths},
            sqft = ${property.sqft},
            lot_sqft = ${property.lot_sqft},
            year_built = ${property.year_built},
            agent_name = ${property.agent_name},
            agent_email = ${property.agent_email},
            agent_phone = ${property.agent_phone},
            broker_name = ${property.broker_name},
            primary_photo = ${property.primary_photo},
            photos = ${JSON.stringify(property.photos)},
            description_text = ${property.description},
            raw_data = ${JSON.stringify(property.raw_data)},
            updated_at = NOW()
          WHERE property_id = ${property.property_id}
        `;
        updatedCount++;
      } else {
        // Insert new property
        await sql`
          INSERT INTO properties (
            property_id, watchlist_id,
            full_street_line, city, state, zip_code, county,
            latitude, longitude,
            beds, baths, sqft, lot_sqft, year_built, property_type,
            current_status, current_list_price,
            original_list_date, original_list_price,
            agent_name, agent_email, agent_phone, broker_name,
            mls_id,
            primary_photo, photos,
            description_text,
            raw_data,
            created_at, updated_at
          )
          VALUES (
            ${property.property_id}, ${id},
            ${property.full_street_line}, ${property.city}, ${property.state}, ${property.zip_code}, ${property.county},
            ${property.latitude}, ${property.longitude},
            ${property.beds}, ${property.baths}, ${property.sqft}, ${property.lot_sqft}, ${property.year_built}, ${property.property_type},
            ${property.current_status}, ${property.current_list_price},
            ${property.list_date}, ${property.raw_data?.original_list_price || property.current_list_price},
            ${property.agent_name}, ${property.agent_email}, ${property.agent_phone}, ${property.broker_name},
            ${property.mls_id},
            ${property.primary_photo}, ${JSON.stringify(property.photos)},
            ${property.description},
            ${JSON.stringify(property.raw_data)},
            NOW(), NOW()
          )
        `;
        newCount++;
      }
    }

    // Update watchlist last_scraped_at
    await sql`
      UPDATE watchlists
      SET last_scraped_at = NOW(), updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({
      success: true,
      scraped: scrapedProperties.length,
      new: newCount,
      updated: updatedCount,
      message: `Found ${scrapedProperties.length} properties (${newCount} new, ${updatedCount} updated)`,
    });
  } catch (error) {
    console.error('Error scraping properties:', error);
    return NextResponse.json(
      { error: 'Failed to scrape properties' },
      { status: 500 }
    );
  }
}
