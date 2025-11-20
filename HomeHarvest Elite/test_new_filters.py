"""
Test new filter parameters
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from homeharvest import scrape_property

print("Testing New Filter Parameters")
print("=" * 80)

# Test 1: HOA fee filter
print("\n[Test 1] Properties with HOA fee < $200...")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        hoa_fee_max=200,
        limit=20
    )
    print(f"✓ Found {len(properties)} properties with HOA < $200")
    if len(properties) > 0:
        sample = properties.iloc[0]
        print(f"  Sample: HOA=${sample.get('hoa_fee', 'N/A')}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 2: Stories filter
print("\n[Test 2] Single-story homes only...")
try:
    properties = scrape_property(
        location="Scottsdale, AZ",
        listing_type="for_sale",
        stories_max=1,
        limit=20
    )
    print(f"✓ Found {len(properties)} single-story properties")
    if len(properties) > 0:
        sample = properties.iloc[0]
        print(f"  Sample: {sample.get('stories', 'N/A')} stories")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 3: Garage spaces filter
print("\n[Test 3] Properties with 2+ garage spaces...")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        garage_spaces_min=2,
        limit=20
    )
    print(f"✓ Found {len(properties)} properties with 2+ garage spaces")
    if len(properties) > 0:
        sample = properties.iloc[0]
        print(f"  Sample: {sample.get('parking_garage', 'N/A')} garage spaces")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 4: Boolean filter - has pool
print("\n[Test 4] Properties with pool...")
try:
    properties = scrape_property(
        location="Scottsdale, AZ",
        listing_type="for_sale",
        has_pool=True,
        limit=20
    )
    print(f"✓ Found {len(properties)} properties with pool")
    if len(properties) > 0:
        sample = properties.iloc[0]
        print(f"  Sample tags: {sample.get('tags', [])}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 5: Combined filters
print("\n[Test 5] Single-story homes with pool and 2+ garage...")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        stories_max=1,
        has_pool=True,
        garage_spaces_min=2,
        limit=50
    )
    print(f"✓ Found {len(properties)} matching properties")
    if len(properties) > 0:
        sample = properties.iloc[0]
        print(f"  Sample: {sample.get('stories', 'N/A')} stories, garage: {sample.get('parking_garage', 'N/A')}")
        print(f"  Tags: {sample.get('tags', [])}")
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 80)
print("Filter Tests Complete!")
