import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time

/**
 * Hourly Cron Job - Status Check
 * Runs every hour to check for property updates:
 * - Status changes (active → off-market, pending → active, etc.)
 * - Price reductions on active listings
 * - Updates property_history table
 *
 * Triggered by Vercel Cron: 0 * * * * (every hour)
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Starting hourly status check...');

    // Get all active watchlists
    const watchlistsResult = await sql`
      SELECT
        w.id,
        w.name,
        w.location,
        w.price_min,
        w.price_max,
        w.beds_min,
        w.beds_max,
        w.user_id
      FROM watchlists w
      WHERE w.is_active = true
      ORDER BY w.last_scraped_at ASC NULLS FIRST
      LIMIT 10
    `;

    const watchlists = watchlistsResult.rows;
    console.log(`[CRON] Found ${watchlists.length} active watchlists to check`);

    let totalUpdated = 0;
    let totalErrors = 0;
    const errors: string[] = [];

    // Process each watchlist
    for (const watchlist of watchlists) {
      try {
        console.log(`[CRON] Checking watchlist: ${watchlist.name} (ID: ${watchlist.id})`);

        // Get existing properties for this watchlist to check for updates
        const propertiesResult = await sql`
          SELECT property_id, current_status, current_list_price
          FROM properties
          WHERE watchlist_id = ${watchlist.id}
          LIMIT 100
        `;

        if (propertiesResult.rows.length === 0) {
          console.log(`[CRON] No properties to check for watchlist ${watchlist.id}`);
          continue;
        }

        // Build criteria for scraping
        const criteria = {
          location: watchlist.location,
          price_min: watchlist.price_min,
          price_max: watchlist.price_max,
          beds_min: watchlist.beds_min,
          beds_max: watchlist.beds_max,
        };

        // Scrape for updated property data (for-sale listings only for status checks)
        // Use internal localhost to bypass Vercel deployment protection
        const scrapeResponse = await fetch(`http://localhost:3000/api/scrape`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'for_sale',
            criteria: criteria,
          }),
        });

        if (!scrapeResponse.ok) {
          throw new Error(`Scrape failed with status ${scrapeResponse.status}`);
        }

        const scrapeResult = await scrapeResponse.json();

        if (scrapeResult.success && scrapeResult.properties?.length > 0) {
          // Store updated properties (this will detect changes automatically)
          const storeResponse = await fetch(`http://localhost:3000/api/properties/store`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${cronSecret}`, // Internal auth
            },
            body: JSON.stringify({
              watchlist_id: watchlist.id,
              properties: scrapeResult.properties,
            }),
          });

          const storeResult = await storeResponse.json();

          if (storeResponse.ok && storeResult.success) {
            totalUpdated += storeResult.updated_count || 0;
            console.log(`[CRON] Updated ${storeResult.updated_count} properties for watchlist ${watchlist.id}`);
          }
        }

        // Update last_scraped_at
        await sql`
          UPDATE watchlists
          SET last_scraped_at = NOW()
          WHERE id = ${watchlist.id}
        `;

      } catch (err) {
        console.error(`[CRON] Error processing watchlist ${watchlist.id}:`, err);
        totalErrors++;
        errors.push(`Watchlist ${watchlist.id}: ${String(err)}`);
      }
    }

    console.log(`[CRON] Hourly status check complete. Updated: ${totalUpdated}, Errors: ${totalErrors}`);

    return NextResponse.json({
      success: true,
      watchlists_checked: watchlists.length,
      properties_updated: totalUpdated,
      errors_count: totalErrors,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('[CRON] Fatal error in hourly status check:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: String(error) },
      { status: 500 }
    );
  }
}
