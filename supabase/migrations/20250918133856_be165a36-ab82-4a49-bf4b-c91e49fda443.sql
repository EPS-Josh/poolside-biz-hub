-- Fix RLS policy performance issues for remaining tables (Part 4)
-- Replace auth.uid() calls with (SELECT auth.uid()) to prevent re-evaluation per row

-- Fix profiles table policies (consolidate multiple policies)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Single consolidated policy for viewing profiles
CREATE POLICY "View profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role((SELECT auth.uid()), 'admin'::app_role) OR (SELECT auth.uid()) = id);

-- Single consolidated policy for inserting profiles
CREATE POLICY "Insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role) OR (SELECT auth.uid()) = id);

-- Single consolidated policy for updating profiles
CREATE POLICY "Update profiles" 
ON public.profiles 
FOR UPDATE 
USING (has_role((SELECT auth.uid()), 'admin'::app_role) OR (SELECT auth.uid()) = id);

-- Single policy for deleting profiles (admin only)
CREATE POLICY "Delete profiles" 
ON public.profiles 
FOR DELETE 
USING (has_role((SELECT auth.uid()), 'admin'::app_role));

-- Fix customer_photos table policies
DROP POLICY IF EXISTS "Authenticated users can view all customer photos" ON public.customer_photos;
DROP POLICY IF EXISTS "Authenticated users can create customer photos" ON public.customer_photos;
DROP POLICY IF EXISTS "Authenticated users can update all customer photos" ON public.customer_photos;
DROP POLICY IF EXISTS "Authenticated users can delete all customer photos" ON public.customer_photos;

CREATE POLICY "Authenticated users can view all customer photos" 
ON public.customer_photos 
FOR SELECT 
USING (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));

CREATE POLICY "Authenticated users can create customer photos" 
ON public.customer_photos 
FOR INSERT 
WITH CHECK (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));

CREATE POLICY "Authenticated users can update all customer photos" 
ON public.customer_photos 
FOR UPDATE 
USING (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)))
WITH CHECK (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));

CREATE POLICY "Authenticated users can delete all customer photos" 
ON public.customer_photos 
FOR DELETE 
USING (((SELECT auth.uid()) IS NOT NULL) AND (NOT has_role((SELECT auth.uid()), 'guest'::app_role)));