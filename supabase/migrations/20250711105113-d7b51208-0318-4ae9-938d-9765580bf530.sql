-- Fix RLS policy performance issue on calendar_integrations table
-- Replace auth.uid() with (select auth.uid()) to avoid re-evaluation for each row

ALTER POLICY "Users can view their own calendar integrations" 
ON public.calendar_integrations 
USING ((select auth.uid()) = user_id);

ALTER POLICY "Users can manage their own calendar integrations" 
ON public.calendar_integrations 
USING ((select auth.uid()) = user_id);