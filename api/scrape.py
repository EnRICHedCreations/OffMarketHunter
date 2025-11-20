from http.server import BaseHTTPRequestHandler
import json
import math
import os
from homeharvest import scrape_property
import traceback

def clean_value(val):
    """Convert NaN and other invalid JSON values to None"""
    if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
        return None
    return val

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Check for internal cron authentication (optional - allows public OR cron access)
            # This endpoint is intentionally public for user-triggered scans,
            # but also accepts CRON_SECRET for automated scans

            # Get request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)

            scrape_type = data.get('type', 'off_market')
            criteria = data.get('criteria', {})

            # Build scrape parameters
            params = {
                'location': criteria['location'],
                'listing_type': 'off_market' if scrape_type == 'off_market' else 'for_sale',
                'limit': 1000,  # Increased from 100 to fetch more properties
            }

            # Add filters
            if criteria.get('price_min'):
                params['price_min'] = criteria['price_min']
            if criteria.get('price_max'):
                params['price_max'] = criteria['price_max']
            if criteria.get('beds_min'):
                params['beds_min'] = criteria['beds_min']
            if criteria.get('beds_max'):
                params['beds_max'] = criteria['beds_max']
            if criteria.get('baths_min'):
                params['baths_min'] = criteria['baths_min']
            if criteria.get('baths_max'):
                params['baths_max'] = criteria['baths_max']
            if criteria.get('sqft_min'):
                params['sqft_min'] = criteria['sqft_min']
            if criteria.get('sqft_max'):
                params['sqft_max'] = criteria['sqft_max']
            if criteria.get('property_types'):
                params['property_type'] = ','.join(criteria['property_types'])

            if scrape_type == 'active':
                params['updated_in_past_hours'] = data.get('updated_hours', 24)

            print(f"Scraping with params: {params}")

            # Scrape properties
            df = scrape_property(**params)

            if df is None or len(df) == 0:
                result = {
                    "success": True,
                    "properties": [],
                    "count": 0
                }
            else:
                # Convert DataFrame to list of dictionaries
                props_list = df.to_dict('records')

                # Transform to match our expected format
                properties = []
                for prop in props_list:
                    properties.append({
                        'property_id': str(prop.get('property_id', '')),
                        'full_street_line': clean_value(prop.get('street')) or '',
                        'city': clean_value(prop.get('city')) or '',
                        'state': clean_value(prop.get('state')) or '',
                        'zip_code': str(clean_value(prop.get('zip_code')) or ''),
                        'county': clean_value(prop.get('county')),
                        'latitude': clean_value(prop.get('latitude')),
                        'longitude': clean_value(prop.get('longitude')),
                        'beds': clean_value(prop.get('beds')),
                        'baths': clean_value(prop.get('baths')),
                        'sqft': clean_value(prop.get('sqft')),
                        'lot_sqft': clean_value(prop.get('lot_sqft')),
                        'year_built': clean_value(prop.get('year_built')),
                        'property_type': clean_value(prop.get('property_type')),
                        'current_status': clean_value(prop.get('status')) or 'off_market',
                        'current_list_price': clean_value(prop.get('list_price')),
                        'list_date': clean_value(prop.get('list_date')),
                        'agent_name': clean_value(prop.get('agent_name')),
                        'agent_email': clean_value(prop.get('agent_email')),
                        'agent_phone': clean_value(prop.get('agent_phone')),
                        'broker_name': clean_value(prop.get('broker_name')),
                        'mls_id': clean_value(prop.get('mls_id')),
                        'primary_photo': clean_value(prop.get('primary_photo')),
                        'photos': prop.get('photos', []) if not isinstance(prop.get('photos'), float) else [],
                        'description': clean_value(prop.get('description')),
                        'raw_data': {
                            'original_list_price': clean_value(prop.get('original_list_price')),
                            'days_on_market': clean_value(prop.get('days_on_mls')),
                            'price_reduction_count': clean_value(prop.get('price_reduction_count')),
                            'off_market_date': clean_value(prop.get('off_market_date')),
                            'last_sold_date': clean_value(prop.get('last_sold_date')),
                            'last_sold_price': clean_value(prop.get('last_sold_price')),
                            'hoa_fee': clean_value(prop.get('hoa_fee')),
                            'stories': clean_value(prop.get('stories')),
                            'garage': clean_value(prop.get('garage')),
                            'pool': clean_value(prop.get('pool')),
                            'style': clean_value(prop.get('style')),
                        }
                    })

                result = {
                    "success": True,
                    "properties": properties,
                    "count": len(properties)
                }

            print(f"Scraped {result['count']} properties")

            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())

        except Exception as e:
            print(f"Error: {str(e)}")
            print(traceback.format_exc())

            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()

            error_result = {
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            }
            self.wfile.write(json.dumps(error_result).encode())
