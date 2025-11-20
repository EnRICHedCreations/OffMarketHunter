"""
Test smart filter presets
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from homeharvest import (
    scrape_property, get_available_presets, get_all_presets_info,
    get_preset_info, list_presets_by_category, combine_presets
)

print("Testing Smart Filter Presets")
print("=" * 80)

# Test 1: List all available presets
print("\n[Test 1] Available Presets")
presets = get_available_presets()
print(f"Total presets: {len(presets)}")
print(f"Presets: {', '.join(presets)}")

# Test 2: Get preset descriptions
print("\n[Test 2] Preset Descriptions")
preset_info = get_all_presets_info()
for name, description in list(preset_info.items())[:5]:
    print(f"  {name}: {description}")

# Test 3: Presets by category
print("\n[Test 3] Presets by Category")
categories = list_presets_by_category()
for category, category_presets in categories.items():
    print(f"  {category}: {', '.join(category_presets)}")

# Test 4: Use investor_friendly preset
print("\n[Test 4] Using 'investor_friendly' Preset")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        preset="investor_friendly",
        limit=20
    )
    print(f"✓ Found {len(properties)} investor-friendly properties")
    if len(properties) > 0:
        sample = properties.iloc[0]
        print(f"  Sample: HOA=${sample.get('hoa_fee', 'N/A')}, Lot={sample.get('lot_sqft', 'N/A')} sqft")
        print(f"  Tags: {[t for t in sample.get('tags', []) if 'rental' in t.lower() or 'investment' in t.lower()]}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 5: Use luxury preset
print("\n[Test 5] Using 'luxury' Preset")
try:
    properties = scrape_property(
        location="Scottsdale, AZ",
        listing_type="for_sale",
        preset="luxury",
        limit=20
    )
    print(f"✓ Found {len(properties)} luxury properties")
    if len(properties) > 0:
        sample = properties.iloc[0]
        print(f"  Sample: Price=${sample.get('list_price', 'N/A'):,}, Sqft={sample.get('sqft', 'N/A')}, Baths={sample.get('baths', 'N/A')}")
        luxury_tags = [t for t in sample.get('tags', []) if any(x in t.lower() for x in ['pool', 'kitchen', 'view'])]
        print(f"  Luxury tags: {luxury_tags[:5]}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 6: Use pool_home preset
print("\n[Test 6] Using 'pool_home' Preset")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        preset="pool_home",
        limit=15
    )
    print(f"✓ Found {len(properties)} pool homes")
    if len(properties) > 0:
        sample = properties.iloc[0]
        has_pool = 'pool' in str(sample.get('tags', [])).lower()
        print(f"  Sample has pool: {has_pool}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 7: Use preset with override parameters
print("\n[Test 7] Using Preset with Override")
try:
    properties = scrape_property(
        location="Scottsdale, AZ",
        listing_type="for_sale",
        preset="starter_home",
        price_max=250000,  # Override the preset's 300k limit
        limit=15
    )
    print(f"✓ Found {len(properties)} starter homes under $250k")
    if len(properties) > 0:
        sample = properties.iloc[0]
        print(f"  Sample price: ${sample.get('list_price', 'N/A'):,}")
        print(f"  Beds: {sample.get('beds', 'N/A')}, Baths: {sample.get('baths', 'N/A')}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 8: Get specific preset info
print("\n[Test 8] Preset Details")
info = get_preset_info("retirement")
if info:
    print(f"Preset: retirement")
    print(f"  Description: {info['description']}")
    print(f"  Filters: {info['filters']}")

# Test 9: Combine presets
print("\n[Test 9] Combining Presets")
try:
    combined_filters = combine_presets("pool_home", "no_hoa")
    print(f"✓ Combined 'pool_home' + 'no_hoa' presets")
    print(f"  Resulting filters: {combined_filters}")

    # Use combined preset
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        tag_filters=combined_filters.get('tag_filters'),
        has_pool=combined_filters.get('has_pool'),
        limit=20
    )
    print(f"  Found {len(properties)} properties matching combined criteria")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 10: No HOA preset
print("\n[Test 10] Using 'no_hoa' Preset")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        preset="no_hoa",
        limit=20
    )
    print(f"✓ Found {len(properties)} properties without HOA")
    if len(properties) > 0:
        sample = properties.iloc[0]
        tags = sample.get('tags', [])
        has_no_hoa_tag = 'no_hoa' in [t.lower() for t in tags]
        print(f"  Sample has 'no_hoa' tag: {has_no_hoa_tag}")
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 80)
print("Preset Tests Complete!")
