-- Add fields to customers table for non-Pima County tracking
ALTER TABLE public.customers 
ADD COLUMN pima_county_resident boolean DEFAULT true,
ADD COLUMN verification_status text DEFAULT 'pending',
ADD COLUMN non_pima_verification_method text,
ADD COLUMN non_pima_verification_notes text,
ADD COLUMN non_pima_verified_at timestamp with time zone,
ADD COLUMN non_pima_verified_by uuid;