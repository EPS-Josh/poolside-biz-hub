-- Add fields for tracking potential customers and acquisition source
ALTER TABLE public.customer_service_details 
ADD COLUMN IF NOT EXISTS is_potential_customer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS acquisition_source text,
ADD COLUMN IF NOT EXISTS proposed_rate numeric;