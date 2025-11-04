-- Enable the pg_trgm extension for trigram indexes (better for ILIKE '%text%' queries)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop the previous pattern indexes since they don't help with '%text%' queries
DROP INDEX IF EXISTS idx_pima_assessor_mail1_pattern;
DROP INDEX IF EXISTS idx_pima_assessor_updated_owner_pattern;

-- Create trigram indexes for fuzzy/contains searches on Mail1 and updated_owner_name
-- These indexes specifically support ILIKE '%text%' queries
CREATE INDEX IF NOT EXISTS idx_pima_assessor_mail1_trgm 
ON pima_assessor_records USING gin ("Mail1" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_pima_assessor_updated_owner_trgm 
ON pima_assessor_records USING gin (updated_owner_name gin_trgm_ops);