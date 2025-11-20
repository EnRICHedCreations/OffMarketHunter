// Scraper utility for HomeHarvest Elite integration
// Calls Python script to scrape property data from Realtor.com

import { spawn } from 'child_process';
import path from 'path';

interface WatchlistCriteria {
  location: string;
  price_min?: number | null;
  price_max?: number | null;
  beds_min?: number | null;
  beds_max?: number | null;
  baths_min?: number | null;
  baths_max?: number | null;
  sqft_min?: number | null;
  sqft_max?: number | null;
  lot_sqft_min?: number | null;
  lot_sqft_max?: number | null;
  year_built_min?: number | null;
  year_built_max?: number | null;
  property_types?: string[] | null;
}

interface ScrapedProperty {
  property_id: string;
  full_street_line: string;
  city: string;
  state: string;
  zip_code: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  lot_sqft?: number;
  year_built?: number;
  property_type?: string;
  current_status: string;
  current_list_price?: number;
  list_date?: string;
  agent_name?: string;
  agent_email?: string;
  agent_phone?: string;
  broker_name?: string;
  mls_id?: string;
  primary_photo?: string;
  photos?: string[];
  description?: string;
  raw_data: any;
}

async function callPythonScraper(
  scrapeType: 'off_market' | 'active',
  criteria: WatchlistCriteria,
  updatedHours?: number
): Promise<ScrapedProperty[]> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'scrape_properties.py');

    // Prepare input data
    const inputData = {
      type: scrapeType,
      criteria: {
        location: criteria.location,
        price_min: criteria.price_min,
        price_max: criteria.price_max,
        beds_min: criteria.beds_min,
        beds_max: criteria.beds_max,
        baths_min: criteria.baths_min,
        baths_max: criteria.baths_max,
        sqft_min: criteria.sqft_min,
        sqft_max: criteria.sqft_max,
        lot_sqft_min: criteria.lot_sqft_min,
        lot_sqft_max: criteria.lot_sqft_max,
        year_built_min: criteria.year_built_min,
        year_built_max: criteria.year_built_max,
        property_types: criteria.property_types,
      },
      updated_hours: updatedHours,
    };

    // Spawn Python process
    const python = spawn('python', [scriptPath]);

    let stdout = '';
    let stderr = '';

    // Send input data to Python script
    python.stdin.write(JSON.stringify(inputData));
    python.stdin.end();

    // Collect output
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle completion
    python.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script error:', stderr);
        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);

        if (!result.success) {
          reject(new Error(result.error || 'Unknown error from Python script'));
          return;
        }

        resolve(result.properties || []);
      } catch (error) {
        reject(new Error(`Failed to parse Python output: ${error}`));
      }
    });

    // Handle errors
    python.on('error', (error) => {
      reject(new Error(`Failed to start Python script: ${error.message}`));
    });
  });
}

export async function scrapeOffMarketProperties(
  criteria: WatchlistCriteria
): Promise<ScrapedProperty[]> {
  console.log('Scraping off-market properties for:', criteria.location);

  try {
    const properties = await callPythonScraper('off_market', criteria);
    console.log(`Found ${properties.length} off-market properties`);
    return properties;
  } catch (error) {
    console.error('Error scraping properties:', error);
    throw error;
  }
}

export async function scrapeActiveProperties(
  criteria: WatchlistCriteria,
  updatedInPastHours: number = 24
): Promise<ScrapedProperty[]> {
  console.log(`Scraping active properties updated in past ${updatedInPastHours} hours`);

  try {
    const properties = await callPythonScraper('active', criteria, updatedInPastHours);
    console.log(`Found ${properties.length} recently updated properties`);
    return properties;
  } catch (error) {
    console.error('Error scraping active properties:', error);
    throw error;
  }
}
