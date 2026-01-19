-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert profile history" ON public.customer_profile_history;

-- Create a more restrictive INSERT policy
-- This allows staff (admins/managers) to insert history records for customers they manage
-- The trigger will still work because it runs as SECURITY DEFINER
CREATE POLICY "Staff can insert profile history" 
ON public.customer_profile_history 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (
    -- Admins and managers can insert for any customer
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR
    -- Customers can have their own changes logged (via trigger)
    changed_by = auth.uid()
  )
);