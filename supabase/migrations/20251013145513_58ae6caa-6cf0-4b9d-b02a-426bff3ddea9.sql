-- Enable pg_trgm extension for efficient text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN indexes for efficient ILIKE queries on pima_assessor_records
CREATE INDEX IF NOT EXISTS idx_pima_assessor_mail1_trgm ON pima_assessor_records USING GIN ("Mail1" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_pima_assessor_mail2_trgm ON pima_assessor_records USING GIN ("Mail2" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_pima_assessor_mail3_trgm ON pima_assessor_records USING GIN ("Mail3" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_pima_assessor_updated_owner_trgm ON pima_assessor_records USING GIN (updated_owner_name gin_trgm_ops);

-- Add additional indexes for exact lookups and sorting
CREATE INDEX IF NOT EXISTS idx_pima_assessor_parcel ON pima_assessor_records ("Parcel");
CREATE INDEX IF NOT EXISTS idx_pima_assessor_zip ON pima_assessor_records ("Zip");