"""
Test enhanced tag filtering features
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from homeharvest import (
    scrape_property, discover_tags, normalize_tags, get_tag_category,
    get_tags_by_category, fuzzy_match_tag, get_all_categories, get_category_info,
    TAG_CATEGORIES, TAG_ALIASES
)

print("Testing Enhanced Tag Features")
print("=" * 80)

# Test 1: Tag normalization with aliases
print("\n[Test 1] Tag Normalization & Aliases")
test_tags = ["pool", "2_car_garage", "mountain", "gated", "solar"]
normalized = normalize_tags(test_tags)
print(f"Input tags: {test_tags}")
print(f"Normalized: {normalized}")

# Test 2: Fuzzy tag matching
print("\n[Test 2] Fuzzy Tag Matching")
search_terms = ["pools", "garag", "mountainview", "waterfrnt"]
for term in search_terms:
    matches = fuzzy_match_tag(term, threshold=0.6)
    print(f"  '{term}' → {matches[:3]}")  # Top 3 matches

# Test 3: Tag categories
print("\n[Test 3] Tag Categories")
print(f"Available categories: {get_all_categories()}")
print(f"Category info: {get_category_info()}")
print(f"\nOutdoor tags: {get_tags_by_category('outdoor')[:10]}")
print(f"View tags: {get_tags_by_category('view')}")

# Test 4: Scrape with alias expansion (pool → swimming_pool)
print("\n[Test 4] Scraping with Tag Aliases")
try:
    properties = scrape_property(
        location="Scottsdale, AZ",
        listing_type="for_sale",
        tag_filters=["pool"],  # Should expand to "swimming_pool"
        tag_use_aliases=True,
        limit=20
    )
    print(f"✓ Found {len(properties)} properties with 'pool' (aliased)")
    if len(properties) > 0:
        sample = properties.iloc[0]
        tags = sample.get('tags', [])
        print(f"  Sample has {len(tags)} tags")
        pool_tags = [t for t in tags if 'pool' in t.lower()]
        print(f"  Pool-related tags: {pool_tags}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 5: Scrape with fuzzy matching
print("\n[Test 5] Scraping with Fuzzy Matching")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        tag_filters=["garag", "mountainview"],  # Fuzzy matches
        tag_use_fuzzy=True,
        tag_fuzzy_threshold=0.6,
        limit=20
    )
    print(f"✓ Found {len(properties)} properties with fuzzy matches")
    if len(properties) > 0:
        sample = properties.iloc[0]
        print(f"  Sample tags: {sample.get('tags', [])[:10]}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 6: Tag discovery on results
print("\n[Test 6] Tag Discovery")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        limit=50
    )

    tag_info = discover_tags(properties)
    print(f"✓ Analyzed {tag_info['total_properties']} properties")
    print(f"  Total unique tags: {tag_info['total_unique_tags']}")
    print(f"  Most common tags:")
    for tag, count in tag_info['most_common'][:10]:
        category = get_tag_category(tag)
        print(f"    - {tag}: {count} ({category or 'uncategorized'})")

    print(f"\n  Tags by category:")
    for category, tags in list(tag_info['by_category'].items())[:5]:
        print(f"    {category}: {len(tags)} tags")

    if tag_info['uncategorized']:
        print(f"\n  Uncategorized tags: {tag_info['uncategorized'][:10]}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 7: Multiple tag filters with "all" match type
print("\n[Test 7] Multiple Tag Filters (must have all)")
try:
    properties = scrape_property(
        location="Scottsdale, AZ",
        listing_type="for_sale",
        tag_filters=["pool", "garage", "view"],
        tag_match_type="all",
        tag_use_aliases=True,
        limit=50
    )
    print(f"✓ Found {len(properties)} properties with pool AND garage AND view")
    if len(properties) > 0:
        sample = properties.iloc[0]
        tags = sample.get('tags', [])
        print(f"  Sample has tags: {[t for t in tags if any(k in t.lower() for k in ['pool', 'garage', 'view'])]}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 8: Tag exclusion
print("\n[Test 8] Tag Exclusion")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        tag_filters=["pool"],
        tag_exclude=["hoa", "condo"],
        tag_use_aliases=True,
        limit=30
    )
    print(f"✓ Found {len(properties)} properties with pool but NO HOA/condo")
    if len(properties) > 0:
        sample = properties.iloc[0]
        tags = sample.get('tags', [])
        has_excluded = any('hoa' in t.lower() or 'condo' in t.lower() for t in tags)
        print(f"  Sample has HOA/condo tags: {has_excluded}")
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 80)
print("Enhanced Tag Tests Complete!")
