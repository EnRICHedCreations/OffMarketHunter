-- Phase 12: Advanced Features - Database Migration

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
CREATE INDEX IF NOT EXISTS idx_notes_property ON property_notes(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user ON property_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_interest_property ON property_interest(property_id);
CREATE INDEX IF NOT EXISTS idx_interest_user ON property_interest(user_id, marked_at DESC);
