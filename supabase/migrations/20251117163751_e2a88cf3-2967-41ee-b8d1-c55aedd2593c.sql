-- Add weekly_rate column to customer_service_details table
ALTER TABLE public.customer_service_details 
ADD COLUMN weekly_rate NUMERIC(10, 2) NULL;

-- Add comment to explain the field
COMMENT ON COLUMN public.customer_service_details.weekly_rate IS 'Weekly service rate charged to customer in dollars';
