-- Drop the trigram indexes as they're not optimal for prefix searches
DROP INDEX IF EXISTS idx_pima_mail1_trgm;
DROP INDEX IF EXISTS idx_pima_updated_owner_name_trgm;

-- Create btree indexes optimized for ILIKE prefix searches
CREATE INDEX IF NOT EXISTS idx_pima_mail1_pattern ON pima_assessor_records (UPPER("Mail1") text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_pima_updated_owner_name_pattern ON pima_assessor_records (UPPER(updated_owner_name) text_pattern_ops);