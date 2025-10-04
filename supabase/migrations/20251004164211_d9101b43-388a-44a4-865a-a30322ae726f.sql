-- Create security definer function to get customer verification fields without triggering RLS
CREATE OR REPLACE FUNCTION public.get_customer_verification_fields(customer_id uuid)
RETURNS TABLE (
  owner_verified_at timestamp with time zone,
  owner_verified_by uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT owner_verified_at, owner_verified_by
  FROM public.customers
  WHERE id = customer_id;
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Customers can update own contact info" ON public.customers;

-- Create a new policy without the recursive check
CREATE POLICY "Customers can update own contact info"
ON public.customers
FOR UPDATE
USING (customer_user_id = auth.uid())
WITH CHECK (
  customer_user_id = auth.uid() AND
  -- Prevent customers from modifying verification fields
  owner_verified_at IS NOT DISTINCT FROM (SELECT v.owner_verified_at FROM get_customer_verification_fields(id) v) AND
  owner_verified_by IS NOT DISTINCT FROM (SELECT v.owner_verified_by FROM get_customer_verification_fields(id) v)
);