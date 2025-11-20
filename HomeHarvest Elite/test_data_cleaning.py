"""
Test data validation and cleaning features
"""
import sys
import io
import pandas as pd
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from homeharvest import scrape_property, get_data_quality_report
from homeharvest.data_cleaning import (
    clean_price, clean_sqft, clean_beds_baths, clean_year,
    clean_tags, validate_coordinates, calculate_price_per_sqft
)

print("Testing Data Validation and Cleaning")
print("=" * 80)

# Test 1: Individual cleaning functions
print("\n[Test 1] Individual Cleaning Functions")
print(f"  clean_price('$500,000') → {clean_price('$500,000')}")
print(f"  clean_price('  250000  ') → {clean_price('  250000  ')}")
print(f"  clean_sqft('2,500') → {clean_sqft('2,500')}")
print(f"  clean_sqft('1500.5') → {clean_sqft('1500.5')}")
print(f"  clean_beds_baths('3.5') → {clean_beds_baths('3.5')}")
print(f"  clean_year('2020') → {clean_year('2020')}")
print(f"  clean_year('1850') → {clean_year('1850')}")  # Too old, should return None
print(f"  clean_tags(['Pool', 'GARAGE', '  view  ']) → {clean_tags(['Pool', 'GARAGE', '  view  '])}")

# Test 2: Coordinate validation
print("\n[Test 2] Coordinate Validation")
lat, lon = validate_coordinates(33.4484, -112.0740)  # Phoenix coords
print(f"  Valid coords (33.4484, -112.0740) → ({lat}, {lon})")
lat, lon = validate_coordinates(200, -112)  # Invalid latitude
print(f"  Invalid coords (200, -112) → ({lat}, {lon})")

# Test 3: Price per sqft calculation
print("\n[Test 3] Price Per Sqft Calculation")
print(f"  Price: $300,000, Sqft: 2,000 → ${calculate_price_per_sqft(300000, 2000)}/sqft")
print(f"  Price: $500,000, Sqft: 0 → ${calculate_price_per_sqft(500000, 0)}/sqft")

# Test 4: Scrape with data cleaning enabled (default)
print("\n[Test 4] Scraping with Data Cleaning Enabled")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        clean_data=True,
        add_derived_fields=True,
        limit=20
    )
    print(f"✓ Found {len(properties)} properties with cleaned data")

    if len(properties) > 0:
        sample = properties.iloc[0]
        print(f"  Sample property:")
        print(f"    Price: ${sample.get('list_price', 'N/A'):,}" if pd.notna(sample.get('list_price')) else "    Price: N/A")
        print(f"    Sqft: {sample.get('sqft', 'N/A'):,}" if pd.notna(sample.get('sqft')) else "    Sqft: N/A")
        print(f"    Price/sqft: ${sample.get('price_per_sqft', 'N/A')}/sqft" if pd.notna(sample.get('price_per_sqft')) else "    Price/sqft: N/A")
        print(f"    Beds: {sample.get('beds', 'N/A')}")
        print(f"    Baths: {sample.get('full_baths', 'N/A')}")
        print(f"    Year: {sample.get('year_built', 'N/A')}")

    # Check if price_per_sqft was added
    if 'price_per_sqft' in properties.columns:
        non_null_price_sqft = properties['price_per_sqft'].notna().sum()
        print(f"\n  Price per sqft calculated for {non_null_price_sqft}/{len(properties)} properties")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()

# Test 5: Data quality report
print("\n[Test 5] Data Quality Report")
try:
    properties = scrape_property(
        location="Scottsdale, AZ",
        listing_type="for_sale",
        limit=50
    )

    report = get_data_quality_report(properties)
    print(f"✓ Generated quality report for {report['total_properties']} properties")

    print("\n  Completeness (top 10 fields):")
    completeness_items = sorted(
        report['completeness'].items(),
        key=lambda x: x[1]['percentage'],
        reverse=True
    )[:10]

    for field, stats in completeness_items:
        print(f"    {field}: {stats['percentage']}% ({stats['count']}/{report['total_properties']})")

    print("\n  Data Ranges:")
    for field, ranges in list(report['data_ranges'].items())[:5]:
        print(f"    {field}:")
        print(f"      Min: {ranges['min']}, Max: {ranges['max']}")
        print(f"      Mean: {ranges['mean']}, Median: {ranges['median']}")

except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()

# Test 6: Compare with and without cleaning
print("\n[Test 6] Comparing With/Without Data Cleaning")
try:
    # Without cleaning
    props_raw = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        clean_data=False,
        limit=10
    )

    # With cleaning
    props_clean = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        clean_data=True,
        add_derived_fields=True,
        limit=10
    )

    print(f"✓ Without cleaning: {len(props_raw)} properties")
    print(f"✓ With cleaning: {len(props_clean)} properties")

    # Check if price_per_sqft exists
    print(f"\n  price_per_sqft in raw data: {'price_per_sqft' in props_raw.columns and props_raw['price_per_sqft'].notna().any()}")
    print(f"  price_per_sqft in clean data: {'price_per_sqft' in props_clean.columns and props_clean['price_per_sqft'].notna().any()}")

    if 'price_per_sqft' in props_clean.columns:
        count = props_clean['price_per_sqft'].notna().sum()
        print(f"  Calculated price_per_sqft for {count}/{len(props_clean)} properties")

except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
print("Data Cleaning Tests Complete!")
