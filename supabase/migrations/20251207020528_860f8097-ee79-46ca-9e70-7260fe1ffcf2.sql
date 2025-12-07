-- Add route_order column to customer_service_details for tracking stop order on each day's route
ALTER TABLE public.customer_service_details 
ADD COLUMN route_order integer;

-- Add a comment to document the field
COMMENT ON COLUMN public.customer_service_details.route_order IS 'Order/position of customer on their assigned service day route (1 = first stop, 2 = second, etc.)';