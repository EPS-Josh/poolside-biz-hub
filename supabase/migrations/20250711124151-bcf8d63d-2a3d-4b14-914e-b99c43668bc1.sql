-- Fix RLS policy performance issue on calendar_sync_log table
-- Replace auth.uid() with (select auth.uid()) to avoid re-evaluation for each row

ALTER POLICY "Users can view their own sync logs" 
ON public.calendar_sync_log 
USING ((select auth.uid()) = user_id);

ALTER POLICY "Users can create their own sync logs" 
ON public.calendar_sync_log 
WITH CHECK ((select auth.uid()) = user_id);