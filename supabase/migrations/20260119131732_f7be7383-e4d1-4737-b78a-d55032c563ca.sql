-- Drop the overly permissive INSERT policy on audit_logs
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Create a more restrictive INSERT policy for audit_logs
-- Audit logs should only be inserted by authenticated users or triggers (which run as SECURITY DEFINER)
CREATE POLICY "Authenticated users can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (
    -- User can only insert logs for themselves
    user_id = auth.uid() OR
    -- Or admins/managers can insert any log
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  )
);