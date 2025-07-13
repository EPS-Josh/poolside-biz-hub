-- Drop existing RLS policies for inventory_items
DROP POLICY IF EXISTS "Users can view their own inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can create their own inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can update their own inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can delete their own inventory items" ON public.inventory_items;

-- Create new RLS policies that allow all authenticated users to access all inventory items
CREATE POLICY "Authenticated users can view all inventory items" 
ON public.inventory_items 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create inventory items" 
ON public.inventory_items 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all inventory items" 
ON public.inventory_items 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all inventory items" 
ON public.inventory_items 
FOR DELETE 
USING (auth.uid() IS NOT NULL);