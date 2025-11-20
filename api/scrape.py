from http.server import BaseHTTPRequestHandler
import json
from homeharvest import scrape_property
import traceback

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
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
                'limit': 100,
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
                        'full_street_line': prop.get('street', ''),
                        'city': prop.get('city', ''),
                        'state': prop.get('state', ''),
                        'zip_code': str(prop.get('zip_code', '')),
                        'county': prop.get('county'),
                        'latitude': prop.get('latitude'),
                        'longitude': prop.get('longitude'),
                        'beds': prop.get('beds'),
                        'baths': prop.get('baths'),
                        'sqft': prop.get('sqft'),
                        'lot_sqft': prop.get('lot_sqft'),
                        'year_built': prop.get('year_built'),
                        'property_type': prop.get('property_type'),
                        'current_status': prop.get('status', 'off_market'),
                        'current_list_price': prop.get('list_price'),
                        'list_date': prop.get('list_date'),
                        'agent_name': prop.get('agent_name'),
                        'agent_email': prop.get('agent_email'),
                        'agent_phone': prop.get('agent_phone'),
                        'broker_name': prop.get('broker_name'),
                        'mls_id': prop.get('mls_id'),
                        'primary_photo': prop.get('primary_photo'),
                        'photos': prop.get('photos', []),
                        'description': prop.get('description'),
                        'raw_data': {
                            'original_list_price': prop.get('original_list_price'),
                            'days_on_market': prop.get('days_on_mls'),
                            'price_reduction_count': prop.get('price_reduction_count'),
                            'off_market_date': prop.get('off_market_date'),
                            'last_sold_date': prop.get('last_sold_date'),
                            'last_sold_price': prop.get('last_sold_price'),
                            'hoa_fee': prop.get('hoa_fee'),
                            'stories': prop.get('stories'),
                            'garage': prop.get('garage'),
                            'pool': prop.get('pool'),
                            'style': prop.get('style'),
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
