-- Fix RLS policy performance issues for remaining tables (Part 3)
-- Replace auth.uid() calls with (SELECT auth.uid()) to prevent re-evaluation per row

-- Fix tsbs table policies
DROP POLICY IF EXISTS "Authenticated users can view all TSBs" ON public.tsbs;
DROP POLICY IF EXISTS "Authenticated users can create TSBs" ON public.tsbs;
DROP POLICY IF EXISTS "Authenticated users can update TSBs" ON public.tsbs;
DROP POLICY IF EXISTS "Authenticated users can delete TSBs" ON public.tsbs;

CREATE POLICY "Authenticated users can view all TSBs" 
ON public.tsbs 
FOR SELECT 
USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can create TSBs" 
ON public.tsbs 
FOR INSERT 
WITH CHECK (((SELECT auth.uid()) IS NOT NULL) AND ((SELECT auth.uid()) = user_id));

CREATE POLICY "Authenticated users can update TSBs" 
ON public.tsbs 
FOR UPDATE 
USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete TSBs" 
ON public.tsbs 
FOR DELETE 
USING ((SELECT auth.uid()) IS NOT NULL);

-- Fix user_roles table policies (consolidate multiple policies)
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can assign user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Validate role assignments" ON public.user_roles;

-- Single consolidated policy for viewing roles
CREATE POLICY "View user roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role((SELECT auth.uid()), 'admin'::app_role) OR (SELECT auth.uid()) = user_id);

-- Single consolidated policy for managing roles
CREATE POLICY "Manage user roles" 
ON public.user_roles 
FOR ALL 
USING (has_role((SELECT auth.uid()), 'admin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role) AND validate_role_assignment(user_id, role));