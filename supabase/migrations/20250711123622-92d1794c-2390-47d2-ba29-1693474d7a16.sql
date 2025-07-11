-- Remove redundant SELECT policy since ALL policy already covers SELECT operations
DROP POLICY IF EXISTS "Users can view their own calendar integrations" ON public.calendar_integrations;