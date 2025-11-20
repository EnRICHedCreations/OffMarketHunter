from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add HomeHarvest Elite to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'HomeHarvest Elite'))

try:
    from homeharvest import scrape_property
    import pandas as pd
except ImportError as e:
    print(f"Import error: {e}")

def safe_int(value):
    """Convert to int, handling NaN and None"""
    if pd.isna(value) or value is None:
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None

def safe_float(value):
    """Convert to float, handling NaN and None"""
    if pd.isna(value) or value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None

def safe_str(value):
    """Convert to string, handling NaN and None"""
    if pd.isna(value) or value is None:
        return None
    return str(value)

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length)
        data = json.loads(body)

        try:
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
                properties = []
                for _, row in df.iterrows():
                    prop = {
                        'property_id': safe_str(row.get('property_id')) or '',
                        'full_street_line': safe_str(row.get('full_street_line')) or '',
                        'city': safe_str(row.get('city')) or '',
                        'state': safe_str(row.get('state')) or '',
                        'zip_code': safe_str(row.get('zip_code')) or '',
                        'county': safe_str(row.get('county')),
                        'latitude': safe_float(row.get('latitude')),
                        'longitude': safe_float(row.get('longitude')),
                        'beds': safe_int(row.get('beds')),
                        'baths': safe_float(row.get('baths')),
                        'sqft': safe_int(row.get('sqft')),
                        'lot_sqft': safe_int(row.get('lot_sqft')),
                        'year_built': safe_int(row.get('year_built')),
                        'property_type': safe_str(row.get('property_type')),
                        'current_status': safe_str(row.get('status')) or 'off_market',
                        'current_list_price': safe_float(row.get('list_price')),
                        'list_date': safe_str(row.get('list_date')),
                        'agent_name': safe_str(row.get('agent_name')),
                        'agent_email': safe_str(row.get('agent_email')),
                        'agent_phone': safe_str(row.get('agent_phone')),
                        'broker_name': safe_str(row.get('broker_name')),
                        'mls_id': safe_str(row.get('mls_id')),
                        'primary_photo': safe_str(row.get('primary_photo')),
                        'photos': row.get('photos', []) if not pd.isna(row.get('photos')) else [],
                        'description': safe_str(row.get('description')),
                        'raw_data': {
                            'original_list_price': safe_float(row.get('original_list_price')),
                            'days_on_market': safe_int(row.get('days_on_market')),
                            'price_reduction_count': safe_int(row.get('price_reduction_count')),
                            'off_market_date': safe_str(row.get('off_market_date')),
                            'last_sold_date': safe_str(row.get('last_sold_date')),
                            'last_sold_price': safe_float(row.get('last_sold_price')),
                            'hoa_fee': safe_float(row.get('hoa_fee')),
                            'stories': safe_int(row.get('stories')),
                            'garage': safe_str(row.get('garage')),
                            'pool': safe_str(row.get('pool')),
                            'style': safe_str(row.get('style')),
                        }
                    }
                    properties.append(prop)

                result = {
                    "success": True,
                    "properties": properties,
                    "count": len(properties)
                }

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())

        except Exception as e:
            error_result = {
                "success": False,
                "error": str(e)
            }
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(error_result).encode())
