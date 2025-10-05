-- Fix 1: Remove public access from pima_assessor_records
-- Drop the old policy that allows unauthenticated access
DROP POLICY IF EXISTS "Manage assessor records" ON public.pima_assessor_records;

-- Recreate the policy without the (auth.uid() IS NULL) clause
CREATE POLICY "Manage assessor records"
ON public.pima_assessor_records
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Fix 2: Drop the publicly accessible customer_service_view
DROP VIEW IF EXISTS public.customer_service_view;

-- Fix 3: Fix the customer_user_id hijacking vulnerability
-- Drop the buggy policy
DROP POLICY IF EXISTS "Customers can update own contact info" ON public.customers;

-- Recreate with proper security checks
CREATE POLICY "Customers can update own contact info"
ON public.customers
FOR UPDATE
USING (customer_user_id = auth.uid())
WITH CHECK (
  customer_user_id = auth.uid() 
  AND customer_user_id = (
    SELECT customer_user_id 
    FROM public.customers 
    WHERE id = customers.id
  )
  AND owner_verified_at IS NOT DISTINCT FROM (
    SELECT owner_verified_at 
    FROM public.customers 
    WHERE id = customers.id
  )
  AND owner_verified_by IS NOT DISTINCT FROM (
    SELECT owner_verified_by 
    FROM public.customers 
    WHERE id = customers.id
  )
);