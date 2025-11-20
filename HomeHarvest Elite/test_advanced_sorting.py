"""
Test advanced sorting features
"""
import sys
import io
import pandas as pd
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from homeharvest import (
    scrape_property, sort_properties, get_best_deals,
    get_newest_listings, rank_by_investment_potential,
    get_available_sort_fields
)

print("Testing Advanced Sorting Features")
print("=" * 80)

# Test 1: Available sort fields
print("\n[Test 1] Available Sort Fields")
fields = get_available_sort_fields()
print(f"Total sortable fields: {len(fields)}")
for field, description in list(fields.items())[:10]:
    print(f"  {field}: {description}")

# Test 2: Single field sorting
print("\n[Test 2] Single Field Sort (by price)")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        sort_by="list_price",
        sort_direction="asc",
        enable_advanced_sort=True,
        limit=10
    )
    print(f"✓ Sorted {len(properties)} properties by price (ascending)")
    if len(properties) > 0:
        prices = properties['list_price'].dropna().head(5).tolist()
        print(f"  First 5 prices: {[f'${p:,.0f}' for p in prices]}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 3: Multi-field sorting
print("\n[Test 3] Multi-Field Sort (beds desc, then price asc)")
try:
    properties = scrape_property(
        location="Scottsdale, AZ",
        listing_type="for_sale",
        sort_by=["beds", "list_price"],
        sort_direction=["desc", "asc"],
        enable_advanced_sort=True,
        limit=15
    )
    print(f"✓ Sorted {len(properties)} properties by beds (desc) then price (asc)")
    if len(properties) > 0:
        sample = properties[['beds', 'list_price']].head(5)
        print("  Top 5 results:")
        for idx, row in sample.iterrows():
            beds = row['beds'] if pd.notna(row['beds']) else 'N/A'
            price = f"${row['list_price']:,.0f}" if pd.notna(row['list_price']) else 'N/A'
            print(f"    {beds} beds - {price}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 4: Sort by calculated field (price_per_sqft)
print("\n[Test 4] Sort by Calculated Field (price_per_sqft)")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        sort_by="price_per_sqft",
        sort_direction="asc",
        enable_advanced_sort=True,
        add_derived_fields=True,
        limit=10
    )
    print(f"✓ Sorted {len(properties)} properties by price per sqft")
    if len(properties) > 0:
        sample = properties[['list_price', 'sqft', 'price_per_sqft']].dropna().head(5)
        print("  Best price/sqft deals:")
        for idx, row in sample.iterrows():
            print(f"    ${row['list_price']:,.0f} / {row['sqft']:,.0f} sqft = ${row['price_per_sqft']:.2f}/sqft")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 5: Get best deals function
print("\n[Test 5] Get Best Deals by Price/Sqft")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        add_derived_fields=True,
        limit=50
    )

    best_deals = get_best_deals(properties, limit=5, criteria="price_per_sqft")
    print(f"✓ Found top 5 best deals by price/sqft")
    if len(best_deals) > 0:
        for idx, row in best_deals[['list_price', 'sqft', 'price_per_sqft']].dropna().head(5).iterrows():
            print(f"    ${row['list_price']:,.0f} - {row['sqft']:,.0f} sqft - ${row['price_per_sqft']:.2f}/sqft")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()

# Test 6: Get newest listings
print("\n[Test 6] Get Newest Listings")
try:
    properties = scrape_property(
        location="Scottsdale, AZ",
        listing_type="for_sale",
        limit=30
    )

    newest = get_newest_listings(properties, limit=5)
    print(f"✓ Found {len(newest)} newest listings")
    if len(newest) > 0 and 'list_date' in newest.columns:
        for idx, row in newest[['list_date', 'list_price']].head(5).iterrows():
            date = row['list_date'] if pd.notna(row['list_date']) else 'N/A'
            price = f"${row['list_price']:,.0f}" if pd.notna(row['list_price']) else 'N/A'
            print(f"    {date}: {price}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 7: Rank by investment potential
print("\n[Test 7] Rank by Investment Potential")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        add_derived_fields=True,
        limit=50
    )

    ranked = rank_by_investment_potential(properties)
    print(f"✓ Ranked {len(ranked)} properties by investment potential")

    if len(ranked) > 0:
        print("  Top 5 investment opportunities:")
        sample_cols = ['investment_score', 'list_price', 'sqft', 'lot_sqft']
        available_cols = [col for col in sample_cols if col in ranked.columns]

        for idx, row in ranked[available_cols].head(5).iterrows():
            score = row.get('investment_score', 0)
            price = f"${row.get('list_price', 0):,.0f}" if pd.notna(row.get('list_price')) else 'N/A'
            sqft = f"{row.get('sqft', 0):,.0f}" if pd.notna(row.get('sqft')) else 'N/A'
            lot = f"{row.get('lot_sqft', 0):,.0f}" if pd.notna(row.get('lot_sqft')) else 'N/A'
            print(f"    Score: {score:.1f} - Price: {price}, Sqft: {sqft}, Lot: {lot} sqft")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()

# Test 8: Sort with property_age calculated field
print("\n[Test 8] Sort by Property Age")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        sort_by="property_age",
        sort_direction="asc",
        enable_advanced_sort=True,
        limit=10
    )
    print(f"✓ Sorted {len(properties)} properties by age (newest first)")
    if len(properties) > 0 and 'year_built' in properties.columns:
        from datetime import datetime
        current_year = datetime.now().year
        sample = properties[['year_built']].head(5)
        print("  Newest properties:")
        for idx, row in sample.iterrows():
            year = int(row['year_built']) if pd.notna(row['year_built']) else 'N/A'
            age = current_year - year if isinstance(year, int) else 'N/A'
            print(f"    Built: {year} (Age: {age} years)")
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 80)
print("Advanced Sorting Tests Complete!")
