import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time

/**
 * Daily Cron Job - Off-Market Scan
 * Runs once per day to scan for new off-market properties:
 * - Scans all active watchlists for off-market listings
 * - Saves new properties to database
 * - Auto-calculates motivation scores for new properties
 *
 * Triggered by Vercel Cron: 0 2 * * * (daily at 2 AM)
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

    console.log('[CRON] Starting daily off-market scan...');

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
        w.user_id,
        w.track_off_market
      FROM watchlists w
      WHERE w.is_active = true
      ORDER BY w.last_scraped_at ASC NULLS FIRST
    `;

    const watchlists = watchlistsResult.rows;
    console.log(`[CRON] Found ${watchlists.length} active watchlists to scan`);

    let totalNew = 0;
    let totalUpdated = 0;
    let totalScored = 0;
    let totalErrors = 0;
    const errors: string[] = [];

    // Process each watchlist
    for (const watchlist of watchlists) {
      try {
        // Skip if watchlist doesn't track off-market
        if (!watchlist.track_off_market) {
          console.log(`[CRON] Skipping watchlist ${watchlist.id} - not tracking off-market`);
          continue;
        }

        console.log(`[CRON] Scanning watchlist: ${watchlist.name} (ID: ${watchlist.id})`);

        // Build criteria for scraping
        const criteria = {
          location: watchlist.location,
          price_min: watchlist.price_min,
          price_max: watchlist.price_max,
          beds_min: watchlist.beds_min,
          beds_max: watchlist.beds_max,
        };

        // Scan for both off-market and active listings
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const scanTypes = ['off_market', 'for_sale'];

        for (const scanType of scanTypes) {
          try {
            // Call scrape API - it's public for user-triggered scans
            const scrapeResponse = await fetch(`${baseUrl}/api/scrape`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: scanType,
                criteria: criteria,
              }),
            });

            if (!scrapeResponse.ok) {
              throw new Error(`Scrape failed with status ${scrapeResponse.status}`);
            }

            const scrapeResult = await scrapeResponse.json();

            if (scrapeResult.success && scrapeResult.properties?.length > 0) {
              // Store properties
              const storeResponse = await fetch(`${baseUrl}/api/properties/store`, {
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
                totalNew += storeResult.new_count || 0;
                totalUpdated += storeResult.updated_count || 0;
                console.log(`[CRON] ${scanType} - Saved ${storeResult.new_count} new, updated ${storeResult.updated_count} for watchlist ${watchlist.id}`);
              }
            }
          } catch (err) {
            console.error(`[CRON] Error scanning ${scanType} for watchlist ${watchlist.id}:`, err);
            errors.push(`Watchlist ${watchlist.id} (${scanType}): ${String(err)}`);
          }
        }

        // Auto-calculate motivation scores for this watchlist's properties
        try {
          const scoreResponse = await fetch(`${baseUrl}/api/properties/score`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${cronSecret}`, // Internal auth
            },
            body: JSON.stringify({
              watchlist_id: watchlist.id,
            }),
          });

          const scoreResult = await scoreResponse.json();

          if (scoreResponse.ok && scoreResult.success) {
            totalScored += scoreResult.scored_count || 0;
            console.log(`[CRON] Scored ${scoreResult.scored_count} properties for watchlist ${watchlist.id}`);
          }
        } catch (err) {
          console.error(`[CRON] Error scoring properties for watchlist ${watchlist.id}:`, err);
          errors.push(`Scoring watchlist ${watchlist.id}: ${String(err)}`);
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

    console.log(`[CRON] Daily scan complete. New: ${totalNew}, Updated: ${totalUpdated}, Scored: ${totalScored}, Errors: ${totalErrors}`);

    return NextResponse.json({
      success: true,
      watchlists_scanned: watchlists.length,
      properties_new: totalNew,
      properties_updated: totalUpdated,
      properties_scored: totalScored,
      errors_count: totalErrors,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('[CRON] Fatal error in daily off-market scan:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: String(error) },
      { status: 500 }
    );
  }
}
