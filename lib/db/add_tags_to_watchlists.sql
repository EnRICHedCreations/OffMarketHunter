-- Add tags search criteria to watchlists table
-- This allows users to filter properties by tags like 'fixer_upper', 'foreclosure', etc.

ALTER TABLE watchlists
  ADD COLUMN IF NOT EXISTS tags JSONB;

-- Add comment explaining the field
COMMENT ON COLUMN watchlists.tags IS 'Array of tags to filter properties (e.g., ["fixer_upper", "foreclosure", "short_sale"])';
