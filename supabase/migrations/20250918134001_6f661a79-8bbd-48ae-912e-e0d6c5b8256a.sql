-- Fix RLS policy performance issues for remaining tables (Part 5)
-- Replace auth.uid() calls with (SELECT auth.uid()) to prevent re-evaluation per row

-- Fix company_data table policies
DROP POLICY IF EXISTS "Only admins and managers can view company data" ON public.company_data;
DROP POLICY IF EXISTS "Only admins and managers can create company data" ON public.company_data;
DROP POLICY IF EXISTS "Only admins and managers can update company data" ON public.company_data;
DROP POLICY IF EXISTS "Only admins and managers can delete company data" ON public.company_data;

CREATE POLICY "Admins and managers can manage company data" 
ON public.company_data 
FOR ALL 
USING (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role));

-- Fix inventory_items table policies (consolidate multiple policies)
DROP POLICY IF EXISTS "Admins and managers can manage inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Technicians can view inventory items" ON public.inventory_items;

-- Single policy for viewing inventory (includes technicians)
CREATE POLICY "View inventory items" 
ON public.inventory_items 
FOR SELECT 
USING (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR has_role((SELECT auth.uid()), 'technician'::app_role));

-- Single policy for managing inventory (admins and managers only)
CREATE POLICY "Manage inventory items" 
ON public.inventory_items 
FOR ALL 
USING (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role));

-- Fix calendar_integrations table policies
DROP POLICY IF EXISTS "Users can view their own calendar integrations" ON public.calendar_integrations;
DROP POLICY IF EXISTS "Users can create their own calendar integrations" ON public.calendar_integrations;
DROP POLICY IF EXISTS "Users can update their own calendar integrations" ON public.calendar_integrations;
DROP POLICY IF EXISTS "Users can delete their own calendar integrations" ON public.calendar_integrations;

CREATE POLICY "Users can manage their own calendar integrations" 
ON public.calendar_integrations 
FOR ALL 
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);