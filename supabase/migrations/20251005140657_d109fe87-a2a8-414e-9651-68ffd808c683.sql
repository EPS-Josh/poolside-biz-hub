-- Step 1: Restrict pima_assessor_records to staff only
DROP POLICY IF EXISTS "Authenticated users can view assessor records" ON public.pima_assessor_records;

CREATE POLICY "Staff can view assessor records"
ON public.pima_assessor_records
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'technician'::app_role)
);

-- Step 2: Prevent customer_user_id hijacking
DROP POLICY IF EXISTS "Customers can update own contact info" ON public.customers;

CREATE POLICY "Customers can update own contact info"
ON public.customers
FOR UPDATE
TO authenticated
USING (customer_user_id = auth.uid())
WITH CHECK (
  customer_user_id = auth.uid() 
  -- Prevent changing customer_user_id (must match original value)
  AND customer_user_id = (SELECT customer_user_id FROM customers WHERE id = customers.id)
  -- Prevent changing verification fields (must match original values)
  AND owner_verified_at IS NOT DISTINCT FROM (SELECT owner_verified_at FROM customers WHERE id = customers.id)
  AND owner_verified_by IS NOT DISTINCT FROM (SELECT owner_verified_by FROM customers WHERE id = customers.id)
);