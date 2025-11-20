# Python Setup for Property Scraping

OffMarket Hunter uses [HomeHarvest Elite](https://github.com/EnRICHedCreations/HomeHarvestElite) to scrape property data from Realtor.com.

## Requirements

- Python 3.8 or higher
- pip (Python package manager)

## Setup Instructions

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- `pandas` - Data manipulation
- `requests` - HTTP requests

### 2. HomeHarvest Elite Setup

HomeHarvest Elite should be cloned inside the offmarkethunter directory:

```
offmarkethunter/
├── HomeHarvest Elite/    # HomeHarvest Elite repository
├── scripts/               # Python scraper scripts
├── app/                   # Next.js app
└── ...
```

If not present, clone it from the offmarkethunter directory:

```bash
git clone https://github.com/EnRICHedCreations/HomeHarvestElite.git "HomeHarvest Elite"
```

### 3. Test Python Setup

Test that the scraper script works:

```bash
# On Windows
python scripts/scrape_properties.py

# On Mac/Linux
python3 scripts/scrape_properties.py
```

You should see a JSON response (it expects input, so it will error, but Python should run).

## How It Works

1. Next.js API routes call `lib/scraper.ts`
2. TypeScript spawns a Python child process: `scripts/scrape_properties.py`
3. Python script imports HomeHarvest Elite
4. Scrapes Realtor.com data
5. Returns JSON results to Node.js
6. Results are stored in PostgreSQL database

## Troubleshooting

### Python not found
- Make sure Python is installed and in your PATH
- Try `python3` instead of `python`
- Verify: `python --version` or `python3 --version`

### HomeHarvest Elite not found
- Ensure it's cloned in the offmarkethunter directory
- Check the path in `scripts/scrape_properties.py`
- The script looks for: `../HomeHarvest Elite` (relative to scripts/ directory)

### pandas/requests not installed
```bash
pip install pandas requests
# or
pip3 install pandas requests
```

## Production Deployment

For Vercel deployment, you have two options:

### Option 1: External Python Service
Deploy the Python scraper as a separate service (e.g., AWS Lambda, Railway, Render) and have Next.js call it via HTTP.

### Option 2: Vercel Serverless Functions (Limited)
Vercel has limited Python support. The current setup works best for local development and self-hosted deployments.

### Option 3: Pre-built Python Runtime
Package Python with your Next.js app using Docker for consistent deployment.

## Environment Variables

No additional environment variables needed for Python scraping. The script uses HomeHarvest Elite's built-in authentication.

## API Rate Limits

HomeHarvest Elite uses Realtor.com's public GraphQL API with built-in rate limiting and retry logic. No API keys required.
