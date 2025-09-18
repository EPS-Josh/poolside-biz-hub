-- Fix multiple permissive SELECT policies on inventory_items table
-- Consolidate "Manage inventory items" and "View inventory items" SELECT policies

-- Drop the existing SELECT-specific policy
DROP POLICY IF EXISTS "View inventory items" ON public.inventory_items;

-- The "Manage inventory items" policy already handles SELECT as part of FOR ALL
-- But we need to ensure the SELECT access is properly optimized
-- Drop and recreate the manage policy to be more explicit

DROP POLICY IF EXISTS "Manage inventory items" ON public.inventory_items;

-- Create separate policies for different operations to be more explicit
CREATE POLICY "Users can view inventory items based on role" 
ON public.inventory_items 
FOR SELECT 
USING (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'manager'::app_role) OR 
  has_role((SELECT auth.uid()), 'technician'::app_role)
);

CREATE POLICY "Admins and managers can manage inventory items" 
ON public.inventory_items 
FOR ALL 
USING (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'manager'::app_role)
)
WITH CHECK (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'manager'::app_role)
);