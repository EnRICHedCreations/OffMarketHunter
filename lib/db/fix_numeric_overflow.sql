-- Fix numeric field overflows

-- 1. Fix motivation score fields - change from DECIMAL(5,2) to DECIMAL(6,2)
-- This allows values up to 9999.99 instead of 999.99
ALTER TABLE properties
  ALTER COLUMN motivation_score TYPE DECIMAL(6, 2),
  ALTER COLUMN motivation_score_dom TYPE DECIMAL(6, 2),
  ALTER COLUMN motivation_score_reductions TYPE DECIMAL(6, 2),
  ALTER COLUMN motivation_score_off_market TYPE DECIMAL(6, 2),
  ALTER COLUMN motivation_score_status TYPE DECIMAL(6, 2),
  ALTER COLUMN motivation_score_market TYPE DECIMAL(6, 2);

-- 2. Fix percentage fields - change from DECIMAL(5,2) to DECIMAL(6,2)
ALTER TABLE properties
  ALTER COLUMN total_price_reduction_percent TYPE DECIMAL(6, 2);

ALTER TABLE property_history
  ALTER COLUMN price_change_percent TYPE DECIMAL(6, 2);

-- 3. Fix lot_sqft field - change from INTEGER to BIGINT
-- INTEGER max is ~2.1 billion, BIGINT max is ~9 quintillion
ALTER TABLE properties
  ALTER COLUMN lot_sqft TYPE BIGINT;

-- 4. Also update alerts table motivation_score for consistency
ALTER TABLE alerts
  ALTER COLUMN motivation_score TYPE DECIMAL(6, 2);
