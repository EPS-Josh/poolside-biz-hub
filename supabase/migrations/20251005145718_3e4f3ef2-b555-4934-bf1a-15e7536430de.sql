-- Fix: Restrict company_data access to user's own records only
-- Drop the overly permissive policy that allows any admin/manager to view all company data
DROP POLICY IF EXISTS "Admins and managers can manage company data" ON public.company_data;

-- Create new policies that ensure users can only access their OWN company data
CREATE POLICY "Users can view their own company data"
ON public.company_data
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own company data"
ON public.company_data
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own company data"
ON public.company_data
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own company data"
ON public.company_data
FOR DELETE
USING (user_id = auth.uid());