-- Fix RLS policy performance issue on parts_diagrams table
-- Replace auth.uid() with (select auth.uid()) to avoid re-evaluation for each row

ALTER POLICY "Authenticated users can view all parts diagrams" 
ON public.parts_diagrams 
USING ((select auth.uid()) IS NOT NULL);

ALTER POLICY "Authenticated users can create parts diagrams" 
ON public.parts_diagrams 
WITH CHECK (((select auth.uid()) IS NOT NULL) AND ((select auth.uid()) = user_id));

ALTER POLICY "Authenticated users can update all parts diagrams" 
ON public.parts_diagrams 
USING ((select auth.uid()) IS NOT NULL);

ALTER POLICY "Authenticated users can delete all parts diagrams" 
ON public.parts_diagrams 
USING ((select auth.uid()) IS NOT NULL);