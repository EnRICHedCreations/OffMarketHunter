-- OffMarket Hunter Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_threshold INTEGER DEFAULT 80,
    email_alerts BOOLEAN DEFAULT true,
    quiet_hours_start INTEGER,
    quiet_hours_end INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Watchlists table
CREATE TABLE IF NOT EXISTS watchlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,

    -- Property criteria
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
    property_types JSONB,
    tags JSONB,

    -- Monitoring settings
    track_off_market BOOLEAN DEFAULT true,
    track_price_reductions BOOLEAN DEFAULT true,
    track_expired BOOLEAN DEFAULT true,
    alert_threshold INTEGER DEFAULT 80,

    is_active BOOLEAN DEFAULT true,
    last_scraped_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    property_id VARCHAR(255) UNIQUE NOT NULL,
    watchlist_id INTEGER NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,

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
    lot_sqft BIGINT,
    year_built INTEGER,
    property_type VARCHAR(50),

    -- Current status
    current_status VARCHAR(50),
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
    total_price_reduction_percent DECIMAL(6, 2),
    last_price_reduction_date TIMESTAMP,

    -- Motivation score
    motivation_score DECIMAL(6, 2),
    motivation_score_dom DECIMAL(6, 2),
    motivation_score_reductions DECIMAL(6, 2),
    motivation_score_off_market DECIMAL(6, 2),
    motivation_score_status DECIMAL(6, 2),
    motivation_score_market DECIMAL(6, 2),

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

-- Property history table
CREATE TABLE IF NOT EXISTS property_history (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    event_type VARCHAR(50) NOT NULL,
    event_date TIMESTAMP NOT NULL,

    -- Status changes
    old_status VARCHAR(50),
    new_status VARCHAR(50),

    -- Price changes
    old_price DECIMAL(12, 2),
    new_price DECIMAL(12, 2),
    price_change_amount DECIMAL(12, 2),
    price_change_percent DECIMAL(6, 2),

    -- Context
    days_since_last_event INTEGER,
    notes TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    watchlist_id INTEGER NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,

    alert_type VARCHAR(50) NOT NULL,
    alert_reason TEXT,
    motivation_score DECIMAL(6, 2),

    sent_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP,
    dismissed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Property notes table
CREATE TABLE IF NOT EXISTS property_notes (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Property interest tracking table
CREATE TABLE IF NOT EXISTS property_interest (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interest_level VARCHAR(50) DEFAULT 'interested',
    notes TEXT,
    marked_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(property_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_motivation ON properties(motivation_score DESC);
CREATE INDEX IF NOT EXISTS idx_properties_watchlist ON properties(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(current_status);
CREATE INDEX IF NOT EXISTS idx_properties_property_id ON properties(property_id);

CREATE INDEX IF NOT EXISTS idx_history_property ON property_history(property_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_history_type ON property_history(event_type);

CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON alerts(user_id) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_active ON watchlists(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_notes_property ON property_notes(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user ON property_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_interest_property ON property_interest(property_id);
CREATE INDEX IF NOT EXISTS idx_interest_user ON property_interest(user_id, marked_at DESC);
