-- Fix security issue: Restrict pima_assessor_records access to authenticated users only
-- Remove the policy that allows public access (with 'OR true' condition)

DROP POLICY IF EXISTS "View assessor records" ON public.pima_assessor_records;

-- Create new policy that requires authentication
CREATE POLICY "Authenticated users can view assessor records"
ON public.pima_assessor_records
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Keep the existing management policy unchanged for admins/managers
-- (The "Manage assessor records" policy already exists and is secure)