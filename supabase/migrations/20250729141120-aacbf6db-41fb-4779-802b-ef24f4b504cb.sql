-- Update RLS policies for customers table to allow all authenticated users (except guests) to view and edit
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can create their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;

-- Create new policies for customers - all authenticated users can manage all customers except guests
CREATE POLICY "Authenticated users can view all customers" 
ON public.customers 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can create customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can update all customers" 
ON public.customers 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role))
WITH CHECK (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can delete all customers" 
ON public.customers 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

-- Update RLS policies for service_records table to allow all authenticated users (except guests) to view and edit
DROP POLICY IF EXISTS "Users can view their own service records" ON public.service_records;
DROP POLICY IF EXISTS "Users can create their own service records" ON public.service_records;
DROP POLICY IF EXISTS "Users can update their own service records" ON public.service_records;
DROP POLICY IF EXISTS "Users can delete their own service records" ON public.service_records;

-- Create new policies for service_records - all authenticated users can manage all service records except guests
CREATE POLICY "Authenticated users can view all service records" 
ON public.service_records 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can create service records" 
ON public.service_records 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can update all service records" 
ON public.service_records 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role))
WITH CHECK (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can delete all service records" 
ON public.service_records 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));