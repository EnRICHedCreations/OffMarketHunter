#!/usr/bin/env python3
"""
Property scraping script using HomeHarvest Elite
Accepts JSON input and returns scraped properties as JSON
"""

import sys
import json
import os
import pandas as pd

# Add HomeHarvest Elite to path (one directory up from scripts/)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'HomeHarvest Elite'))

try:
    from homeharvest import scrape_property
except ImportError:
    print(json.dumps({"error": "HomeHarvest Elite not found. Please ensure it's in the parent directory."}))
    sys.exit(1)


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
                'property_id': safe_str(row.get('property_id')) or '',
                'current_status': safe_str(row.get('status')) or 'for_sale',
                'current_list_price': safe_float(row.get('list_price')),
                'full_street_line': safe_str(row.get('full_street_line')) or '',
                'city': safe_str(row.get('city')) or '',
                'state': safe_str(row.get('state')) or '',
                'raw_data': {
                    'status_change_date': safe_str(row.get('status_change_date')),
                    'price_change_date': safe_str(row.get('price_change_date')),
                    'previous_status': safe_str(row.get('previous_status')),
                    'previous_price': safe_float(row.get('previous_price')),
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
