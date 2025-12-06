-- Add potential customer notes field
ALTER TABLE public.customer_service_details
ADD COLUMN potential_customer_notes text;