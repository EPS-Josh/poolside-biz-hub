-- Add latitude and longitude columns to customers table for cached geocoding
ALTER TABLE customers 
ADD COLUMN latitude NUMERIC,
ADD COLUMN longitude NUMERIC,
ADD COLUMN geocoded_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster map queries
CREATE INDEX idx_customers_coordinates ON customers (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add index for customers needing geocoding
CREATE INDEX idx_customers_needs_geocoding ON customers (geocoded_at) WHERE geocoded_at IS NULL AND address IS NOT NULL;