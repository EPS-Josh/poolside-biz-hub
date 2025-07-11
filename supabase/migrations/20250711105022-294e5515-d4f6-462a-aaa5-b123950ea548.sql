-- Fix RLS policy performance issue on profiles table
-- Replace auth.uid() with (select auth.uid()) to avoid re-evaluation for each row

ALTER POLICY "Users can view their own profile" 
ON public.profiles 
USING ((select auth.uid()) = id);

ALTER POLICY "Users can update their own profile" 
ON public.profiles 
USING ((select auth.uid()) = id);

ALTER POLICY "Users can insert their own profile" 
ON public.profiles 
WITH CHECK ((select auth.uid()) = id);