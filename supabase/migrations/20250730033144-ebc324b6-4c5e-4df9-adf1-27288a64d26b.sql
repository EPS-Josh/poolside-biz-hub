-- Update RLS policies for customer_service_details table to allow all authenticated users (except guests) to view and edit
DROP POLICY IF EXISTS "Users can view service details for their own customers" ON public.customer_service_details;
DROP POLICY IF EXISTS "Users can create service details for their own customers" ON public.customer_service_details;
DROP POLICY IF EXISTS "Users can update service details for their own customers" ON public.customer_service_details;

-- Create new policies for customer_service_details - all authenticated users can manage all service details except guests
CREATE POLICY "Authenticated users can view all customer service details" 
ON public.customer_service_details 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can create customer service details" 
ON public.customer_service_details 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can update all customer service details" 
ON public.customer_service_details 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role))
WITH CHECK (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can delete all customer service details" 
ON public.customer_service_details 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));