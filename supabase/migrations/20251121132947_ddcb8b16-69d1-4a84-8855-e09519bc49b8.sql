-- Add SMS opt-in fields to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS sms_opt_in boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_opt_in_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;