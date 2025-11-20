# Cron Jobs Setup Guide

This document explains how to set up and test the automated cron jobs for OffMarket Hunter.

## Overview

OffMarket Hunter uses two automated cron jobs to keep property data up-to-date:

1. **Hourly Status Check** - Runs every hour to check for property updates (status changes, price reductions)
2. **Daily Off-Market Scan** - Runs once daily at 2 AM to scan for new off-market and active listings

## Setup

### 1. Set Environment Variable

Add the `CRON_SECRET` environment variable to your Vercel project:

```bash
# Generate a random secret (32+ characters recommended)
openssl rand -base64 32

# Add to Vercel
vercel env add CRON_SECRET
```

Or add it manually in the Vercel Dashboard:
- Go to your project settings
- Navigate to Environment Variables
- Add `CRON_SECRET` with a secure random string

### 2. Deploy to Vercel

The `vercel.json` file already contains the cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron/hourly-status-check",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/daily-off-market-scan",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Deploy to Vercel:
```bash
git add .
git commit -m "Add cron jobs"
git push
```

Vercel will automatically detect the cron configuration and set up the scheduled jobs.

### 3. Verify Cron Jobs

After deployment:
1. Go to Vercel Dashboard → Your Project → Cron Jobs
2. You should see both cron jobs listed
3. Check the schedule and last execution time

## Testing Cron Jobs

### Local Testing

You can test the cron endpoints locally by calling them directly:

```bash
# Set CRON_SECRET in your .env file first
CRON_SECRET=your-secret-here

# Test hourly status check
curl -X GET http://localhost:3000/api/cron/hourly-status-check \
  -H "Authorization: Bearer your-secret-here"

# Test daily off-market scan
curl -X GET http://localhost:3000/api/cron/daily-off-market-scan \
  -H "Authorization: Bearer your-secret-here"
```

### Production Testing

Test on Vercel:

```bash
# Get your deployment URL
VERCEL_URL=your-app.vercel.app
CRON_SECRET=your-production-secret

# Test hourly status check
curl -X GET https://$VERCEL_URL/api/cron/hourly-status-check \
  -H "Authorization: Bearer $CRON_SECRET"

# Test daily off-market scan
curl -X GET https://$VERCEL_URL/api/cron/daily-off-market-scan \
  -H "Authorization: Bearer $CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "watchlists_checked": 5,
  "properties_updated": 12,
  "errors_count": 0
}
```

## How Cron Jobs Work

### Hourly Status Check (`0 * * * *`)

**Purpose**: Check for property updates on active listings

**Process**:
1. Gets all active watchlists (up to 10 per run)
2. Scans for-sale listings using existing criteria
3. Compares with stored properties
4. Detects:
   - Status changes (e.g., active → off-market)
   - Price reductions
5. Updates `property_history` table automatically
6. Updates `last_scraped_at` timestamp

**Runtime**: ~30-60 seconds per watchlist

### Daily Off-Market Scan (`0 2 * * *`)

**Purpose**: Comprehensive daily scan for new opportunities

**Process**:
1. Gets all active watchlists
2. Scans BOTH off-market AND for-sale listings
3. Saves new properties to database
4. Updates existing properties
5. Auto-calculates motivation scores for all properties
6. Updates `last_scraped_at` timestamp

**Runtime**: ~60-120 seconds per watchlist

**Schedule**: 2:00 AM daily (low-traffic time)

## Monitoring

### Check Cron Logs

View cron execution logs in Vercel:
1. Go to Vercel Dashboard → Your Project → Logs
2. Filter by `/api/cron/`
3. Look for `[CRON]` prefix in logs

### Common Log Messages

**Success**:
```
[CRON] Starting hourly status check...
[CRON] Found 5 active watchlists to check
[CRON] Checking watchlist: Miami Beach Deals (ID: 3)
[CRON] Updated 8 properties for watchlist 3
[CRON] Hourly status check complete. Updated: 42, Errors: 0
```

**Errors**:
```
[CRON] Error processing watchlist 3: Failed to scrape
[CRON] Error scoring properties for watchlist 5: Database timeout
```

## Troubleshooting

### Cron Jobs Not Running

1. **Check Environment Variable**
   - Verify `CRON_SECRET` is set in Vercel
   - Ensure it matches between cron jobs and API endpoints

2. **Check Deployment**
   - Ensure `vercel.json` is committed and deployed
   - Verify cron jobs appear in Vercel Dashboard

3. **Check Logs**
   - Look for authentication errors (401)
   - Check for timeout errors (increase `maxDuration`)

### Cron Jobs Running But Failing

1. **Database Connection**
   - Verify `POSTGRES_URL` is set correctly
   - Check Vercel Postgres limits

2. **Scraping Errors**
   - Check if HomeHarvest API is working
   - Verify location strings are valid

3. **Timeout Issues**
   - Reduce watchlist limit in query
   - Increase `maxDuration` in route (max 300s)

## Rate Limiting

**Hourly Status Check**:
- Processes up to 10 watchlists per run
- Oldest `last_scraped_at` checked first
- Prevents overwhelming the scraper

**Daily Off-Market Scan**:
- Processes all active watchlists
- Runs during low-traffic hours (2 AM)
- Includes auto-scoring

## Security

- Cron endpoints require `Authorization: Bearer <CRON_SECRET>` header
- Only Vercel's cron service should call these endpoints
- Keep `CRON_SECRET` secure and rotate periodically
- Internal API calls also use `CRON_SECRET` for authentication

## Performance Tips

1. **Limit Watchlists**: Don't create too many watchlists per user
2. **Use Filters**: Narrow search criteria to reduce property count
3. **Monitor Logs**: Watch for slow queries or timeouts
4. **Adjust Schedule**: If needed, change cron frequency in `vercel.json`

## Next Steps

After setting up cron jobs, you can:
- Monitor the first few executions
- Check database for updated properties
- Verify property_history entries are created
- Test motivation score calculations
- Set up alerts (Phase 8) to notify users of high-scoring properties
