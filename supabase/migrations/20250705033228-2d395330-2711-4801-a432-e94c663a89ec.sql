
-- Drop the existing restrictive policies for customers table
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can create their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;

-- Create new policies that allow all authenticated users full access to customers
CREATE POLICY "Authenticated users can view all customers" 
  ON public.customers 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create customers" 
  ON public.customers 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update all customers" 
  ON public.customers 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete all customers" 
  ON public.customers 
  FOR DELETE 
  TO authenticated
  USING (true);

-- Also update related tables to allow authenticated users full access

-- Customer service details
DROP POLICY IF EXISTS "Users can view their own customer service details" ON public.customer_service_details;
DROP POLICY IF EXISTS "Users can create their own customer service details" ON public.customer_service_details;
DROP POLICY IF EXISTS "Users can update their own customer service details" ON public.customer_service_details;
DROP POLICY IF EXISTS "Users can delete their own customer service details" ON public.customer_service_details;
DROP POLICY IF EXISTS "Users can view service details for their customers" ON public.customer_service_details;
DROP POLICY IF EXISTS "Users can create service details for their customers" ON public.customer_service_details;
DROP POLICY IF EXISTS "Users can update service details for their customers" ON public.customer_service_details;
DROP POLICY IF EXISTS "Users can delete service details for their customers" ON public.customer_service_details;

CREATE POLICY "Authenticated users can view all customer service details" 
  ON public.customer_service_details 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create customer service details" 
  ON public.customer_service_details 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update all customer service details" 
  ON public.customer_service_details 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete all customer service details" 
  ON public.customer_service_details 
  FOR DELETE 
  TO authenticated
  USING (true);

-- Customer photos
DROP POLICY IF EXISTS "Users can view their own customer photos" ON public.customer_photos;
DROP POLICY IF EXISTS "Users can create their own customer photos" ON public.customer_photos;
DROP POLICY IF EXISTS "Users can update their own customer photos" ON public.customer_photos;
DROP POLICY IF EXISTS "Users can delete their own customer photos" ON public.customer_photos;
DROP POLICY IF EXISTS "Users can view photos for their customers" ON public.customer_photos;
DROP POLICY IF EXISTS "Users can create photos for their customers" ON public.customer_photos;
DROP POLICY IF EXISTS "Users can update photos for their customers" ON public.customer_photos;
DROP POLICY IF EXISTS "Users can delete photos for their customers" ON public.customer_photos;

CREATE POLICY "Authenticated users can view all customer photos" 
  ON public.customer_photos 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create customer photos" 
  ON public.customer_photos 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update all customer photos" 
  ON public.customer_photos 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete all customer photos" 
  ON public.customer_photos 
  FOR DELETE 
  TO authenticated
  USING (true);
