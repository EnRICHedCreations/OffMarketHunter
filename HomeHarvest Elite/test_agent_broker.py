"""
Test agent/broker data extraction and analysis features
"""
import sys
import io
import pandas as pd
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from homeharvest import (
    scrape_property, get_agent_activity, get_broker_activity,
    find_most_active_agents, find_properties_by_agent,
    get_contact_export, analyze_agent_specialization,
    get_wholesale_friendly_agents, filter_by_agent_contact,
    extract_phone_numbers
)

print("Testing Agent/Broker Features")
print("=" * 80)

# Test 1: Phone number extraction
print("\n[Test 1] Phone Number Extraction")
test_phones = [
    {'number': '(602) 555-1234'},
    {'number': '480-555-5678'},
]
phones = extract_phone_numbers(test_phones)
print(f"Extracted phones: {phones}")

# Test 2: Get properties with agent contact info
print("\n[Test 2] Filter by Agent Contact")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        require_agent_email=True,  # Only properties with agent email
        limit=50
    )
    print(f"✓ Found {len(properties)} properties with agent email")

    if len(properties) > 0:
        sample = properties.iloc[0]
        print(f"  Sample agent: {sample.get('agent_name')}")
        print(f"  Email: {sample.get('agent_email')}")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()

# Test 3: Get agent activity
print("\n[Test 3] Agent Activity Analysis")
try:
    properties = scrape_property(
        location="Scottsdale, AZ",
        listing_type="for_sale",
        limit=100
    )

    agent_stats = get_agent_activity(properties)
    print(f"✓ Analyzed {len(agent_stats)} unique agents")

    if len(agent_stats) > 0:
        print("\nTop 5 Most Active Agents:")
        for idx, agent in agent_stats.head(5).iterrows():
            print(f"  {idx + 1}. {agent['agent_name']}")
            print(f"     Listings: {agent['listing_count']}")
            print(f"     Avg Price: ${agent['avg_price']:,.0f}" if pd.notna(agent['avg_price']) else "     Avg Price: N/A")
            print(f"     Broker: {agent.get('broker_name', 'N/A')}")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()

# Test 4: Find most active agents
print("\n[Test 4] Find Most Active Agents")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        limit=100
    )

    top_agents = find_most_active_agents(properties, limit=5)
    print(f"✓ Found top {len(top_agents)} agents")

    for idx, agent in top_agents.iterrows():
        print(f"\n{idx + 1}. {agent['agent_name']}: {agent['listing_count']} listings")
        if pd.notna(agent.get('agent_email')):
            print(f"   Email: {agent['agent_email']}")
        if pd.notna(agent.get('primary_phone')):
            print(f"   Phone: {agent['primary_phone']}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 5: Broker activity
print("\n[Test 5] Broker Activity Analysis")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        limit=100
    )

    broker_stats = get_broker_activity(properties)
    print(f"✓ Analyzed {len(broker_stats)} unique brokers")

    if len(broker_stats) > 0:
        print("\nTop 3 Brokers:")
        for idx, broker in broker_stats.head(3).iterrows():
            print(f"  {idx + 1}. {broker['broker_name']}")
            print(f"     Listings: {broker['listing_count']}")
            print(f"     Agents: {broker['unique_agents']}")
            print(f"     Avg Price: ${broker['avg_price']:,.0f}" if pd.notna(broker['avg_price']) else "     Avg Price: N/A")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 6: Agent specialization
print("\n[Test 6] Agent Specialization Analysis")
try:
    properties = scrape_property(
        location="Scottsdale, AZ",
        listing_type="for_sale",
        limit=100
    )

    specialization = analyze_agent_specialization(properties)
    print(f"✓ Analyzed {len(specialization)} agents")

    if len(specialization) > 0:
        print("\nAgent Specializations (Top 3):")
        for idx, agent in specialization.head(3).iterrows():
            print(f"\n{idx + 1}. {agent['agent_name']}")
            print(f"   Listings: {agent['listing_count']}")
            print(f"   Price Category: {agent.get('price_category', 'N/A')}")
            print(f"   Avg Price: ${agent['avg_price']:,.0f}" if pd.notna(agent['avg_price']) else "   Avg Price: N/A")
            print(f"   Avg Sqft: {agent['avg_sqft']:,.0f}" if pd.notna(agent['avg_sqft']) else "   Avg Sqft: N/A")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 7: Wholesale-friendly agents
print("\n[Test 7] Find Wholesale-Friendly Agents")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        limit=150
    )

    wholesale_agents = get_wholesale_friendly_agents(properties, min_listings=3)
    print(f"✓ Found {len(wholesale_agents)} wholesale-friendly agents")

    if len(wholesale_agents) > 0:
        print("\nTop 5 Wholesale-Friendly Agents:")
        for idx, agent in wholesale_agents.head(5).iterrows():
            print(f"\n{idx + 1}. {agent['agent_name']}")
            print(f"   Wholesale Score: {agent.get('wholesale_score', 0):.1f}/100")
            print(f"   Listings: {agent['listing_count']}")
            print(f"   Avg Price: ${agent['avg_price']:,.0f}" if pd.notna(agent['avg_price']) else "   Avg Price: N/A")
            if pd.notna(agent.get('agent_email')):
                print(f"   Email: {agent['agent_email']}")
            if pd.notna(agent.get('primary_phone')):
                print(f"   Phone: {agent['primary_phone']}")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()

# Test 8: Export contacts
print("\n[Test 8] Export Agent Contacts")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        limit=100
    )

    contacts = get_contact_export(properties)
    print(f"✓ Exported {len(contacts)} agent contacts")

    if len(contacts) > 0:
        print(f"\nSample Contacts (First 3):")
        for idx, contact in contacts.head(3).iterrows():
            print(f"\n  {contact['agent_name']}")
            print(f"    Email: {contact.get('agent_email', 'N/A')}")
            print(f"    Phone: {contact.get('agent_primary_phone', 'N/A')}")
            print(f"    Office: {contact.get('office_name', 'N/A')}")

        # Save to CSV
        contacts.to_csv('agent_contacts.csv', index=False)
        print(f"\n✓ Saved to agent_contacts.csv")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 9: Find properties by specific agent
print("\n[Test 9] Find Properties by Specific Agent")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        limit=100
    )

    # Get top agent name
    top_agents = find_most_active_agents(properties, limit=1)
    if len(top_agents) > 0:
        agent_name = top_agents.iloc[0]['agent_name']
        agent_props = find_properties_by_agent(properties, agent_name)

        print(f"✓ Found {len(agent_props)} properties by '{agent_name}'")

        if len(agent_props) > 0:
            print("\nTheir Listings:")
            for idx, prop in agent_props.head(3).iterrows():
                print(f"  ${prop['list_price']:,.0f} - {prop.get('beds', 'N/A')} bed, {prop.get('sqft', 'N/A')} sqft")
                print(f"  {prop.get('city', 'N/A')}, {prop.get('state', 'N/A')}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 10: Combined filtering - wholesale agents with contact info
print("\n[Test 10] Wholesale Properties with Agent Contact")
try:
    properties = scrape_property(
        location="Phoenix, AZ",
        listing_type="for_sale",
        preset="investor_friendly",
        require_agent_email=True,  # Must have agent email
        limit=100
    )

    wholesale_agents = get_wholesale_friendly_agents(properties, min_listings=2)

    print(f"✓ Found {len(wholesale_agents)} wholesale agents with contact info")
    print(f"  Total properties: {len(properties)}")

    if len(wholesale_agents) > 0:
        print("\nTop Wholesale Agents to Contact:")
        for idx, agent in wholesale_agents.head(3).iterrows():
            print(f"\n  {agent['agent_name']}")
            print(f"    Score: {agent.get('wholesale_score', 0):.1f}/100")
            print(f"    Listings: {agent['listing_count']}")
            print(f"    Email: {agent['agent_email']}")
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 80)
print("Agent/Broker Tests Complete!")
