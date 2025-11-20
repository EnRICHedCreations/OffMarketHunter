#!/usr/bin/env python3
"""
Property scraping script using HomeHarvest Elite
Accepts JSON input and returns scraped properties as JSON
"""

import sys
import json
import os

# Add HomeHarvest Elite to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'HomeHarvest Elite'))

try:
    from homeharvest import scrape_property
except ImportError:
    print(json.dumps({"error": "HomeHarvest Elite not found. Please ensure it's in the parent directory."}))
    sys.exit(1)


def scrape_off_market(criteria):
    """
    Scrape off-market properties using HomeHarvest Elite

    Args:
        criteria: Dict with location, price_min, price_max, beds_min, beds_max, etc.

    Returns:
        List of property dictionaries
    """
    try:
        # Build scrape parameters
        params = {
            'location': criteria['location'],
            'listing_type': 'off_market',  # HomeHarvest Elite feature
            'limit': 100,  # Reasonable limit per scan
        }

        # Add price filters
        if criteria.get('price_min'):
            params['price_min'] = criteria['price_min']
        if criteria.get('price_max'):
            params['price_max'] = criteria['price_max']

        # Add bed/bath filters
        if criteria.get('beds_min'):
            params['beds_min'] = criteria['beds_min']
        if criteria.get('beds_max'):
            params['beds_max'] = criteria['beds_max']
        if criteria.get('baths_min'):
            params['baths_min'] = criteria['baths_min']
        if criteria.get('baths_max'):
            params['baths_max'] = criteria['baths_max']

        # Add sqft filters
        if criteria.get('sqft_min'):
            params['sqft_min'] = criteria['sqft_min']
        if criteria.get('sqft_max'):
            params['sqft_max'] = criteria['sqft_max']

        # Add lot size filters
        if criteria.get('lot_sqft_min'):
            params['lot_sqft_min'] = criteria['lot_sqft_min']
        if criteria.get('lot_sqft_max'):
            params['lot_sqft_max'] = criteria['lot_sqft_max']

        # Add year built filters
        if criteria.get('year_built_min'):
            params['year_built_min'] = criteria['year_built_min']
        if criteria.get('year_built_max'):
            params['year_built_max'] = criteria['year_built_max']

        # Add property types
        if criteria.get('property_types'):
            # HomeHarvest Elite uses property_type parameter
            # Convert our array to comma-separated string
            params['property_type'] = ','.join(criteria['property_types'])

        # Scrape properties
        df = scrape_property(**params)

        if df is None or len(df) == 0:
            return []

        # Convert DataFrame to list of dictionaries
        properties = []
        for _, row in df.iterrows():
            prop = {
                'property_id': str(row.get('property_id', '')),
                'full_street_line': row.get('full_street_line', ''),
                'city': row.get('city', ''),
                'state': row.get('state', ''),
                'zip_code': str(row.get('zip_code', '')),
                'county': row.get('county'),
                'latitude': float(row['latitude']) if 'latitude' in row and row['latitude'] is not None else None,
                'longitude': float(row['longitude']) if 'longitude' in row and row['longitude'] is not None else None,
                'beds': int(row['beds']) if 'beds' in row and row['beds'] is not None else None,
                'baths': float(row['baths']) if 'baths' in row and row['baths'] is not None else None,
                'sqft': int(row['sqft']) if 'sqft' in row and row['sqft'] is not None else None,
                'lot_sqft': int(row['lot_sqft']) if 'lot_sqft' in row and row['lot_sqft'] is not None else None,
                'year_built': int(row['year_built']) if 'year_built' in row and row['year_built'] is not None else None,
                'property_type': row.get('property_type'),
                'current_status': row.get('status', 'off_market'),
                'current_list_price': float(row['list_price']) if 'list_price' in row and row['list_price'] is not None else None,
                'list_date': row.get('list_date'),
                'agent_name': row.get('agent_name'),
                'agent_email': row.get('agent_email'),
                'agent_phone': row.get('agent_phone'),
                'broker_name': row.get('broker_name'),
                'mls_id': row.get('mls_id'),
                'primary_photo': row.get('primary_photo'),
                'photos': row.get('photos', []),
                'description': row.get('description'),
                'raw_data': {
                    'original_list_price': float(row['original_list_price']) if 'original_list_price' in row and row['original_list_price'] is not None else None,
                    'days_on_market': int(row['days_on_market']) if 'days_on_market' in row and row['days_on_market'] is not None else None,
                    'price_reduction_count': int(row['price_reduction_count']) if 'price_reduction_count' in row and row['price_reduction_count'] is not None else None,
                    'off_market_date': row.get('off_market_date'),
                    'last_sold_date': row.get('last_sold_date'),
                    'last_sold_price': float(row['last_sold_price']) if 'last_sold_price' in row and row['last_sold_price'] is not None else None,
                    'hoa_fee': float(row['hoa_fee']) if 'hoa_fee' in row and row['hoa_fee'] is not None else None,
                    'stories': int(row['stories']) if 'stories' in row and row['stories'] is not None else None,
                    'garage': row.get('garage'),
                    'pool': row.get('pool'),
                    'style': row.get('style'),
                }
            }
            properties.append(prop)

        return properties

    except Exception as e:
        raise Exception(f"Error scraping properties: {str(e)}")


def scrape_active_properties(criteria, updated_hours=24):
    """
    Scrape recently updated active properties for status change detection

    Args:
        criteria: Dict with location and filters
        updated_hours: Number of hours to look back

    Returns:
        List of property dictionaries
    """
    try:
        params = {
            'location': criteria['location'],
            'listing_type': 'for_sale',
            'updated_in_past_hours': updated_hours,  # HomeHarvest Elite feature
            'limit': 100,
        }

        # Add same filters as off_market scraping
        if criteria.get('price_min'):
            params['price_min'] = criteria['price_min']
        if criteria.get('price_max'):
            params['price_max'] = criteria['price_max']

        df = scrape_property(**params)

        if df is None or len(df) == 0:
            return []

        # Convert to same format as off_market
        properties = []
        for _, row in df.iterrows():
            prop = {
                'property_id': str(row.get('property_id', '')),
                'current_status': row.get('status', 'for_sale'),
                'current_list_price': float(row['list_price']) if 'list_price' in row and row['list_price'] is not None else None,
                'full_street_line': row.get('full_street_line', ''),
                'city': row.get('city', ''),
                'state': row.get('state', ''),
                'raw_data': {
                    'status_change_date': row.get('status_change_date'),
                    'price_change_date': row.get('price_change_date'),
                    'previous_status': row.get('previous_status'),
                    'previous_price': float(row['previous_price']) if 'previous_price' in row and row['previous_price'] is not None else None,
                }
            }
            properties.append(prop)

        return properties

    except Exception as e:
        raise Exception(f"Error scraping active properties: {str(e)}")


if __name__ == '__main__':
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())

        scrape_type = input_data.get('type', 'off_market')
        criteria = input_data.get('criteria', {})

        if scrape_type == 'off_market':
            properties = scrape_off_market(criteria)
        elif scrape_type == 'active':
            updated_hours = input_data.get('updated_hours', 24)
            properties = scrape_active_properties(criteria, updated_hours)
        else:
            print(json.dumps({"error": f"Unknown scrape type: {scrape_type}"}))
            sys.exit(1)

        # Output results as JSON
        result = {
            "success": True,
            "properties": properties,
            "count": len(properties)
        }
        print(json.dumps(result))

    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)
