-- Add fields to customers table to track ownership changes
ALTER TABLE public.customers 
ADD COLUMN previous_first_name text,
ADD COLUMN previous_last_name text,
ADD COLUMN owner_changed_date timestamp with time zone,
ADD COLUMN owner_changed_by uuid REFERENCES auth.users(id);

-- Create index for performance on owner change queries
CREATE INDEX idx_customers_owner_changed ON public.customers(owner_changed_date) WHERE owner_changed_date IS NOT NULL;