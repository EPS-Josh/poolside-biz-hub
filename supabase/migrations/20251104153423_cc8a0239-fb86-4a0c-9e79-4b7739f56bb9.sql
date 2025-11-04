-- Drop the functional indexes that won't be used
DROP INDEX IF EXISTS idx_pima_mail1_pattern;
DROP INDEX IF EXISTS idx_pima_updated_owner_name_pattern;

-- Create simple btree indexes with text_pattern_ops for ILIKE prefix searches
-- These will be used by ILIKE 'text%' queries
CREATE INDEX IF NOT EXISTS idx_pima_mail1_prefix ON pima_assessor_records ("Mail1" text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_pima_updated_owner_name_prefix ON pima_assessor_records (updated_owner_name text_pattern_ops);