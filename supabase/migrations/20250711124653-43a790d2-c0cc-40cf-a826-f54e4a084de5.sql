-- Fix RLS policy performance issue on service_requests table
-- Replace auth.uid() with (select auth.uid()) to avoid re-evaluation for each row

ALTER POLICY "Authenticated users can view all service requests" 
ON public.service_requests 
USING ((select auth.uid()) IS NOT NULL);

ALTER POLICY "Authenticated users can update service requests" 
ON public.service_requests 
USING ((select auth.uid()) IS NOT NULL);