-- Add owner verification fields to customers table
ALTER TABLE public.customers 
ADD COLUMN owner_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN owner_verified_by UUID DEFAULT NULL;