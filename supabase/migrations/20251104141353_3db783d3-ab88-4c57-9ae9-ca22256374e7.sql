-- Create indexes for faster last name searches on pima_assessor_records
-- These indexes support ILIKE queries which are case-insensitive

-- Index for Mail1 (owner name) - use text_pattern_ops for ILIKE queries
CREATE INDEX IF NOT EXISTS idx_pima_assessor_mail1_pattern 
ON pima_assessor_records USING btree ("Mail1" text_pattern_ops);

-- Index for updated_owner_name - use text_pattern_ops for ILIKE queries  
CREATE INDEX IF NOT EXISTS idx_pima_assessor_updated_owner_pattern 
ON pima_assessor_records USING btree (updated_owner_name text_pattern_ops);

-- Also create regular indexes for exact matches
CREATE INDEX IF NOT EXISTS idx_pima_assessor_mail1 
ON pima_assessor_records ("Mail1");

CREATE INDEX IF NOT EXISTS idx_pima_assessor_updated_owner 
ON pima_assessor_records (updated_owner_name);