
-- Add columns to preserve previous owner's email and phone
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS previous_email text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS previous_phone text;
