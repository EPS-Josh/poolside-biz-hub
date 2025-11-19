-- Add service_description column to customer_service_details table
ALTER TABLE customer_service_details
ADD COLUMN IF NOT EXISTS service_description TEXT;