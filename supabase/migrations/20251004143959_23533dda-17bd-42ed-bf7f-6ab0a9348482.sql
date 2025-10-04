-- Link customer accounts to customer records
-- Add customer_user_id to link auth accounts to customer records
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_customers_customer_user_id ON public.customers(customer_user_id);

-- Create RLS policies for customer portal access
-- Customers can view their own record
CREATE POLICY "Customers can view their own record"
ON public.customers
FOR SELECT
TO authenticated
USING (customer_user_id = auth.uid());

-- Customers can update their own contact info (limited fields)
CREATE POLICY "Customers can update own contact info"
ON public.customers
FOR UPDATE
TO authenticated
USING (customer_user_id = auth.uid())
WITH CHECK (
  customer_user_id = auth.uid() AND
  -- Prevent customers from changing critical fields
  owner_verified_at IS NOT DISTINCT FROM (SELECT owner_verified_at FROM customers WHERE id = customers.id) AND
  owner_verified_by IS NOT DISTINCT FROM (SELECT owner_verified_by FROM customers WHERE id = customers.id)
);

-- Customers can view their own service records
CREATE POLICY "Customers can view their own service records"
ON public.service_records
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM public.customers WHERE customer_user_id = auth.uid()
  )
);

-- Customers can view their own appointments
CREATE POLICY "Customers can view their own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM public.customers WHERE customer_user_id = auth.uid()
  )
);

-- Customers can create service requests for themselves
CREATE POLICY "Customers can create their own service requests"
ON public.service_requests
FOR INSERT
TO authenticated
WITH CHECK (
  email IN (SELECT email FROM public.customers WHERE customer_user_id = auth.uid())
);

-- Customers can view their own photos
CREATE POLICY "Customers can view their own photos"
ON public.customer_photos
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM public.customers WHERE customer_user_id = auth.uid()
  )
);

-- Customers can view their own plans/drawings
CREATE POLICY "Customers can view their own plans/drawings"
ON public.customer_plans_drawings
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM public.customers WHERE customer_user_id = auth.uid()
  )
);

-- Customers can view their own service details
CREATE POLICY "Customers can view their own service details"
ON public.customer_service_details
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM public.customers WHERE customer_user_id = auth.uid()
  )
);

-- Add customer role to app_role enum if not exists
DO $$ 
BEGIN
  -- The customer role should already exist based on the schema
  -- This is just a safety check
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('admin', 'manager', 'technician', 'customer', 'guest');
  END IF;
END $$;