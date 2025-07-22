-- Fix RLS policy performance issue on inventory_items table
-- Replace auth.uid() with (select auth.uid()) to avoid re-evaluation for each row

ALTER POLICY "Authenticated users can view all inventory items" 
ON public.inventory_items 
USING ((select auth.uid()) IS NOT NULL);

ALTER POLICY "Authenticated users can create inventory items" 
ON public.inventory_items 
WITH CHECK ((select auth.uid()) IS NOT NULL);

ALTER POLICY "Authenticated users can update all inventory items" 
ON public.inventory_items 
USING ((select auth.uid()) IS NOT NULL);

ALTER POLICY "Authenticated users can delete all inventory items" 
ON public.inventory_items 
USING ((select auth.uid()) IS NOT NULL);