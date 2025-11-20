# 🏠 HomeHarvest Elite - Professional Real Estate Data Intelligence Platform

> **The most comprehensive Python library for real estate data scraping, analysis, and investment intelligence. Built on Realtor.com's GraphQL API with 70+ advanced features for investors, wholesalers, and data analysts.**

[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Data Source](https://img.shields.io/badge/source-Realtor.com-red.svg)](https://www.realtor.com)

---

## 🚀 What Makes Elite Different

HomeHarvest Elite transforms the original HomeHarvest into a **professional-grade investment intelligence platform** with:

### 📊 **70+ Advanced Features**
- ✨ **24 Smart Presets** - Pre-configured investment strategies (luxury, fixer-upper, wholesale, etc.)
- 🏷️ **100+ Property Tags** - Organized into 10 categories with fuzzy matching & 30+ aliases
- ⏱️ **Hourly Time Precision** - Monitor new listings down to the minute
- 🎯 **AI Investment Scoring** - Multi-factor ranking algorithm (0-100 scale)
- 👥 **Agent/Broker Intelligence** - Wholesale scoring, specialization analysis, contact extraction
- 📈 **Data Quality Engine** - Auto-cleaning, validation, enrichment, quality reports
- 🔍 **18 Advanced Filters** - HOA fees, stories, garage, pool, waterfront, views, time-based
- 📊 **22 Sortable Fields** - Including 4 calculated fields (property_age, price_discount, etc.)
- 🎨 **75+ Data Fields** - Complete property information with structured contact data
- 🚀 **10,000 Result Limit** - Parallel pagination with automatic retry logic

### 💰 Built for Real Estate Professionals

**Investors** → Find undervalued properties with investment scoring
**Wholesalers** → Identify motivated agents with frustration scoring
**Flippers** → Discover fixer-uppers with repair estimation
**Analysts** → Export clean, structured data with quality reports
**Developers** → Access GraphQL API with full Python integration

---

## 📦 Installation

```bash
# Install dependencies
pip install pandas requests

# Clone repository
git clone https://github.com/your-repo/homeharvest-elite.git
cd homeharvest-elite

# Ready to use!
from homeharvest import scrape_property
```

**Requirements:**
- Python 3.8+
- pandas
- requests
- No API keys required (built-in OAuth authentication)

---

## 🎯 Quick Start Guide

### 1️⃣ Basic Property Search (Original Features)

```python
from homeharvest import scrape_property

# Simple search - just like the original HomeHarvest
properties = scrape_property(
    location="San Diego, CA",
    listing_type="for_sale",
    limit=100
)

print(f"Found {len(properties)} properties")
print(properties[['full_street_line', 'city', 'list_price', 'beds', 'sqft']].head())

# Export to CSV/Excel
properties.to_csv('san_diego_homes.csv', index=False)
properties.to_excel('san_diego_homes.xlsx', index=False)
```

### 2️⃣ Use Smart Presets (Elite Feature)

**24 Pre-Configured Strategies** - Just set your location and go:

```python
from homeharvest import scrape_property, get_all_presets_info

# See all 24 available presets
presets = get_all_presets_info()
for name, description in list(presets.items())[:5]:
    print(f"📋 {name}: {description}")

# Investment search
investor_deals = scrape_property(
    location="Phoenix, AZ",
    preset="investor_friendly",  # Low HOA, good lot size, rental potential
    price_max=400000,
    limit=100
)

# Luxury search
luxury_homes = scrape_property(
    location="Scottsdale, AZ",
    preset="luxury",  # $500k+, 2500+ sqft, premium amenities
    limit=50
)

# Fixer-upper search
fixers = scrape_property(
    location="Dallas, TX",
    preset="fixer_upper",  # Properties needing work
    price_max=250000,
    limit=75
)

# Override preset defaults
custom_search = scrape_property(
    location="Austin, TX",
    preset="starter_home",
    price_max=350000,  # Override default $300k
    beds_min=3,        # Add custom filter
    limit=100
)
```

**Available Preset Categories:**

| Category | Presets |
|----------|---------|
| **Investment** | `investor_friendly`, `fixer_upper` |
| **Lifestyle** | `luxury`, `family_friendly`, `retirement`, `starter_home` |
| **Location** | `waterfront`, `golf_course`, `mountain_view`, `urban`, `gated_community` |
| **Features** | `pool_home`, `no_hoa`, `eco_friendly`, `new_construction`, `open_floor_plan` |
| **Property Type** | `horse_property`, `acreage`, `guest_house` |
| **Lot Features** | `corner_lot`, `cul_de_sac`, `quiet_neighborhood` |
| **Parking** | `rv_parking`, `big_garage` |

### 3️⃣ Investment Intelligence (AI Scoring)

```python
from homeharvest import scrape_property, rank_by_investment_potential, get_best_deals

# Search with investment analysis
properties = scrape_property(
    location="Phoenix, AZ",
    listing_type="for_sale",
    price_max=500000,
    beds_min=3,
    add_derived_fields=True,  # Adds price_per_sqft, property_age, etc.
    limit=200
)

# AI-powered investment ranking
ranked = rank_by_investment_potential(properties)

print("🏆 Top 5 Investment Opportunities:")
for i, row in ranked.head(5).iterrows():
    print(f"\n{i+1}. ${row['list_price']:,.0f} - Score: {row['investment_score']:.0f}/100")
    print(f"   📍 {row['full_street_line']}, {row['city']}, {row['state']}")
    print(f"   🏠 {row['beds']} bed, {row['full_baths']} bath, {row['sqft']:,.0f} sqft")
    print(f"   💰 ${row['price_per_sqft']:.2f}/sqft | Lot: {row['lot_sqft']:,.0f} sqft")
    print(f"   📅 {row['days_on_mls']} days on market")

# Find best price-per-sqft deals
best_value = get_best_deals(properties, limit=10, criteria="price_per_sqft")
print(f"\n💎 Found {len(best_value)} best value properties")
```

**Investment Scoring Algorithm:**
- **30%** Price per sqft (lower = better)
- **40%** Price discount from estimated value (below estimate = better)
- **20%** Days on market (longer = motivated seller)
- **10%** Lot size (bigger = better)
- **Result:** 0-100 score (higher = better opportunity)

### 4️⃣ Wholesale Agent Intelligence

```python
from homeharvest import (
    scrape_property,
    get_wholesale_friendly_agents,
    analyze_agent_specialization,
    get_contact_export
)

# Get properties with agent data
properties = scrape_property(
    location="Dallas, TX",
    listing_type="for_sale",
    price_max=300000,
    require_agent_email=True,  # Only properties with agent contact
    past_days=365,
    limit=500
)

# Find wholesale-friendly agents
wholesale_agents = get_wholesale_friendly_agents(properties, min_listings=3)

print(f"📊 Found {len(wholesale_agents)} wholesale-friendly agents")
print("\nTop 5 Agents by Wholesale Score:")
for i, agent in wholesale_agents.head(5).iterrows():
    print(f"\n{i+1}. {agent['agent_name']} - Score: {agent['wholesale_score']:.0f}/100")
    print(f"   📧 {agent['agent_email']}")
    print(f"   📞 {agent.get('primary_phone', 'N/A')}")
    print(f"   🏢 {agent['broker_name']}")
    print(f"   📋 {agent['listing_count']} listings | Avg Price: ${agent['avg_price']:,.0f}")
    print(f"   🎯 Price Category: {agent['price_category']}")

# Analyze agent specializations
specialization = analyze_agent_specialization(properties)
print(f"\n🔍 Agent Specialization Analysis:")
print(specialization[['agent_name', 'price_category', 'avg_sqft', 'avg_beds']].head())

# Export contacts to CRM
contacts = get_contact_export(properties)
contacts.to_csv('wholesale_contacts.csv', index=False)
print(f"\n✅ Exported {len(contacts)} agent contacts")
```

**Wholesale Scoring Algorithm:**
- **60%** Price score (lower avg price = higher score)
- **40%** Inventory score (more listings = higher score)
- **Price Categories:** Budget (<$200k), Mid-Range ($200k-$500k), Upper-Mid ($500k-$1M), Luxury (>$1M)

---

## 🔧 Advanced Features Guide

### ⏱️ Time-Based Monitoring (Hourly Precision)

Track new listings down to the minute - perfect for automated deal alerts:

```python
from datetime import datetime, timedelta

# Last 1 hour (perfect for cron jobs)
new_listings = scrape_property(
    location="Phoenix, AZ",
    listing_type="for_sale",
    past_hours=1,  # ⭐ Elite Feature
    price_max=500000,
    limit=100
)

# Last 24 hours
yesterday = scrape_property(
    location="Austin, TX",
    listing_type="for_sale",
    past_hours=24,
    beds_min=3,
    limit=200
)

# Specific date range with hour precision
morning_listings = scrape_property(
    location="Dallas, TX",
    listing_type="for_sale",
    date_from=datetime(2025, 1, 20, 9, 0),   # 9 AM
    date_to=datetime(2025, 1, 20, 17, 0),    # 5 PM
    limit=150
)

# Properties updated in last 2 hours
recently_updated = scrape_property(
    location="Houston, TX",
    listing_type="for_sale",
    updated_in_past_hours=2,  # ⭐ Elite Feature
    limit=100
)

# Updated since specific timestamp
updated_since = scrape_property(
    location="San Antonio, TX",
    listing_type="for_sale",
    updated_since=datetime(2025, 1, 20, 14, 30),  # ⭐ Elite Feature
    limit=100
)

print(f"🕐 New listings in last hour: {len(new_listings)}")
print(f"📅 Morning listings (9AM-5PM): {len(morning_listings)}")
print(f"🔄 Recently updated: {len(recently_updated)}")
```

**Perfect for:**
- Hourly cron jobs to catch new deals first
- Automated alert systems (email/SMS)
- Market monitoring dashboards
- Competitive intelligence

### 🏷️ Tag Filtering System (100+ Tags)

**10 Organized Categories** with fuzzy matching and 30+ aliases:

```python
from homeharvest import (
    scrape_property,
    get_tags_by_category,
    get_all_categories,
    discover_tags,
    fuzzy_match_tag
)

# Tag aliases work automatically - "pool" → "swimming_pool"
pool_homes = scrape_property(
    location="Phoenix, AZ",
    tag_filters=["pool", "garage", "mountain"],  # Use common terms!
    tag_use_aliases=True,  # Default, auto-converts
    limit=100
)

# Fuzzy matching catches typos and variations
fuzzy_search = scrape_property(
    location="Scottsdale, AZ",
    tag_filters=["garag", "mountainview", "waterfont"],  # Typos!
    tag_use_fuzzy=True,  # ⭐ Elite Feature
    tag_fuzzy_threshold=0.7,  # 70% similarity
    limit=50
)

# Multiple matching modes
all_tags = scrape_property(
    location="Phoenix, AZ",
    tag_filters=["pool", "garage", "view"],
    tag_match_type="all",  # Must have ALL tags (AND logic)
    limit=50
)

any_tags = scrape_property(
    location="Phoenix, AZ",
    tag_filters=["pool", "waterfront", "golf"],
    tag_match_type="any",  # Has ANY tag (OR logic) - default
    limit=100
)

# Exclude unwanted tags
no_hoa = scrape_property(
    location="Phoenix, AZ",
    tag_filters=["pool", "big_yard"],
    tag_exclude=["hoa", "condo", "fixer_upper"],  # ⭐ Exclude these
    limit=75
)

# Browse available tags
categories = get_all_categories()
print(f"📋 Tag Categories: {categories}")

outdoor_tags = get_tags_by_category('outdoor')
print(f"🌳 Outdoor Tags: {outdoor_tags}")

# Discover tags in your data
properties = scrape_property(location="Phoenix, AZ", limit=200)
tag_info = discover_tags(properties)
print(f"\n📊 Tag Analysis:")
print(f"Total unique tags: {tag_info['total_unique_tags']}")
print(f"\nMost common tags:")
for tag, count in tag_info['most_common'][:10]:
    print(f"  {tag}: {count} properties")

# Fuzzy tag search
matches = fuzzy_match_tag("garag", threshold=0.6)
print(f"\n🔍 Fuzzy matches for 'garag': {matches[:5]}")
```

**Tag Categories:**
1. **Outdoor** (12 tags) - Pool, spa, backyard, RV parking, parks, trails
2. **Interior** (20 tags) - Fireplace, hardwood, kitchen upgrades, appliances
3. **Structure** (9 tags) - Single-story, basement, guest house, new construction
4. **Garage/Parking** (6 tags) - 1-3 car garages, carport, RV parking
5. **Lot** (7 tags) - Big lot, corner lot, cul-de-sac, golf frontage
6. **View** (9 tags) - Mountain, water, golf, city views
7. **Community** (14 tags) - Gated, pool, tennis, HOA, clubhouse
8. **Special** (9 tags) - Golf course, horse facilities, farm, tennis
9. **Features** (8 tags) - Solar, security, energy efficient
10. **Property Type** (5 tags) - Investment, rental, fixer, senior

**Common Aliases:**
- pool, pools → swimming_pool
- hot_tub, spa, jacuzzi → spa_or_hot_tub
- garage, 2_car → garage_2_or_more
- mountain, mountains → mountain_view
- water, ocean, beach → waterfront
- backyard, yard → private_backyard
- solar, eco → energy_efficient
- golf → golf_course
- horses → horse_facilities

### 🎯 Advanced Filtering (18 Filters)

**Go beyond basic search** with Elite's comprehensive filters:

```python
# HOA and structural filters
low_maintenance = scrape_property(
    location="Scottsdale, AZ",
    listing_type="for_sale",
    hoa_fee_max=100,        # ⭐ Max $100/month HOA
    stories_max=1,          # ⭐ Single-story only
    garage_spaces_min=2,    # ⭐ 2+ car garage
    year_built_min=2000,
    limit=100
)

# Boolean amenity filters
luxury_amenities = scrape_property(
    location="Paradise Valley, AZ",
    listing_type="for_sale",
    has_pool=True,          # ⭐ Must have pool
    has_garage=True,        # ⭐ Must have garage
    waterfront=True,        # ⭐ Waterfront property
    has_view=True,          # ⭐ Must have views
    price_min=1000000,
    limit=50
)

# Complete filter combination
dream_home = scrape_property(
    location="Phoenix, AZ",
    listing_type="for_sale",
    # Price & Size
    price_min=300000,
    price_max=500000,
    beds_min=3,
    beds_max=5,
    baths_min=2,
    sqft_min=2000,
    sqft_max=4000,
    lot_sqft_min=5000,
    lot_sqft_max=20000,
    year_built_min=2000,
    # Elite Filters
    hoa_fee_max=150,
    stories_min=1,
    stories_max=2,
    garage_spaces_min=2,
    has_pool=True,
    has_garage=True,
    waterfront=False,
    has_view=True,
    limit=100
)

print(f"🎯 Found {len(dream_home)} properties matching all criteria")
```

**All 18 Filters:**

| Category | Filters |
|----------|---------|
| **Price** | price_min, price_max |
| **Size** | beds_min/max, baths_min/max, sqft_min/max, lot_sqft_min/max |
| **Age** | year_built_min/max |
| **HOA** ⭐ | hoa_fee_min/max |
| **Structure** ⭐ | stories_min/max, garage_spaces_min/max |
| **Amenities** ⭐ | has_pool, has_garage, waterfront, has_view |
| **Time** ⭐ | past_days, past_hours, date_from, date_to, updated_since, updated_in_past_hours |

### 📊 Advanced Sorting & Ranking

**22 sortable fields** including 4 calculated fields:

```python
from homeharvest import scrape_property, sort_properties, get_available_sort_fields

# See all sortable fields
fields = get_available_sort_fields()
print("📊 Sortable Fields:")
for field, description in list(fields.items())[:10]:
    print(f"  {field}: {description}")

# Single field sort
cheapest = scrape_property(
    location="Phoenix, AZ",
    listing_type="for_sale",
    sort_by="list_price",
    sort_direction="asc",  # Ascending (cheapest first)
    enable_advanced_sort=True,
    limit=100
)

# Multi-field sort (beds DESC, then price ASC)
sorted_homes = scrape_property(
    location="Scottsdale, AZ",
    listing_type="for_sale",
    sort_by=["beds", "list_price"],
    sort_direction=["desc", "asc"],
    enable_advanced_sort=True,
    limit=100
)

# Sort by calculated field (newest buildings first)
newest_buildings = scrape_property(
    location="Phoenix, AZ",
    listing_type="for_sale",
    sort_by="property_age",  # ⭐ Calculated: current_year - year_built
    sort_direction="asc",
    enable_advanced_sort=True,
    add_derived_fields=True,
    limit=100
)

# Sort by price discount (best deals first)
undervalued = scrape_property(
    location="Austin, TX",
    listing_type="for_sale",
    sort_by="price_discount",  # ⭐ Calculated: % below estimated value
    sort_direction="desc",
    enable_advanced_sort=True,
    add_derived_fields=True,
    limit=100
)

# Manual sorting after fetching
properties = scrape_property(location="Dallas, TX", limit=200)
custom_sorted = sort_properties(
    properties,
    sort_by=["beds", "baths", "list_price"],
    sort_direction=["desc", "desc", "asc"]
)
```

**Sortable Fields:**

| Category | Fields |
|----------|--------|
| **Dates** | list_date, sold_date, pending_date, last_sold_date, last_update_date |
| **Prices** | list_price, sold_price, price_per_sqft ⭐ |
| **Sizes** | sqft, lot_sqft |
| **Details** | beds, full_baths, baths, year_built, days_on_mls |
| **Features** | hoa_fee, stories, parking_garage |
| **Values** | assessed_value, estimated_value |
| **Calculated** ⭐ | property_age, value_per_sqft, price_discount, lot_ratio |

### 📈 Data Quality & Enrichment

**Auto-cleaning, validation, and quality reports**:

```python
from homeharvest import scrape_property, get_data_quality_report, clean_dataframe

# Data cleaning is enabled by default
properties = scrape_property(
    location="Phoenix, AZ",
    listing_type="for_sale",
    clean_data=True,        # ⭐ Auto-clean (default: True)
    add_derived_fields=True, # ⭐ Add calculated fields (default: True)
    limit=200
)

# Check auto-calculated fields
print("📊 Derived Fields:")
print(properties[['list_price', 'sqft', 'price_per_sqft', 'property_age']].head())

# Generate comprehensive quality report
report = get_data_quality_report(properties)

print(f"\n📋 Data Quality Report")
print(f"Total Properties: {report['total_properties']}")

print(f"\n✅ Data Completeness:")
for field, stats in list(report['completeness'].items())[:10]:
    pct = stats['percentage']
    count = stats['count']
    total = report['total_properties']
    print(f"  {field:20} {pct:5.1f}% ({count}/{total})")

print(f"\n📊 Data Ranges:")
for field, ranges in list(report['data_ranges'].items())[:5]:
    print(f"  {field}:")
    print(f"    Min: ${ranges['min']:,.0f} | Max: ${ranges['max']:,.0f}")
    print(f"    Mean: ${ranges['mean']:,.0f} | Median: ${ranges['median']:,.0f}")

# Manual data cleaning (if needed)
clean_props = clean_dataframe(properties, add_derived_fields=True)
```

**Cleaning Functions:**
- `clean_price()` - Remove $, commas, validate numeric
- `clean_sqft()` - Standardize square footage
- `clean_beds_baths()` - Validate counts
- `clean_year()` - Validate 1800-2027 range
- `clean_hoa_fee()` - Standardize HOA fees
- `clean_tags()` - Normalize tag lists
- `validate_coordinates()` - Validate lat/lon
- `calculate_price_per_sqft()` - Auto-calculate

**Derived Fields:**
- `price_per_sqft` = list_price / sqft
- `property_age` = current_year - year_built
- `value_per_sqft` = estimated_value / sqft
- `price_discount` = % difference from estimated value
- `lot_ratio` = sqft / lot_sqft

---

## 💡 Real-World Use Cases

### 🏘️ Use Case 1: Daily Deal Monitor (Automated)

**Build an hourly cron job to catch new deals first:**

```python
from homeharvest import scrape_property, rank_by_investment_potential
from datetime import datetime
import smtplib

def hourly_deal_check():
    """Run every hour via cron"""

    # Get new listings from last hour
    new_deals = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        past_hours=1,  # Last 60 minutes
        price_max=400000,
        beds_min=3,
        add_derived_fields=True,
        limit=100
    )

    if len(new_deals) == 0:
        print(f"[{datetime.now()}] No new deals")
        return

    # Rank by investment potential
    ranked = rank_by_investment_potential(new_deals)

    # Filter high-score deals (80+)
    hot_deals = ranked[ranked['investment_score'] >= 80]

    if len(hot_deals) > 0:
        # Send alert email/SMS
        send_alert(f"🚨 {len(hot_deals)} HOT DEALS FOUND!")

        # Log to database
        save_to_database(hot_deals)

        print(f"[{datetime.now()}] Found {len(hot_deals)} high-score deals")

# Setup cron: 0 * * * * python deal_monitor.py
```

### 🏗️ Use Case 2: Flip Opportunity Finder

**Find fixer-uppers with estimated repair costs:**

```python
from homeharvest import scrape_property, rank_by_investment_potential

# Find potential flip opportunities
fixers = scrape_property(
    location="Dallas, TX",
    listing_type="for_sale",
    preset="fixer_upper",
    price_max=250000,
    tag_exclude=["new_construction"],
    add_derived_fields=True,
    limit=150
)

def estimate_repairs(property_row):
    """Estimate repairs from missing amenities"""
    repairs = 0

    # Check what's missing and estimate costs
    tags = property_row.get('tags', [])

    if "swimming_pool" not in tags: repairs += 35000
    if "updated_kitchen" not in tags: repairs += 20000
    if "new_roof" not in tags: repairs += 12000
    if "hardwood_floors" not in tags: repairs += 8000
    if "granite_kitchen" not in tags: repairs += 5000

    return repairs

# Add repair estimates
fixers['est_repairs'] = fixers.apply(estimate_repairs, axis=1)

# Calculate potential profit
fixers['potential_profit'] = (
    fixers['estimated_value'] -
    fixers['list_price'] -
    fixers['est_repairs'] -
    (fixers['list_price'] * 0.15)  # 15% holding/selling costs
)

# Filter profitable flips
profitable = fixers[fixers['potential_profit'] > 50000].sort_values(
    'potential_profit', ascending=False
)

print(f"💰 Found {len(profitable)} profitable flip opportunities")
for i, prop in profitable.head(10).iterrows():
    print(f"\n{i+1}. ${prop['list_price']:,.0f} → ${prop['estimated_value']:,.0f}")
    print(f"   Repairs: ${prop['est_repairs']:,.0f}")
    print(f"   Profit: ${prop['potential_profit']:,.0f}")
    print(f"   {prop['full_street_line']}, {prop['city']}")
```

### 📞 Use Case 3: Wholesale Agent Pipeline

**Build a CRM of motivated agents:**

```python
from homeharvest import (
    scrape_property,
    get_wholesale_friendly_agents,
    analyze_agent_specialization,
    get_contact_export
)

# Scan multiple markets
markets = ["Phoenix, AZ", "Dallas, TX", "Austin, TX", "Houston, TX"]
all_agents = []

for market in markets:
    print(f"\n🔍 Scanning {market}...")

    # Get properties with agent data
    props = scrape_property(
        location=market,
        listing_type="for_sale",
        price_max=350000,
        require_agent_email=True,
        past_days=365,
        limit=500
    )

    # Find wholesale-friendly agents (3+ listings)
    agents = get_wholesale_friendly_agents(props, min_listings=3)

    print(f"   Found {len(agents)} wholesale agents")
    all_agents.append(agents)

# Combine all markets
import pandas as pd
agent_database = pd.concat(all_agents, ignore_index=True)

# Add specialization data
specialization = analyze_agent_specialization(
    pd.concat([scrape_property(location=m, limit=500) for m in markets])
)

# Merge specialization with agents
agent_database = agent_database.merge(
    specialization[['agent_email', 'price_category', 'avg_sqft']],
    on='agent_email',
    how='left'
)

# Export to CRM
agent_database.to_csv('wholesale_agent_database.csv', index=False)

print(f"\n✅ Created database with {len(agent_database)} agents")
print(f"📊 Price categories:")
print(agent_database['price_category'].value_counts())

# Filter top agents for outreach
top_agents = agent_database[
    (agent_database['wholesale_score'] >= 70) &
    (agent_database['price_category'] == 'Budget')
].sort_values('wholesale_score', ascending=False)

print(f"\n🎯 {len(top_agents)} priority agents for outreach")
top_agents.to_excel('priority_outreach.xlsx', index=False)
```

### 🏖️ Use Case 4: Vacation Rental Analyzer

**Find high-ROI vacation rental opportunities:**

```python
from homeharvest import scrape_property, rank_by_investment_potential

# Search vacation markets
vacation_homes = scrape_property(
    location="Scottsdale, AZ",
    listing_type="for_sale",
    price_max=800000,
    beds_min=3,
    has_pool=True,
    tag_filters=["mountain_view", "golf_course", "gated_community"],
    tag_match_type="any",
    add_derived_fields=True,
    limit=100
)

# Also search for rent comps to estimate income
rental_comps = scrape_property(
    location="Scottsdale, AZ",
    listing_type="for_rent",
    beds_min=3,
    has_pool=True,
    limit=100
)

# Calculate potential rental income
avg_monthly_rent = rental_comps['list_price'].median()
annual_income = avg_monthly_rent * 12 * 0.70  # 70% occupancy

print(f"💰 Vacation Rental Analysis - Scottsdale, AZ")
print(f"Avg Monthly Rent: ${avg_monthly_rent:,.0f}")
print(f"Estimated Annual Income (70% occupancy): ${annual_income:,.0f}")

# Add ROI calculation
vacation_homes['annual_income_est'] = annual_income
vacation_homes['roi'] = (
    (annual_income - (vacation_homes['list_price'] * 0.03)) /  # 3% expenses
    vacation_homes['list_price'] * 100
)

# Sort by ROI
best_roi = vacation_homes.sort_values('roi', ascending=False)

print(f"\n🏆 Top 10 Vacation Rental Opportunities:")
for i, prop in best_roi.head(10).iterrows():
    print(f"\n{i+1}. ${prop['list_price']:,.0f} - ROI: {prop['roi']:.1f}%")
    print(f"   {prop['beds']} bed, {prop['full_baths']} bath")
    print(f"   Est. Annual Income: ${prop['annual_income_est']:,.0f}")
    print(f"   {prop['full_street_line']}")
```

### 🌄 Use Case 5: Land Development Scout

**Find buildable lots in growth areas:**

```python
from homeharvest import scrape_property

# Search for land
land_parcels = scrape_property(
    location="Austin, TX",
    property_type=["land"],
    preset="acreage",
    lot_sqft_min=43560,  # 1+ acre
    lot_sqft_max=217800,  # 5 acres max
    price_max=200000,
    sort_by="price_per_sqft",  # Calculated: price / lot_sqft
    enable_advanced_sort=True,
    add_derived_fields=True,
    limit=200
)

# Also get new construction to identify builder activity
builder_activity = scrape_property(
    location="Austin, TX",
    listing_type=["new_community", "ready_to_build"],
    past_days=365,
    limit=200
)

print(f"🏗️ Land Development Analysis - Austin, TX")
print(f"Found {len(land_parcels)} land parcels")
print(f"Found {len(builder_activity)} builder projects")

# Calculate development potential score
def development_score(lot_row):
    score = 0

    # Size (prefer 1-3 acres)
    acres = lot_row['lot_sqft'] / 43560
    if 1 <= acres <= 3: score += 40

    # Price per acre
    price_per_acre = lot_row['list_price'] / acres
    if price_per_acre < 100000: score += 30

    # Proximity to builder activity (would need geocoding)
    # score += proximity_bonus

    # Zoning (from property details if available)
    # score += zoning_bonus

    return score

land_parcels['development_score'] = land_parcels.apply(development_score, axis=1)

# Best development opportunities
best_lots = land_parcels.sort_values('development_score', ascending=False)

print(f"\n🎯 Top 10 Development Opportunities:")
for i, lot in best_lots.head(10).iterrows():
    acres = lot['lot_sqft'] / 43560
    price_per_acre = lot['list_price'] / acres
    print(f"\n{i+1}. ${lot['list_price']:,.0f} - {acres:.2f} acres")
    print(f"   Score: {lot['development_score']:.0f}/100")
    print(f"   ${price_per_acre:,.0f}/acre")
    print(f"   {lot.get('full_street_line', 'Address N/A')}")
```

---

## 📚 Complete API Reference

### Core Function: `scrape_property()`

```python
scrape_property(
    # ═══════════════════════════════════════════════════════
    # REQUIRED
    # ═══════════════════════════════════════════════════════
    location: str,                          # "Phoenix, AZ", "85281", "1234 Main St"

    # ═══════════════════════════════════════════════════════
    # LISTING & PROPERTY TYPE
    # ═══════════════════════════════════════════════════════
    listing_type: str | list[str] = None,  # "for_sale", "for_rent", "sold", "pending",
                                            # "off_market", "new_community", "ready_to_build"
    property_type: List[str] = None,        # ["single_family", "condo", "multi_family",
                                            # "land", "mobile", "farm", "townhomes"]

    # ═══════════════════════════════════════════════════════
    # SMART PRESET (24 OPTIONS)
    # ═══════════════════════════════════════════════════════
    preset: str = None,                     # "investor_friendly", "luxury", "fixer_upper",
                                            # "starter_home", "waterfront", "pool_home", etc.

    # ═══════════════════════════════════════════════════════
    # SEARCH PARAMETERS
    # ═══════════════════════════════════════════════════════
    radius: float = None,                   # Search radius in miles
    mls_only: bool = False,                 # Only MLS listings
    foreclosure: bool = None,               # Foreclosure properties only
    exclude_pending: bool = False,          # Exclude pending sales

    # ═══════════════════════════════════════════════════════
    # TIME-BASED FILTERS ⭐ ELITE
    # ═══════════════════════════════════════════════════════
    past_days: int | timedelta = None,      # Listed in last N days
    past_hours: int | timedelta = None,     # Listed in last N hours ⭐
    date_from: datetime | str = None,       # Listed after this date (hour precision)
    date_to: datetime | str = None,         # Listed before this date (hour precision)
    updated_since: datetime | str = None,   # Updated since timestamp ⭐
    updated_in_past_hours: int = None,      # Updated in last N hours ⭐

    # ═══════════════════════════════════════════════════════
    # BASIC PROPERTY FILTERS
    # ═══════════════════════════════════════════════════════
    beds_min: int = None,
    beds_max: int = None,
    baths_min: float = None,
    baths_max: float = None,
    sqft_min: int = None,
    sqft_max: int = None,
    price_min: int = None,
    price_max: int = None,
    lot_sqft_min: int = None,
    lot_sqft_max: int = None,
    year_built_min: int = None,
    year_built_max: int = None,

    # ═══════════════════════════════════════════════════════
    # ELITE FILTERS ⭐
    # ═══════════════════════════════════════════════════════
    hoa_fee_min: int = None,                # HOA fee range
    hoa_fee_max: int = None,
    stories_min: int = None,                # Number of floors
    stories_max: int = None,
    garage_spaces_min: int = None,          # Garage capacity
    garage_spaces_max: int = None,
    has_pool: bool = None,                  # Pool presence
    has_garage: bool = None,                # Garage presence
    waterfront: bool = None,                # Waterfront property
    has_view: bool = None,                  # Has views

    # ═══════════════════════════════════════════════════════
    # TAG FILTERING ⭐ ELITE (100+ TAGS)
    # ═══════════════════════════════════════════════════════
    tag_filters: List[str] = None,          # ["pool", "garage", "mountain"]
    tag_match_type: str = "any",            # "any" (OR), "all" (AND), "exact"
    tag_exclude: List[str] = None,          # ["hoa", "fixer_upper"]
    tag_use_aliases: bool = True,           # Auto-convert "pool" → "swimming_pool"
    tag_use_fuzzy: bool = False,            # Fuzzy matching for typos
    tag_fuzzy_threshold: float = 0.6,       # Similarity 0.0-1.0

    # ═══════════════════════════════════════════════════════
    # SORTING ⭐ ELITE (22 FIELDS)
    # ═══════════════════════════════════════════════════════
    sort_by: str | List[str] = None,        # "list_price" or ["beds", "price"]
    sort_direction: str | List[str] = "desc", # "asc" or "desc"
    enable_advanced_sort: bool = False,     # Enable calculated fields

    # ═══════════════════════════════════════════════════════
    # DATA QUALITY ⭐ ELITE
    # ═══════════════════════════════════════════════════════
    clean_data: bool = True,                # Auto-clean & validate (default: True)
    add_derived_fields: bool = True,        # Add price_per_sqft, etc. (default: True)

    # ═══════════════════════════════════════════════════════
    # AGENT/BROKER FILTERS ⭐ ELITE
    # ═══════════════════════════════════════════════════════
    require_agent_email: bool = False,      # Only with agent email
    require_agent_phone: bool = False,      # Only with agent phone

    # ═══════════════════════════════════════════════════════
    # PAGINATION
    # ═══════════════════════════════════════════════════════
    limit: int = 10000,                     # Max results (API limit: 10,000)
    offset: int = 0,                        # Starting position
    parallel: bool = True,                  # Parallel page fetching (faster)

    # ═══════════════════════════════════════════════════════
    # OUTPUT & ADVANCED
    # ═══════════════════════════════════════════════════════
    return_type: str = "pandas",            # "pandas", "pydantic", "raw"
    proxy: str = None,                      # HTTP/HTTPS proxy URL
    extra_property_data: bool = True,       # Fetch additional data
) -> pd.DataFrame | List[Property] | List[dict]
```

### Utility Functions

#### Preset Management
```python
get_available_presets() -> List[str]
# Returns: ['investor_friendly', 'luxury', 'fixer_upper', ...]

get_all_presets_info() -> Dict[str, str]
# Returns: {'investor_friendly': 'Low HOA, good lot size...', ...}

get_preset_info(name: str) -> Dict
# Returns: Full preset configuration with all filters

apply_preset(name: str, overrides: Dict = None) -> Dict
# Apply preset with custom overrides

combine_presets(*names, overrides: Dict = None) -> Dict
# Merge multiple presets

list_presets_by_category() -> Dict[str, List[str]]
# Returns: {'Investment': [...], 'Lifestyle': [...], ...}
```

#### Tag Utilities
```python
discover_tags(df: pd.DataFrame) -> Dict
# Analyze tags in your data

normalize_tags(tags: List[str]) -> List[str]
# Convert aliases to actual tag names

get_tag_category(tag: str) -> str
# Returns: 'outdoor', 'interior', 'view', etc.

get_tags_by_category(category: str) -> List[str]
# Get all tags in a category

get_all_categories() -> List[str]
# Returns: ['outdoor', 'interior', 'structure', ...]

fuzzy_match_tag(search: str, threshold: float = 0.6) -> List[Tuple[str, float]]
# Find similar tags

expand_tag_search(tags: List[str], use_aliases: bool, use_fuzzy: bool) -> List[str]
# Expand search with aliases and fuzzy matching

get_category_info() -> Dict[str, int]
# Returns: {'outdoor': 12, 'interior': 20, ...}
```

#### Sorting & Ranking
```python
sort_properties(df, sort_by, sort_direction="desc", na_position="last") -> pd.DataFrame
# Sort properties by field(s)

get_best_deals(df, limit=10, criteria="price_per_sqft") -> pd.DataFrame
# Find best deals by criteria

get_newest_listings(df, limit=10) -> pd.DataFrame
# Sort by list_date (newest first)

get_recently_updated(df, limit=10) -> pd.DataFrame
# Sort by last_update_date (most recent first)

rank_by_investment_potential(df) -> pd.DataFrame
# AI-powered investment scoring (0-100)

create_custom_score(df, score_function, score_name="custom_score") -> pd.DataFrame
# Apply custom scoring function

get_available_sort_fields() -> Dict[str, str]
# Returns: {'list_price': 'Listing price', 'sqft': 'Square footage', ...}
```

#### Agent/Broker Analysis
```python
get_agent_activity(df) -> pd.DataFrame
# Analyze agent listing activity

get_broker_activity(df) -> pd.DataFrame
# Analyze broker activity

get_office_activity(df) -> pd.DataFrame
# Analyze office activity

find_most_active_agents(df, limit=10) -> pd.DataFrame
# Top agents by listing count

find_properties_by_agent(df, agent_name: str) -> pd.DataFrame
# All listings for an agent

find_properties_by_broker(df, broker_name: str) -> pd.DataFrame
# All listings for a broker

get_wholesale_friendly_agents(df, min_listings=3) -> pd.DataFrame
# Find agents with multiple lower-priced listings

analyze_agent_specialization(df) -> pd.DataFrame
# Agent price categories and specializations

get_contact_export(df) -> pd.DataFrame
# CRM-ready contact list

extract_phone_numbers(phone_data) -> List[str]
# Parse phone from list/dict format

format_contact_info(row) -> Dict
# Format contact for export
```

#### Data Quality
```python
clean_dataframe(df, add_derived_fields=True) -> pd.DataFrame
# Clean entire DataFrame

validate_property_data(property_dict: dict) -> dict
# Validate single property

get_data_quality_report(df) -> Dict
# Comprehensive quality report

clean_price(price) -> float
clean_sqft(sqft) -> int
clean_beds_baths(value) -> int | float
clean_year(year) -> int
clean_hoa_fee(fee) -> float
clean_tags(tags) -> list
validate_coordinates(lat, lon) -> Tuple[float, float]
calculate_price_per_sqft(price, sqft) -> float
```

---

## 📊 Data Schema (75+ Fields)

### Property Data Fields

**Basic Information** (9 fields):
- property_url, property_id, listing_id, permalink
- mls, mls_id, status, mls_status, type

**Address** (9 fields):
- formatted_address (computed), full_street_line, street, unit
- city, state, zip_code, county, fips_code

**Property Details** (13 fields):
- style, beds, full_baths, half_baths, sqft, lot_sqft
- year_built, stories, parking_garage
- text (description), name
- primary_photo, alt_photos (list)

**Pricing & Dates** (14 fields):
- list_price, list_price_min, list_price_max
- sold_price, last_sold_price
- price_per_sqft ⭐ (derived)
- list_date, pending_date, sold_date, last_sold_date
- last_status_change_date, last_update_date
- days_on_mls, hoa_fee
- new_construction

**Location** (7 fields):
- latitude, longitude
- neighborhoods (list), parcel_number
- nearby_schools (list)

**Valuation** (7 fields):
- assessed_value, estimated_value
- tax, tax_history (list)
- current_estimates (list), estimates (list)

**Agent/Broker/Office** (15 fields):
- agent_id, agent_name, agent_email, agent_phones (list)
- agent_mls_set, agent_nrds_id, agent_state_license
- broker_id, broker_name
- builder_id, builder_name
- office_id, office_name, office_email, office_phones (list)

**Tags & Features**:
- tags (list) - 100+ available tags
- flags - is_pending, is_foreclosure, is_price_reduced, etc.

**Additional Structured Data**:
- open_houses (list), pet_policy
- units (list) - for multi-family
- monthly_fees, one_time_fees
- parking, terms, details
- popularity (views, clicks, saves)
- tax_record (owner info, parcel data)
- photos (list)

---

## 🚀 Performance & Best Practices

### Optimization Tips

1. **Use Smart Presets**
   ```python
   # Good - uses optimized preset
   scrape_property(location="...", preset="investor_friendly")

   # Less efficient - manual filters
   scrape_property(location="...", hoa_fee_max=100, lot_sqft_min=5000, ...)
   ```

2. **Enable Parallel Fetching** (default)
   ```python
   # Fast - fetches pages in parallel
   scrape_property(location="...", parallel=True, limit=1000)
   ```

3. **Use Appropriate Limits**
   ```python
   # Good - only what you need
   scrape_property(location="...", limit=100)

   # Wasteful - fetching max when you only need a few
   scrape_property(location="...", limit=10000)
   ```

4. **Keep Data Cleaning Enabled** (default)
   ```python
   # Recommended - reliable, clean data
   scrape_property(location="...", clean_data=True)
   ```

5. **Use Tag Aliases**
   ```python
   # Natural - aliases auto-convert
   tag_filters=["pool", "garage", "mountain"]

   # Harder to remember
   tag_filters=["swimming_pool", "garage_1_or_more", "mountain_view"]
   ```

6. **Narrow with Date Ranges**
   ```python
   # Efficient - targeted search
   scrape_property(location="...", past_days=30, limit=200)

   # Less efficient - processes more data
   scrape_property(location="...", limit=10000)
   ```

7. **Batch Processing with Offset**
   ```python
   # Process in chunks
   for offset in range(0, 1000, 200):
       batch = scrape_property(
           location="...",
           limit=200,
           offset=offset
       )
       process_batch(batch)
   ```

### API Limits & Workarounds

**Realtor.com API Limits:**
- Max 10,000 results per query
- 200 results per page (50 pages max)

**Workarounds:**
```python
# Split by time ranges
for month in range(1, 13):
    properties = scrape_property(
        location="Phoenix, AZ",
        date_from=datetime(2024, month, 1),
        date_to=datetime(2024, month + 1, 1),
        limit=10000
    )

# Split by price ranges
price_ranges = [(0, 200000), (200000, 400000), (400000, 600000)]
for min_p, max_p in price_ranges:
    properties = scrape_property(
        location="Phoenix, AZ",
        price_min=min_p,
        price_max=max_p,
        limit=10000
    )
```

### Built-in Optimizations

- ✅ **Retry Logic**: 3 retries with exponential backoff (4s base)
- ✅ **Connection Pooling**: Persistent HTTP session
- ✅ **Parallel Pagination**: Concurrent page fetching
- ✅ **Early Termination**: Sequential mode stops when filters exhausted
- ✅ **Data Caching**: Session-level caching
- ✅ **Efficient Filtering**: Client-side filters applied post-pagination

---

## 🎓 Advanced Topics

### OAuth Authentication

HomeHarvest Elite handles Realtor.com OAuth automatically:

```python
# No API keys needed - authentication is automatic
properties = scrape_property(location="Phoenix, AZ")

# Behind the scenes:
# 1. Device authentication request
# 2. Token generation
# 3. Automatic token refresh
# 4. Retry on auth failures
```

### Proxy Support

Use proxies for high-volume scraping:

```python
properties = scrape_property(
    location="Phoenix, AZ",
    proxy="http://proxy.example.com:8080",  # HTTP/HTTPS proxy
    limit=1000
)
```

### Return Type Options

```python
# Pandas DataFrame (default) - best for analysis
df = scrape_property(location="...", return_type="pandas")

# Pydantic models - type-safe, validated
models = scrape_property(location="...", return_type="pydantic")

# Raw dicts - direct API response
raw = scrape_property(location="...", return_type="raw")
```

### Custom Preset Creation

```python
from homeharvest import apply_preset, combine_presets

# Custom preset with overrides
my_preset = apply_preset(
    "investor_friendly",
    overrides={
        'price_max': 350000,
        'beds_min': 4,
        'tag_filters': ['pool', 'rv_parking']
    }
)

properties = scrape_property(location="...", **my_preset)

# Combine multiple presets
hybrid = combine_presets(
    "investor_friendly",
    "pool_home",
    overrides={'price_max': 500000}
)
```

---

## 🤝 Contributing

We welcome contributions! Areas for improvement:

- Additional smart presets
- New calculated fields
- Enhanced scoring algorithms
- Additional data sources
- Performance optimizations
- Documentation improvements

---

## 📄 License

MIT License - Same as original HomeHarvest

---

## 🙏 Credits

**Built on [HomeHarvest](https://github.com/ZacharyHampton/HomeHarvest)** by Zachary Hampton

**HomeHarvest Elite** developed to provide real estate investors and analysts with professional-grade tools for property research, investment analysis, and wholesale deal sourcing.

---

## 📞 Support & Resources

- **Documentation**: Full API reference above
- **Examples**: See `examples/` directory
- **Technical Details**: Check `IMPROVEMENTS.md`
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Ask questions in Discussions

---

## 📈 Stats & Performance

**Code Base:**
- 2,500+ lines of enhanced features
- 6 new modules (presets, tags, sorting, agents, cleaning, validation)
- 40+ utility functions
- 70+ new features

**Data Coverage:**
- 75+ property fields
- 100+ property tags (10 categories)
- 24 smart presets
- 22 sortable fields
- 18 filter types

**Performance:**
- 10,000 result limit (API max)
- Parallel pagination (4-10x faster)
- Auto-retry logic (3 attempts)
- Session caching
- 1-2 seconds per page

---

## 🚀 Quick Command Reference

```python
# Essential imports
from homeharvest import (
    scrape_property,                    # Main function
    rank_by_investment_potential,       # AI scoring
    get_wholesale_friendly_agents,      # Agent analysis
    get_best_deals,                     # Find bargains
    get_data_quality_report,            # Data validation
    discover_tags,                      # Tag discovery
    get_all_presets_info,              # List presets
)

# Quick searches
scrape_property(location="...", preset="investor_friendly")
scrape_property(location="...", past_hours=1)
scrape_property(location="...", tag_filters=["pool", "garage"])
scrape_property(location="...", has_pool=True, waterfront=True)

# Analysis
rank_by_investment_potential(properties)
get_wholesale_friendly_agents(properties, min_listings=3)
get_best_deals(properties, criteria="price_per_sqft")

# Export
properties.to_csv('results.csv')
properties.to_excel('results.xlsx')
contacts = get_contact_export(properties)
```

---

**🏡 Happy House Hunting with HomeHarvest Elite!**

*The only real estate scraping library you'll ever need.*
