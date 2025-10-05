-- Fix: Restrict service_requests SELECT access to admins and managers only
-- Drop the overly permissive policy that allows any authenticated user to view all service requests
DROP POLICY IF EXISTS "Service requests can be viewed by authenticated users" ON public.service_requests;

-- Create a new policy that restricts SELECT access to admins and managers only
CREATE POLICY "Admins and managers can view service requests"
ON public.service_requests
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);