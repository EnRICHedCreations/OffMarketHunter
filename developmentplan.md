# OffMarket Hunter - Development Plan

## Project Overview

**OffMarket Hunter** is a specialized web application for wholesale real estate investors focused on finding off-market properties and distressed sellers. It leverages HomeHarvest Elite to monitor properties that go off-market without selling, track price reductions, and identify motivated sellers through listing history analysis.

### Core Value Proposition

Most wholesalers focus only on active listings. OffMarket Hunter gives them an edge by:

1. **Tracking Off-Market Properties** - Properties that were listed but withdrawn (often motivated sellers)
2. **Price Reduction Detection** - Identifies desperate sellers who have dropped their prices
3. **Expired Listing Monitoring** - Properties that sat too long and expired (highly motivated)
4. **Historical Timeline View** - See the complete listing history to identify seller motivation
5. **Status Change Alerts** - Instant notifications when properties go off-market or reduce prices

### What It Does NOT Include

- No skip tracing functionality
- No mailing list generation
- No direct mail campaign tools
- Focus is purely on finding and analyzing off-market opportunities

---

## Technical Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui (Button, Card, Input, Dialog, Badge, Table, Tabs)
- **Forms:** React Hook Form + Zod validation
- **Auth:** NextAuth.js v5

### Backend
- **API:** Next.js API Routes
- **Database:** Vercel Postgres (Neon)
- **Auth:** NextAuth.js with bcrypt password hashing
- **Python Runtime:** Vercel Python Runtime

### Python Services
- **HomeHarvest Elite:** Property scraping and analysis
- **pandas:** Data processing
- **numpy:** Calculations

### Infrastructure
- **Hosting:** Vercel
- **Database:** Vercel Postgres
- **Cron Jobs:** Vercel Cron (hourly + daily)
- **Email:** Resend API

---

## Core Features

### 1. Off-Market Property Discovery

**What Gets Tracked:**
- Properties with `listing_type="off_market"`
- Recently delisted properties (active → off_market transition)
- Properties marked as withdrawn
- Expired listings that never sold

**Data Collection:**
- Scrape all off-market properties in target areas
- Track listing status changes
- Monitor days on market before delisting
- Record last known list price
- Store reason for off-market status (if available)

**HomeHarvest Elite Usage:**
```python
properties = scrape_property(
    location="Phoenix, AZ",
    listing_type="off_market",
    past_days=90,  # Recent off-market only
    add_derived_fields=True,
    clean_data=True
)
```

### 2. Price Reduction Tracking

**What Gets Monitored:**
- All active listings in target markets
- Daily price change detection
- `is_price_reduced` flag from Realtor.com
- Percentage of price drop
- Multiple reduction detection (more desperate)

**Motivation Scoring:**
- 1 reduction: Moderate motivation
- 2 reductions: High motivation
- 3+ reductions: Extremely motivated
- Reduction >10%: Very motivated
- Reduction >20%: Desperate

**Alert Triggers:**
- First price reduction (any amount)
- Second or more reduction
- Reduction >10% from original
- Reduction >20% from original

### 3. Days on Market (DOM) Intelligence

**Tracking:**
- Current days on market
- DOM before going off-market (historical)
- Market-average DOM comparison
- Stale listing identification (90+ days)

**Insights:**
- Properties with 90+ DOM → Motivated sellers
- Off-market after 120+ DOM → Highly motivated
- Quick delisting (<30 days) → May not be motivated
- Price reductions + high DOM → Prime targets

### 4. Status Change Monitoring

**Status Transitions Tracked:**
- for_sale → off_market (withdrawn)
- for_sale → expired
- pending → off_market (fell through)
- contingent → off_market (deal died)

**Why This Matters:**
- Withdrawn = Seller testing market, may accept lower
- Expired = Motivated, listing contract ended
- Pending fell through = Financing issues, may accept cash offer
- Contingent fell through = Inspection issues, motivated to sell

### 5. Historical Listing Timeline

**For Each Property, Show:**
- Original list date
- Original list price
- All price reductions with dates
- Status changes with dates
- Days between each event
- Current status
- Time off-market

**Visual Timeline:**
```
Jan 1: Listed at $400k
Feb 15: Reduced to $380k (-5%)
Apr 1: Reduced to $360k (-10%)
May 10: Went off-market (129 days)
```

### 6. Motivation Score

**Algorithm (0-100 scale):**
- **25% Days on Market** - More days = higher score
- **30% Price Reductions** - More reductions & bigger % = higher score
- **20% Off-Market Duration** - How long it's been off-market
- **15% Status Changes** - Failed pending/contingent = higher score
- **10% Market Conditions** - Compare to area averages

**Score Ranges:**
- 90-100: Extremely motivated (immediate contact)
- 80-89: Highly motivated (priority contact)
- 70-79: Moderately motivated (good prospect)
- 60-69: Somewhat motivated (worth contacting)
- Below 60: Low motivation (skip)

### 7. Market Watchlists

**User Creates Watchlists:**
- Name: "Phoenix Distressed"
- Location: "Phoenix, AZ"
- Property criteria:
  - Price range
  - Beds/baths
  - Sqft/lot size
  - Property type
- Monitoring settings:
  - Track off-market properties
  - Track price reductions
  - Track expired listings
  - Alert threshold (motivation score)

**System Monitors:**
- Hourly scans for status changes
- Daily full scrapes for new off-market properties
- Alerts when properties meet criteria

---

## Database Schema

### users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### watchlists
```sql
CREATE TABLE watchlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    price_min INTEGER,
    price_max INTEGER,
    beds_min INTEGER,
    beds_max INTEGER,
    baths_min DECIMAL(3,1),
    baths_max DECIMAL(3,1),
    sqft_min INTEGER,
    sqft_max INTEGER,
    lot_sqft_min INTEGER,
    lot_sqft_max INTEGER,
    year_built_min INTEGER,
    year_built_max INTEGER,
    property_types JSONB,  -- ['single_family', 'multi_family', etc.]

    -- Monitoring settings
    track_off_market BOOLEAN DEFAULT TRUE,
    track_price_reductions BOOLEAN DEFAULT TRUE,
    track_expired BOOLEAN DEFAULT TRUE,
    alert_threshold INTEGER DEFAULT 80,  -- Motivation score

    is_active BOOLEAN DEFAULT TRUE,
    last_scraped_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### properties
```sql
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    property_id VARCHAR(255) UNIQUE NOT NULL,  -- Realtor.com ID
    watchlist_id INTEGER REFERENCES watchlists(id) ON DELETE CASCADE,

    -- Address
    full_street_line TEXT,
    city VARCHAR(255),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    county VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Property details
    beds INTEGER,
    full_baths INTEGER,
    half_baths INTEGER,
    baths DECIMAL(3,1),
    sqft INTEGER,
    lot_sqft INTEGER,
    year_built INTEGER,
    property_type VARCHAR(50),

    -- Current status
    current_status VARCHAR(50),  -- off_market, for_sale, expired, etc.
    current_list_price DECIMAL(12, 2),

    -- Historical data
    original_list_date TIMESTAMP,
    original_list_price DECIMAL(12, 2),
    off_market_date TIMESTAMP,
    days_on_market_before_delisting INTEGER,
    total_days_on_market INTEGER,

    -- Price reduction tracking
    price_reduction_count INTEGER DEFAULT 0,
    total_price_reduction_amount DECIMAL(12, 2),
    total_price_reduction_percent DECIMAL(5, 2),
    last_price_reduction_date TIMESTAMP,

    -- Motivation score
    motivation_score DECIMAL(5, 2),
    motivation_score_dom DECIMAL(5, 2),
    motivation_score_reductions DECIMAL(5, 2),
    motivation_score_off_market DECIMAL(5, 2),
    motivation_score_status DECIMAL(5, 2),
    motivation_score_market DECIMAL(5, 2),

    -- Agent/Broker
    agent_name VARCHAR(255),
    agent_email VARCHAR(255),
    agent_phone VARCHAR(50),
    broker_name VARCHAR(255),

    -- MLS
    mls_id VARCHAR(100),
    mls_status VARCHAR(50),

    -- Media
    primary_photo TEXT,
    photos JSONB,

    -- Additional data
    description_text TEXT,
    tags JSONB,
    raw_data JSONB,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_properties_motivation ON properties(motivation_score DESC);
CREATE INDEX idx_properties_watchlist ON properties(watchlist_id);
CREATE INDEX idx_properties_status ON properties(current_status);
CREATE INDEX idx_properties_property_id ON properties(property_id);
```

### property_history
```sql
CREATE TABLE property_history (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,

    event_type VARCHAR(50) NOT NULL,  -- status_change, price_reduction, listing
    event_date TIMESTAMP NOT NULL,

    -- Status changes
    old_status VARCHAR(50),
    new_status VARCHAR(50),

    -- Price changes
    old_price DECIMAL(12, 2),
    new_price DECIMAL(12, 2),
    price_change_amount DECIMAL(12, 2),
    price_change_percent DECIMAL(5, 2),

    -- Context
    days_since_last_event INTEGER,
    notes TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_history_property ON property_history(property_id, event_date DESC);
CREATE INDEX idx_history_type ON property_history(event_type);
```

### alerts
```sql
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    watchlist_id INTEGER REFERENCES watchlists(id) ON DELETE CASCADE,

    alert_type VARCHAR(50) NOT NULL,  -- new_off_market, price_reduction, high_motivation
    alert_reason TEXT,  -- Human-readable explanation
    motivation_score DECIMAL(5, 2),

    sent_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP,
    dismissed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alerts_user ON alerts(user_id, read_at);
CREATE INDEX idx_alerts_unread ON alerts(user_id) WHERE read_at IS NULL;
```

---

## User Interface

### 1. Dashboard (`/dashboard`)

**Stats Cards:**
- Total properties tracked
- High motivation deals (80+)
- New off-market this week
- Active watchlists
- Unread alerts

**Property Feed:**
- Grid of property cards
- Sorted by motivation score (default)
- Each card shows:
  - Property photo
  - Motivation score badge (color-coded)
  - Address
  - Current status (off-market, expired, etc.)
  - Days on market
  - Original price → Current price (if reduced)
  - "View Details" button

**Filters:**
- All / Off-Market / Price Reduced / Expired
- By watchlist
- By motivation score range
- By days off-market

### 2. Property Detail Page (`/properties/[id]`)

**Header Section:**
- Large photo gallery
- Motivation score prominently displayed
- Address with map link
- Current status badge

**Timeline Section:**
- Visual timeline of listing history
- All price changes with dates and percentages
- Status changes with dates
- Days between each event
- Total days on market

**Motivation Breakdown:**
- Overall score with visual gauge
- Individual component scores:
  - Days on Market: 22/25
  - Price Reductions: 27/30
  - Off-Market Duration: 15/20
  - Status Changes: 12/15
  - Market Conditions: 8/10
- Explanation text for each component

**Property Details:**
- Price (original → current if reduced)
- Beds / Baths / Sqft
- Lot size
- Year built
- Property type
- MLS ID

**Contact Information:**
- Agent name
- Broker name
- Contact info (if available)
- "View on Realtor.com" link

**Actions:**
- "Mark as Interested"
- "Dismiss"
- "Add Note"
- "Export to CSV"

### 3. Watchlists Page (`/watchlists`)

**Add Watchlist Button** (prominent)

**List of Watchlists:**
- Each card shows:
  - Watchlist name
  - Location
  - Criteria summary
  - Properties tracked count
  - New off-market count (last 7 days)
  - Last scanned timestamp
  - Active/Inactive toggle
  - "Edit" button
  - "Delete" button

**Add/Edit Watchlist Form:**
- Watchlist name
- Location (text input with suggestions)
- Property criteria:
  - Price range
  - Beds/baths
  - Sqft/lot size
  - Property types (checkboxes)
- Monitoring options:
  - Track off-market properties (checkbox)
  - Track price reductions (checkbox)
  - Track expired listings (checkbox)
  - Alert threshold (slider 50-100)
- Save/Cancel buttons

### 4. Alerts Page (`/alerts`)

**Filter Buttons:**
- All / Unread / By Type
- "Mark All as Read" button

**Alert List:**
- Newest first
- Unread highlighted
- Each alert shows:
  - Alert type badge (Off-Market, Price Drop, High Motivation)
  - Property photo thumbnail
  - Address
  - Alert reason ("Went off-market after 129 days")
  - Motivation score
  - Timestamp ("2 hours ago")
  - "View Property" button
  - Mark as read (if unread)

**Alert Types:**
- **New Off-Market:** Property just went off-market
- **Price Reduction:** Property price dropped
- **High Motivation:** Property scored 80+ on motivation scale
- **Expired Listing:** Property expired without selling
- **Deal Fell Through:** Pending/contingent status changed to off-market

### 5. Settings Page (`/settings`)

**Profile Section:**
- Name (editable)
- Email (display only)
- Password change form

**Notification Preferences:**
- Email alerts enabled (toggle)
- Alert types to notify:
  - New off-market properties
  - Price reductions
  - High motivation scores
  - Expired listings
- Alert threshold (motivation score)
- Quiet hours (optional)

**Account Section:**
- Account created date
- "Delete Account" button

---

## API Endpoints

### Auth
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Login (NextAuth)
- `POST /api/auth/signout` - Logout (NextAuth)

### Watchlists
- `GET /api/watchlists` - Get user's watchlists
- `POST /api/watchlists` - Create watchlist
- `PUT /api/watchlists/[id]` - Update watchlist
- `DELETE /api/watchlists/[id]` - Delete watchlist
- `POST /api/watchlists/[id]/scan` - Manual scan trigger

### Properties
- `GET /api/properties` - Get properties (with filters)
- `GET /api/properties/[id]` - Get single property with history
- `GET /api/properties/stats` - Dashboard stats
- `GET /api/properties/[id]/history` - Get property timeline

### Alerts
- `GET /api/alerts` - Get user's alerts
- `PUT /api/alerts/[id]/read` - Mark alert as read
- `PUT /api/alerts/read-all` - Mark all as read
- `DELETE /api/alerts/[id]` - Dismiss alert

### Cron Jobs
- `GET /api/cron/hourly-status-check` - Check status changes (hourly)
- `GET /api/cron/daily-off-market-scan` - Full off-market scan (daily)

### Python Functions
- `POST /api/scrape-off-market` - Scrape off-market properties
- `POST /api/scrape-active` - Scrape active listings (price changes)
- `POST /api/score-motivation` - Calculate motivation scores

---

## Cron Job Strategy

### Hourly Status Check (`0 * * * *`)
**Purpose:** Detect status changes in real-time

**Process:**
1. Get all active watchlists
2. For each watchlist:
   - Scrape active listings in location
   - Compare to last known status in database
   - Detect status changes (active → off-market, pending → off-market)
   - Detect price reductions
3. Update property records
4. Create property_history entries
5. Calculate motivation scores
6. Create alerts for high-scoring changes
7. Send email notifications

**HomeHarvest Usage:**
```python
# Check active listings for changes
properties = scrape_property(
    location=watchlist.location,
    listing_type="for_sale",
    updated_in_past_hours=1,  # Recent updates only
    **watchlist.filters
)
```

### Daily Off-Market Scan (`0 2 * * *`)
**Purpose:** Full scan of off-market properties

**Process:**
1. Get all active watchlists
2. For each watchlist:
   - Scrape all off-market properties in location
   - Filter by watchlist criteria
   - Check if property already in database
   - If new, create property record
   - Calculate motivation score
   - Create alert if score >= threshold
3. Update last_scraped_at timestamps
4. Send daily digest emails

**HomeHarvest Usage:**
```python
# Get all recent off-market
properties = scrape_property(
    location=watchlist.location,
    listing_type="off_market",
    past_days=90,  # Last 3 months
    **watchlist.filters
)
```

---

## Motivation Scoring Algorithm

### Implementation

```python
def calculate_motivation_score(property_data, property_history, market_data):
    """
    Calculate motivation score 0-100

    Components:
    - 25% Days on Market
    - 30% Price Reductions
    - 20% Off-Market Duration
    - 15% Status Changes
    - 10% Market Conditions
    """

    # Component 1: Days on Market (25 points)
    dom = property_data.get('days_on_market_before_delisting', 0)
    if dom == 0:
        dom = property_data.get('total_days_on_market', 0)

    if dom < 30:
        dom_score = 5
    elif dom < 60:
        dom_score = 10
    elif dom < 90:
        dom_score = 15
    elif dom < 120:
        dom_score = 20
    else:
        dom_score = 25  # 120+ days = max score

    # Component 2: Price Reductions (30 points)
    reduction_count = property_data.get('price_reduction_count', 0)
    reduction_percent = property_data.get('total_price_reduction_percent', 0)

    count_score = min(reduction_count * 7, 15)  # Max 15 points (2+ reductions)
    percent_score = min(reduction_percent * 0.75, 15)  # Max 15 points (20%+ reduction)
    reduction_score = count_score + percent_score

    # Component 3: Off-Market Duration (20 points)
    off_market_days = calculate_days_since_off_market(property_data)

    if off_market_days < 7:
        off_market_score = 20  # Fresh off-market = highest motivation
    elif off_market_days < 30:
        off_market_score = 15
    elif off_market_days < 90:
        off_market_score = 10
    else:
        off_market_score = 5  # Old off-market = less motivated

    # Component 4: Status Changes (15 points)
    status_score = 0

    # Check for failed pending/contingent
    has_failed_pending = any(
        h['old_status'] in ['pending', 'contingent'] and
        h['new_status'] == 'off_market'
        for h in property_history
    )
    if has_failed_pending:
        status_score += 10

    # Check for expired listing
    if property_data.get('current_status') == 'expired':
        status_score += 5

    status_score = min(status_score, 15)

    # Component 5: Market Conditions (10 points)
    # Compare property DOM to market average DOM
    market_avg_dom = market_data.get('avg_days_on_market', 60)

    if dom > market_avg_dom * 1.5:
        market_score = 10  # Way above average = highly motivated
    elif dom > market_avg_dom * 1.2:
        market_score = 7
    elif dom > market_avg_dom:
        market_score = 5
    else:
        market_score = 3

    # Total score
    total_score = (
        dom_score +
        reduction_score +
        off_market_score +
        status_score +
        market_score
    )

    return {
        'total': round(total_score, 2),
        'dom_component': dom_score,
        'reduction_component': reduction_score,
        'off_market_component': off_market_score,
        'status_component': status_score,
        'market_component': market_score
    }
```

---

## Development Phases

### Phase 1: Foundation (Week 1)
**Goal:** Basic app structure and authentication

**Tasks:**
1. Initialize Next.js project with TypeScript and Tailwind
2. Set up Vercel Postgres database
3. Create database schema (all tables)
4. Implement NextAuth authentication
   - Sign up page
   - Login page
   - Password hashing
   - Session management
5. Create protected layout with sidebar navigation
6. Build basic dashboard page (empty state)

**Deliverable:** User can sign up, log in, and see empty dashboard

### Phase 2: Watchlist Management (Week 1)
**Goal:** Users can create and manage watchlists

**Tasks:**
1. Create watchlists page UI
2. Build "Add Watchlist" form with validation
3. Implement watchlist CRUD API endpoints
4. Add watchlist list view
5. Create edit watchlist functionality
6. Add delete watchlist with confirmation
7. Implement active/inactive toggle

**Deliverable:** Users can create, view, edit, and delete watchlists

### Phase 3: Python Integration (Week 2)
**Goal:** Connect HomeHarvest Elite for data scraping

**Tasks:**
1. Set up Vercel Python runtime
2. Install HomeHarvest Elite library
3. Create `/api/scrape-off-market` endpoint
   - Accept watchlist parameters
   - Call HomeHarvest Elite
   - Return DataFrame as JSON
4. Create `/api/scrape-active` endpoint
   - For status change detection
5. Test scraping with real data
6. Handle errors and timeouts gracefully

**Deliverable:** Python endpoints successfully scrape property data

### Phase 4: Property Storage & Display (Week 2)
**Goal:** Store properties and display them

**Tasks:**
1. Create property storage logic
   - Save scraped properties to database
   - Handle duplicates (property_id unique)
   - Store raw_data as JSONB
2. Build property card component
3. Create property list view on dashboard
4. Implement property detail page
   - Full property info
   - Photo gallery
   - Agent contact
5. Add property filtering
6. Add property sorting

**Deliverable:** Users see scraped properties in dashboard

### Phase 5: Historical Tracking (Week 3)
**Goal:** Track property changes over time

**Tasks:**
1. Implement property_history table logic
2. Create status change detection
   - Compare current status to stored status
   - Create history entry on change
3. Create price reduction detection
   - Track price changes
   - Calculate reduction amounts and percentages
   - Increment reduction count
4. Build property timeline component
   - Visual timeline of events
   - Price changes with dates
   - Status changes with dates
5. Display timeline on property detail page

**Deliverable:** Property history tracked and displayed

### Phase 6: Motivation Scoring (Week 3)
**Goal:** Calculate and display motivation scores

**Tasks:**
1. Implement motivation scoring algorithm
2. Create `/api/score-motivation` Python endpoint
3. Calculate scores for all properties
4. Store score components in database
5. Create motivation score badge component
6. Build score breakdown visualization
   - Gauge chart for total score
   - Bar chart for components
   - Explanation text
7. Sort properties by motivation score
8. Add score filter

**Deliverable:** All properties have motivation scores displayed

### Phase 7: Cron Jobs (Week 4)
**Goal:** Automated hourly and daily scans

**Tasks:**
1. Create `/api/cron/hourly-status-check` endpoint
   - Get all active watchlists
   - Scrape recent updates
   - Detect status changes
   - Detect price reductions
   - Update database
2. Create `/api/cron/daily-off-market-scan` endpoint
   - Full off-market scan
   - Store new properties
   - Calculate motivation scores
3. Set up Vercel Cron jobs
   - Hourly: `0 * * * *`
   - Daily: `0 2 * * *`
4. Add cron authentication with CRON_SECRET
5. Test cron execution

**Deliverable:** System automatically scans and updates properties

### Phase 8: Alert System (Week 4)
**Goal:** Notify users of high-value opportunities

**Tasks:**
1. Create alert generation logic
   - Check motivation score vs. threshold
   - Create alert record
   - Determine alert type
2. Build alerts page UI
   - List view of all alerts
   - Unread highlighting
   - Filter by type
3. Implement alert API endpoints
   - Get alerts
   - Mark as read
   - Dismiss alert
4. Add alert badge to header
   - Show unread count
   - Link to alerts page
5. Create alert notification component

**Deliverable:** Users see alerts for high-motivation properties

### Phase 9: Email Notifications (Week 5)
**Goal:** Send email alerts via Resend

**Tasks:**
1. Set up Resend API key
2. Create email templates
   - New off-market property
   - Price reduction
   - High motivation score
   - Daily digest
3. Implement email sending logic
   - Send on alert creation
   - Respect user preferences
   - Check quiet hours
4. Add unsubscribe functionality
5. Test email delivery

**Deliverable:** Users receive email alerts

### Phase 10: Polish & Testing (Week 5)
**Goal:** Production-ready application

**Tasks:**
1. Add loading states to all async operations
2. Implement error handling and user-friendly messages
3. Add empty states for no data
4. Mobile responsive testing and fixes
5. Performance optimization
   - Database query optimization
   - Add indexes
   - Image optimization
6. Security audit
   - SQL injection prevention
   - XSS protection
   - CSRF tokens
7. User testing and feedback
8. Bug fixes

**Deliverable:** Production-ready application

### Phase 11: Settings & Preferences (Week 6)
**Goal:** User customization options

**Tasks:**
1. Create settings page layout
2. Build profile section
   - Name edit
   - Password change
3. Build notification preferences section
   - Email alerts toggle
   - Alert type selections
   - Alert threshold slider
   - Quiet hours selector
4. Implement user preferences API
5. Apply preferences to alert logic

**Deliverable:** Users can customize notifications

### Phase 12: Advanced Features (Week 6+)
**Goal:** Enhanced functionality

**Tasks:**
1. Property notes
   - Add note functionality
   - Display notes on property page
2. Interest tracking
   - Mark as interested
   - Interested properties page
3. Export functionality
   - Export properties to CSV
   - Export contacts to CSV
4. Market statistics
   - Average motivation score
   - Total off-market count
   - Trends over time
5. Property comparison
   - Compare up to 3 properties side-by-side

**Deliverable:** Enhanced user experience with advanced features

---

## Environment Variables

```env
# Database
POSTGRES_URL=
POSTGRES_URL_NON_POOLING=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Cron
CRON_SECRET=

# Email (optional for MVP, required for Phase 9)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Key Differentiators from WholesaleOS

1. **Focus:** Off-market and distressed properties vs. all new listings
2. **Scoring:** Motivation score vs. investment score
3. **Data Source:** `off_market` listing type + status change tracking
4. **Timeline:** Historical tracking of property listing journey
5. **Alert Types:** Status changes and price reductions vs. high investment scores
6. **Use Case:** Finding motivated sellers vs. finding good deals

---

## Success Metrics

### User Engagement
- Daily active users
- Properties viewed per session
- Alerts acted upon
- Watchlists created per user

### System Performance
- Cron job success rate (>99%)
- Scraping success rate (>95%)
- Average properties found per watchlist
- Alert delivery rate (100%)

### User Value
- Properties marked as interested
- Contacts made with agents
- Deals closed (via user surveys)
- User retention rate (>70% month 2)

---

## Future Enhancements (Post-Launch)

1. **Property Comparison Tool**
   - Side-by-side comparison of up to 3 properties
   - Motivation score comparison
   - Timeline comparison

2. **Advanced Filters**
   - Filter by specific status transitions
   - Filter by reduction percentage
   - Filter by agent/broker

3. **Market Analytics Dashboard**
   - Off-market trends by area
   - Average motivation scores
   - Price reduction statistics
   - Best neighborhoods for off-market deals

4. **Property Watch**
   - Watch specific properties for changes
   - Get notified if price drops
   - Get notified if goes back on market

5. **Integration with Other Tools**
   - Export to CRM systems
   - Connect with deal analysis tools
   - Zapier integration for custom workflows

6. **Mobile App**
   - Native iOS/Android apps
   - Push notifications for alerts
   - Quick property review on mobile

---

## Pricing Strategy (Future SaaS)

**Starter: $49/month**
- 3 active watchlists
- 100 properties tracked
- Email alerts
- Basic support

**Professional: $99/month**
- 10 active watchlists
- 500 properties tracked
- Email + SMS alerts
- Priority support
- Export features

**Enterprise: $199/month**
- Unlimited watchlists
- Unlimited properties
- All alert types
- API access
- Dedicated support
- Custom integrations

---

## Launch Checklist

**Pre-Launch:**
- [ ] All Phase 1-10 features complete and tested
- [ ] Database backups configured
- [ ] Monitoring and error tracking set up (Sentry)
- [ ] Analytics installed (PostHog or similar)
- [ ] Terms of Service and Privacy Policy pages
- [ ] Help documentation created
- [ ] Demo video recorded
- [ ] Landing page created

**Launch Day:**
- [ ] Deploy to production
- [ ] Enable cron jobs
- [ ] Send launch announcement
- [ ] Monitor for errors
- [ ] Respond to user feedback

**Post-Launch:**
- [ ] Daily monitoring of system health
- [ ] Weekly user feedback review
- [ ] Monthly feature updates
- [ ] Continuous performance optimization

---

## Technical Debt to Avoid

1. **Always use TypeScript types** - No `any` types
2. **Write tests for critical paths** - Especially scraping and scoring
3. **Document complex algorithms** - Motivation scoring, status detection
4. **Use proper error handling** - Never let errors crash the app
5. **Optimize database queries early** - Add indexes from the start
6. **Keep components small** - Max 200 lines per component
7. **Use consistent naming** - Follow Next.js conventions

---

## Deployment Strategy

**Development:**
- Feature branches off `main`
- Pull requests for all changes
- Code review before merge

**Staging:**
- Auto-deploy from `develop` branch
- Test all features before production
- Run cron jobs manually to test

**Production:**
- Deploy from `main` branch only
- Use Vercel preview deployments for testing
- Enable analytics and monitoring
- Monitor error rates post-deployment

---

## Conclusion

OffMarket Hunter is a focused, high-value tool for wholesale real estate investors. By concentrating solely on off-market properties and distressed sellers, it fills a specific niche that WholesaleOS doesn't address. The motivation scoring algorithm provides clear, actionable intelligence about which sellers are most likely to accept offers below market value.

The development plan spans approximately 6 weeks for MVP (Phases 1-10), with additional weeks for polish and advanced features. The phased approach allows for iterative development and testing, ensuring each component works before moving to the next.

This is a production-ready plan that can be executed immediately with the tech stack already in use for WholesaleOS Elite.
