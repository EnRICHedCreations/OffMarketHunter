# OffMarket Hunter - Development Progress Tracker

## ✅ Completed

### Phase 1: Foundation (Complete)
- [x] Initialize Next.js 14 project with TypeScript
- [x] Configure Tailwind CSS v3
- [x] Set up project structure (App Router)
- [x] Create basic layout and home page
- [x] Install dependencies:
  - next-auth@beta
  - bcryptjs + @types/bcryptjs
  - @vercel/postgres
  - zod
  - react-hook-form
  - @hookform/resolvers
- [x] Create environment variables template (.env.example)
- [x] Design and create complete database schema (schema.sql)
  - users table
  - user_preferences table
  - watchlists table
  - properties table
  - property_history table
  - alerts table
  - All indexes for performance
- [x] Set up .gitignore
- [x] Create landing page with login/signup links
- [x] Fix Tailwind CSS build error (downgraded from v4 to v3)
- [x] Implement NextAuth v5 configuration
  - [x] Create `auth.ts` with NextAuth setup
  - [x] Create `auth.config.ts` with Credentials provider
  - [x] Set up middleware for protected routes
  - [x] Create NextAuth type definitions
- [x] Build authentication pages
  - [x] Create signup page (`app/(auth)/signup/page.tsx`) with form validation
  - [x] Create login page (`app/(auth)/login/page.tsx`) with Suspense boundary
  - [x] Create API route for signup (`app/api/auth/signup/route.ts`)
  - [x] Create NextAuth API handler (`app/api/auth/[...nextauth]/route.ts`)
- [x] Create protected dashboard layout
  - [x] Build sidebar navigation component (`components/Sidebar.tsx`)
  - [x] Create header with user menu (`components/Header.tsx`)
  - [x] Add logout functionality
  - [x] Create dashboard layout with auth protection
- [x] Build basic dashboard page
  - [x] Empty state UI for no watchlists
  - [x] Stats cards (watchlists, properties, high motivation, alerts)
  - [x] "Create Your First Watchlist" button
  - [x] Database queries for dashboard stats

### Phase 2: Watchlist Management (Complete)
- [x] Set up Vercel Postgres database
  - [x] Create database on Vercel
  - [x] Copy connection strings to `.env`
  - [x] Execute schema.sql
  - [x] Verify tables and indexes created
- [x] Create watchlists page UI (`app/watchlists/page.tsx`)
  - [x] List view with cards
  - [x] Empty state for no watchlists
  - [x] Property count display per watchlist
- [x] Build "Add Watchlist" form component (`app/watchlists/new/page.tsx`)
  - [x] Location input
  - [x] Price range filters (min/max)
  - [x] Property criteria inputs (beds, baths, sqft, lot size, year built)
  - [x] Property type selection (single family, multi family, condo, townhouse, land)
  - [x] Monitoring options checkboxes (off-market, price reductions, expired)
  - [x] Alert threshold slider
  - [x] Form validation with Zod
- [x] Implement watchlist CRUD API endpoints
  - [x] `GET /api/watchlists` - List user's watchlists with property counts
  - [x] `POST /api/watchlists` - Create watchlist
  - [x] `GET /api/watchlists/by-id?id=X` - Get single watchlist (query param workaround)
  - [x] `PUT /api/watchlists/by-id?id=X` - Update watchlist (query param workaround)
  - [x] `DELETE /api/watchlists/by-id?id=X` - Delete watchlist (query param workaround)
- [x] Add watchlist list view with cards (`components/WatchlistCard.tsx`)
  - [x] Display location, price range, bed range
  - [x] Show monitoring options as badges
  - [x] Property count display
- [x] Create edit watchlist functionality (`app/watchlists/[id]/edit/page.tsx`)
  - [x] Pre-populate form with existing data
  - [x] Same editing capabilities as create
- [x] Add delete confirmation dialog
  - [x] Modal with warning about cascading deletes
  - [x] Prevent accidental deletions
- [x] Implement active/inactive toggle
  - [x] Toggle button on watchlist cards
  - [x] Visual indication of inactive watchlists
- [x] Add user ownership verification on all API routes
- [x] Fix Next.js 16 async params compatibility

### Phase 3: Python Integration (Complete)
- [x] Install HomeHarvest Elite from Git (`git+https://github.com/...`)
- [x] Create Python serverless function (`api/scrape.py`)
  - [x] Vercel Python runtime integration
  - [x] Implement off-market scraping with filters
  - [x] Implement active property scraping for status changes
  - [x] Add NaN handling with `clean_value()` function
  - [x] JSON request/response handling
  - [x] Error logging with traceback
  - [x] Support both `off_market` and `for_sale` listing types
- [x] Frontend integration
  - [x] Direct API calls from WatchlistCard to `/api/scrape`
  - [x] Bypassed problematic Next.js dynamic routes
  - [x] Loading state during scraping
  - [x] Success/error message display
  - [x] Dual scan: both off-market AND active listings
- [x] Add "Scan Now" button to watchlist cards
- [x] Fix Python command detection (Windows: `py`, Unix: `python3`)
- [x] Vercel deployment configuration
  - [x] Auto-install HomeHarvest Elite from Git
  - [x] Python dependencies in api/requirements.txt
- [x] Fix watchlist layout to include dashboard sidebar
- [x] Test scraping with real Realtor.com data ✅ Working!

**Key Lessons Learned:**
- Vercel Python functions work best with direct imports, not child processes
- Install packages from Git in requirements.txt instead of bundling
- Use `math.isnan()` to handle NaN values before JSON serialization
- Frontend can call Python APIs directly, no need for Next.js wrapper routes
- Scanning both off-market and for-sale listings provides complete market picture

### Phase 4: Property Storage & Display (Complete)
- [x] Create property storage API endpoint (`/api/properties/store`)
  - [x] Accept scraped properties from frontend
  - [x] Save to database with user_id and watchlist_id
  - [x] Handle duplicates (UPDATE if exists, INSERT if new)
  - [x] Store raw_data as JSONB
  - [x] Return storage statistics (new/updated counts)
- [x] Update WatchlistCard to save scraped properties
  - [x] Call storage API after successful scrape
  - [x] Display save statistics in success message
- [x] Build property card component (`components/PropertyCard.tsx`)
  - [x] Property photo with fallback
  - [x] Address and basic info (beds, baths, sqft, price)
  - [x] Motivation score badge (placeholder for now)
  - [x] "View Details" button
  - [x] Days on market indicator
- [x] Create property list page (`app/properties/page.tsx`)
  - [x] Fetch properties from database via API
  - [x] Display in grid layout with client-side state management
  - [x] Empty state for no properties
  - [x] Property count display
  - [x] Loading states
- [x] Add property filtering UI
  - [x] Filter by watchlist dropdown
  - [x] Filter by status (off-market, for-sale, pending, etc.)
  - [x] Price range inputs (min/max)
  - [x] Beds/baths min selectors
  - [x] Reset filters functionality
- [x] Add property sorting
  - [x] Sort by date added (newest first)
  - [x] Sort by price (high/low)
  - [x] Sort by motivation score (placeholder for Phase 6)
  - [x] Sort order toggle (ASC/DESC)
- [x] Implement property detail page (`app/properties/[id]/page.tsx`)
  - [x] Full property information with all fields
  - [x] Photo gallery (displays up to 6 photos)
  - [x] Agent contact info with click-to-call/email
  - [x] Property history timeline (placeholder for Phase 5)
  - [x] Map integration (Google Maps link)
  - [x] Additional details (MLS ID, last sold info, etc.)
  - [x] User ownership verification

### Phase 5: Historical Tracking (Complete)
- [x] Implement property_history table logic
- [x] Create status change detection
  - [x] Compare current vs stored status
  - [x] Create history entry on change
- [x] Create price reduction detection
  - [x] Track price changes
  - [x] Calculate reduction amounts and percentages
  - [x] Increment reduction count
  - [x] Update total_price_reduction_amount and percent
- [x] Build property timeline component (PropertyTimeline.tsx)
  - [x] Visual timeline UI with color-coded icons
  - [x] Price changes with dates and amounts
  - [x] Status changes with dates
  - [x] Loading and empty states
- [x] Display timeline on property detail page
- [x] Create GET /api/properties/history?id=X endpoint (query param workaround)

### Phase 6: Motivation Scoring (Complete)
- [x] Implement motivation scoring algorithm
  - [x] 25% Days on Market component
  - [x] 30% Price Reductions component
  - [x] 20% Off-Market Duration component
  - [x] 15% Status Changes component
  - [x] 10% Market Conditions component
- [x] Create `/api/score_motivation.py` Python endpoint
- [x] Create `/api/properties/score` TypeScript endpoint for manual scoring
- [x] Calculate scores for all properties via "Score" button
- [x] Store score components in database
- [x] Create motivation score badge component (PropertyCard.tsx)
- [x] Build score breakdown visualization (MotivationScoreBreakdown.tsx)
  - [x] Gauge chart for total score
  - [x] Bar charts for components
  - [x] Explanation text
- [x] Sort properties by motivation score
- [x] Display scores on property cards and detail pages
- [x] Fix Vercel 401 auth issue (removed auto-scoring, added manual scoring)
- [x] Fix toFixed() TypeError on null values
- [x] Handle DECIMAL string conversion from Postgres

**Key Lessons Learned:**
- Vercel deployment protection blocks internal HTTP calls between API routes
- Vercel Postgres returns DECIMAL columns as strings, not numbers - use parseFloat()
- Manual scoring via button click works better than auto-scoring during property save
- TypeScript implementation of scoring algorithm avoids Python HTTP call issues

### Phase 7: Cron Jobs (Complete)
- [x] Create `/api/cron/hourly-status-check` endpoint
  - [x] Get all active watchlists (up to 10 per run)
  - [x] Scrape for-sale listings for updates
  - [x] Detect status changes (active → off-market)
  - [x] Detect price reductions
  - [x] Update database via store endpoint
  - [x] Property_history entries created automatically
  - [x] Update last_scraped_at timestamp
- [x] Create `/api/cron/daily-off-market-scan` endpoint
  - [x] Full off-market AND for-sale property scan
  - [x] Store new properties
  - [x] Update existing properties
  - [x] Auto-calculate motivation scores for all properties
  - [x] Process all active watchlists
- [x] Set up Vercel Cron jobs
  - [x] Hourly: `0 * * * *` for status checks
  - [x] Daily: `0 2 * * *` for off-market scan
  - [x] Created vercel.json configuration
- [x] Add cron authentication with CRON_SECRET
  - [x] Updated store endpoint for cron auth
  - [x] Updated score endpoint for cron auth
  - [x] Bearer token authentication
- [x] Test cron execution
  - [x] Created CRON_SETUP.md guide
  - [x] Local and production testing instructions
  - [x] Monitoring and troubleshooting guidelines

**Key Lessons Learned:**
- Vercel cron jobs require Bearer token authentication via CRON_SECRET
- Cron endpoints must support dual authentication (user session OR cron secret)
- Rate limiting important: process watchlists in batches to avoid timeouts
- maxDuration set to 300s (5 minutes) for long-running scrapes
- Oldest watchlists processed first (ORDER BY last_scraped_at ASC)

### Phase 8: Alert System (Complete)
- [x] Create alert generation logic
  - [x] Check motivation score vs threshold in store endpoint
  - [x] Create alert record automatically for high-motivation properties
  - [x] Prevent duplicate alerts with NOT EXISTS check
  - [x] Only alert on recently added properties (last hour)
- [x] Build alerts page UI (`app/alerts/page.tsx`)
  - [x] List view with property details, photos, and motivation scores
  - [x] Unread highlighting with visual indicators
  - [x] Filter by type (All/Unread/High Motivation)
  - [x] Mark as read functionality
  - [x] Delete/dismiss alerts
  - [x] Mark all as read bulk action
  - [x] Empty states and loading indicators
  - [x] Relative time formatting
- [x] Implement alert API endpoints
  - [x] `GET /api/alerts` - Get user's alerts with filters
  - [x] `PUT /api/alerts/by-id?id=X` - Mark as read (query param workaround)
  - [x] `DELETE /api/alerts/by-id?id=X` - Dismiss alert (query param workaround)
  - [x] `PUT /api/alerts/read-all` - Mark all as read
- [x] Add alert badge to header
  - [x] Show unread count with red badge
  - [x] Auto-refresh every 60 seconds
  - [x] Link to alerts page
  - [x] Bell icon with notification badge
- [x] Fix TypeScript errors in query composition

**Key Lessons Learned:**
- SQL template literal composition requires separate complete queries, not dynamic interpolation
- Time-based filtering prevents alert spam on bulk property imports
- Polling every 60 seconds provides near real-time updates without excessive API calls
- Query parameter workaround pattern continues for consistency

### Phase 10: Polish & Testing (Complete)
- [x] Loading states verified on all pages
  - [x] Alerts page with spinner
  - [x] Properties page with loading state
  - [x] Login/Signup pages with loading buttons
  - [x] Watchlist pages with loading states
- [x] Error handling improved
  - [x] User-friendly error messages throughout
  - [x] API error responses with proper status codes
  - [x] Try-catch blocks in all async operations
- [x] Empty states verified
  - [x] No alerts empty state
  - [x] No properties empty state
  - [x] No watchlists empty state
  - [x] No property photos placeholder
- [x] Mobile responsiveness
  - [x] Added mobile hamburger menu
  - [x] Responsive grid layouts
  - [x] Touch-friendly buttons and inputs
  - [x] Mobile-optimized header
- [x] Bug fixes completed
  - [x] Fixed NextAuth v5 login/logout issues
  - [x] Fixed toFixed() errors on null values (PropertyCard, PropertyTimeline, MotivationScoreBreakdown)
  - [x] Added DECIMAL to number conversion in APIs
  - [x] Comprehensive number validation added
- [x] Security verified
  - [x] All SQL queries use parameterized statements (prevents SQL injection)
  - [x] User authentication on all protected routes
  - [x] Authorization checks verify resource ownership
  - [x] CSRF protection via NextAuth

**Key Lessons Learned:**
- Postgres DECIMAL fields return as strings - must convert to numbers in API responses
- Multiple layers of validation prevent runtime errors (API + component level)
- NextAuth v5 requires server actions for sign in/out, not client-side functions
- Mobile menu needs fixed positioning to avoid header conflicts

## 📋 Todo (Upcoming Phases)

### Phase 9: Email Notifications (Optional for MVP)
- [ ] Set up Resend API key
- [ ] Create email templates
  - [ ] New off-market property email
  - [ ] Price reduction email
  - [ ] High motivation score email
  - [ ] Daily digest email
- [ ] Implement email sending logic
  - [ ] Send on alert creation
  - [ ] Respect user preferences
  - [ ] Check quiet hours
- [ ] Add unsubscribe functionality
- [ ] Test email delivery

### Phase 10: Polish & Testing
- [ ] Add loading states to all async operations
- [ ] Implement error handling and user-friendly messages
- [ ] Add empty states for no data scenarios
- [ ] Mobile responsive testing and fixes
- [ ] Performance optimization
  - [ ] Database query optimization
  - [ ] Verify indexes are working
  - [ ] Image optimization
- [ ] Security audit
  - [ ] SQL injection prevention (using parameterized queries)
  - [ ] XSS protection
  - [ ] CSRF tokens
- [ ] User testing and feedback collection
- [ ] Bug fixes

### Phase 11: Settings & Preferences (Complete)
- [x] Create settings page layout (`app/settings/page.tsx`)
  - [x] Three main sections: Profile, Password, Preferences
  - [x] Success/error message banner
  - [x] Loading states throughout
- [x] Build profile section
  - [x] Name edit functionality
  - [x] Email display (read-only)
  - [x] Form validation
- [x] Build password change form
  - [x] Current password verification with bcrypt
  - [x] New password validation (min 6 characters)
  - [x] Confirm password matching
  - [x] Secure password hashing (bcrypt with 10 salt rounds)
- [x] Build notification preferences section
  - [x] Alert threshold slider (50-100)
  - [x] Real-time preference updates
  - [x] Visual feedback for changes
- [x] Implement user preferences API
  - [x] `GET /api/preferences` - Get user info and preferences
  - [x] `PUT /api/preferences` - Update name and/or alert threshold
  - [x] `PUT /api/preferences/password` - Secure password change
  - [x] User ownership verification on all routes
- [x] Apply preferences to alert logic
  - [x] Alert threshold synced to all user's watchlists
  - [x] Preferences stored in user_preferences table
  - [x] Automatic sync on threshold updates

**Key Lessons Learned:**
- bcrypt.compare() for password verification before allowing changes
- Alert threshold changes propagate to all watchlists for consistency
- User preferences table uses LEFT JOIN with COALESCE for default values
- Client-side validation + server-side validation for security
- Email alerts skipped (not in MVP scope)

### Phase 12: Advanced Features
- [ ] Property notes
  - [ ] Add note functionality
  - [ ] Display notes on property page
  - [ ] Edit/delete notes
- [ ] Interest tracking
  - [ ] "Mark as Interested" button
  - [ ] Interested properties page
  - [ ] Filter by interested
- [ ] Export functionality
  - [ ] Export properties to CSV
  - [ ] Export contacts to CSV
  - [ ] Include all property data
- [ ] Market statistics dashboard
  - [ ] Average motivation score by watchlist
  - [ ] Total off-market count
  - [ ] Trends over time (charts)
  - [ ] Price reduction statistics
- [ ] Property comparison tool
  - [ ] Select up to 3 properties
  - [ ] Side-by-side comparison
  - [ ] Motivation score comparison

## 🗂️ File Structure Created

```
offmarkethunter/
├── api/
│   ├── scrape.py (Python - scrapes off-market & for-sale listings)
│   ├── score_motivation.py (Python - scoring algorithm)
│   └── requirements.txt
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── actions/
│   │   └── auth.ts (server actions for NextAuth v5)
│   ├── alerts/
│   │   └── page.tsx (alerts page with filtering)
│   ├── api/
│   │   ├── alerts/
│   │   │   ├── by-id/route.ts (PUT, DELETE - query param workaround)
│   │   │   ├── read-all/route.ts (PUT - mark all as read)
│   │   │   └── route.ts (GET - list alerts with filters)
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts
│   │   │   └── signup/route.ts
│   │   ├── cron/
│   │   │   ├── hourly-status-check/route.ts (GET)
│   │   │   └── daily-off-market-scan/route.ts (GET)
│   │   ├── preferences/
│   │   │   ├── password/route.ts (PUT - password change)
│   │   │   └── route.ts (GET, PUT - user preferences)
│   │   ├── properties/
│   │   │   ├── history/route.ts (GET)
│   │   │   ├── route.ts (GET - list properties)
│   │   │   ├── score/route.ts (POST - manual scoring)
│   │   │   └── store/route.ts (POST - save scraped properties + alert generation)
│   │   └── watchlists/
│   │       ├── by-id/route.ts (GET, PUT, DELETE - query param workaround)
│   │       └── route.ts (GET, POST)
│   ├── settings/
│   │   └── page.tsx (user settings and preferences)
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── properties/
│   │   ├── [id]/page.tsx (property detail page)
│   │   └── page.tsx (property list page)
│   ├── watchlists/
│   │   ├── [id]/edit/page.tsx
│   │   ├── layout.tsx
│   │   ├── new/page.tsx
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx (landing page)
├── components/
│   ├── Header.tsx (with unread alert badge)
│   ├── MotivationScoreBreakdown.tsx
│   ├── PropertyCard.tsx
│   ├── PropertyTimeline.tsx
│   ├── Sidebar.tsx
│   └── WatchlistCard.tsx
├── lib/
│   └── db/schema.sql
├── .env.example
├── .gitignore
├── CRON_SETUP.md
├── vercel.json
├── auth.config.ts
├── auth.ts
├── developmentplan.md
├── DevelopmentToDo.md (this file)
├── middleware.ts
├── next-auth.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## 🚀 Next Immediate Steps - Phase 9: Email Notifications (Optional)

1. **Set up Email Provider**
   - Configure Resend API key
   - Set up verified sender domain
   - Test email delivery

2. **Create Email Templates**
   - New high-motivation property email
   - Price reduction notification email
   - Daily digest email with summary
   - HTML and plain text versions

3. **Implement Email Logic**
   - Send on alert creation based on user preferences
   - Respect quiet hours settings
   - Include property details and links
   - Unsubscribe functionality

4. **User Preferences**
   - Toggle email notifications on/off
   - Select alert types to receive
   - Set quiet hours time range
   - Configure digest frequency

## 📊 Overall Progress

**Phase 1 (Foundation):** 100% Complete ✅
**Phase 2 (Watchlists):** 100% Complete ✅
**Phase 3 (Python Integration):** 100% Complete ✅
**Phase 4 (Property Storage & Display):** 100% Complete ✅
**Phase 5 (Historical Tracking):** 100% Complete ✅
**Phase 6 (Motivation Scoring):** 100% Complete ✅
**Phase 7 (Cron Jobs):** 100% Complete ✅
**Phase 8 (Alert System):** 100% Complete ✅
**Phase 9 (Email Notifications):** 0% Complete (Skipped for MVP)
**Phase 10 (Polish & Testing):** 100% Complete ✅
**Phase 11 (Settings & Preferences):** 100% Complete ✅
**Phase 12 (Advanced Features):** 0% Complete
**Overall Project:** ~92% Complete (MVP+ Ready!)

## 🎯 Current Focus

Phase 11 is complete - MVP+ with user settings is ready! 🎉

**MVP+ Feature Set Complete:**
1. Properties are automatically saved to database after scraping
2. Dual scan: Both off-market AND active listings scraped in one click
3. Properties page displays all saved properties in a grid
4. Comprehensive filtering by watchlist, status, price, beds, baths
5. Sorting by date, price, and motivation score
6. Full property detail pages with photos, contact info, and map links
7. Automatic detection of status changes (e.g., active → off_market)
8. Automatic detection of price reductions with amounts and percentages
9. Visual timeline showing all property history events
10. Price reduction statistics tracked (count, total amount, percent)
11. Edit, delete, and toggle watchlist functionality working
12. **Motivation scoring (0-100 scale)** with 5 components:
    - Days on Market (25 points)
    - Price Reductions (30 points)
    - Off-Market Duration (20 points)
    - Status Changes (15 points)
    - Market Conditions (10 points)
13. Manual "Score" button on watchlist cards
14. Color-coded score badges on property cards
15. Detailed score breakdown visualization with gauges and progress bars
16. **Automated Cron Jobs:**
    - Hourly status checks (every hour)
    - Daily off-market scans (2 AM daily)
    - Auto-scoring after property updates
    - Automatic history tracking
17. Hands-free property monitoring
18. No more manual "Scan Now" clicks required
19. **Alert System:**
    - Automatic alert generation for high-motivation properties
    - Alerts page with filtering (all, unread, high motivation)
    - Mark as read and delete functionality
    - Unread badge in header with auto-refresh
    - Property details, photos, and scores in alerts
    - Bulk "mark all as read" action
20. **User Settings & Preferences:**
    - Comprehensive settings page with profile, password, and preferences
    - Name editing with real-time updates
    - Secure password change with bcrypt verification
    - Alert threshold slider (50-100 range)
    - Preferences synced across all watchlists
    - User-level defaults with LEFT JOIN pattern

**🚀 MVP+ Ready for Launch!**

The core application is fully functional with all essential features:
- User authentication & authorization
- Watchlist management with custom criteria
- Automated property scraping (off-market & active listings)
- Property storage, display, and detail pages
- Historical tracking (price changes, status changes)
- Motivation scoring algorithm
- Automated cron jobs for hands-free monitoring
- Alert system with notifications
- User settings & preferences management
- Mobile-responsive design
- Polished UI with loading states and error handling

**Optional Future Enhancements (Phases 9, 12):**
- Email notifications
- Advanced features (notes, export, statistics)

## 🔗 Dependencies Between Phases

- Phase 2 (Watchlists) depends on Phase 1 (Auth) being complete ✅
- Phase 3 (Python) can start independently ✅
- Phase 4 (Properties) depends on Phases 2 & 3 ✅
- Phase 5 (History) depends on Phase 4 ✅
- Phase 6 (Scoring) depends on Phase 4 ✅
- Phase 7 (Cron) depends on Phases 3, 4, 5, 6 ✅
- Phase 8 (Alerts) depends on Phase 6 ✅
- Phase 9 (Email) depends on Phase 8 (optional)
- Phases 10-12 can happen in parallel after Phase 8 ✅

## 📝 Notes

- Using Next.js 15.1.3 (downgraded from 16.0.3 for Vercel compatibility)
- Using NextAuth v5 (beta)
- Using Tailwind CSS v3.4.1 (not v4 due to PostCSS compatibility)
- Database schema supports all features from development plan
- Following WholesaleOS Elite patterns for consistency
- **API Route Workaround:** Using query parameters (`/api/resource/by-id?id=X`) instead of dynamic routes (`/api/resource/[id]`) due to Vercel deployment issues with bracket notation in Next.js 15/16
