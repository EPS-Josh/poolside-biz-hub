-- Fix RLS policy performance issue on manuals table
-- Replace auth.uid() with (select auth.uid()) to avoid re-evaluation for each row

ALTER POLICY "Authenticated users can view all manuals" 
ON public.manuals 
USING ((select auth.uid()) IS NOT NULL);

ALTER POLICY "Authenticated users can create manuals" 
ON public.manuals 
WITH CHECK (((select auth.uid()) IS NOT NULL) AND ((select auth.uid()) = user_id));

ALTER POLICY "Authenticated users can update all manuals" 
ON public.manuals 
USING ((select auth.uid()) IS NOT NULL);

ALTER POLICY "Authenticated users can delete all manuals" 
ON public.manuals 
USING ((select auth.uid()) IS NOT NULL);