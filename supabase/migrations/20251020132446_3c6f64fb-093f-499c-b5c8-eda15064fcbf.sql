-- Drop the existing inefficient policy
DROP POLICY IF EXISTS "Customers can create their own service requests" ON public.service_requests;

-- Recreate with optimized auth function call
CREATE POLICY "Customers can create their own service requests" 
ON public.service_requests 
FOR INSERT 
TO authenticated
WITH CHECK (
  email IN (
    SELECT customers.email
    FROM customers
    WHERE customers.customer_user_id = (SELECT auth.uid())
  )
);