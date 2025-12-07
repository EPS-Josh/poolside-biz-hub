-- Add service_day column to customer_service_details for tracking assigned cleaning days
ALTER TABLE public.customer_service_details 
ADD COLUMN service_day text;

-- Add a comment to document the field
COMMENT ON COLUMN public.customer_service_details.service_day IS 'Day of the week assigned for cleaning service (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday)';