-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage their own calendar integrations" ON public.calendar_integrations;

-- Create new admin-only policy for viewing
CREATE POLICY "Only admins can view calendar integrations"
ON public.calendar_integrations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create new admin-only policy for insert
CREATE POLICY "Only admins can create calendar integrations"
ON public.calendar_integrations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create new admin-only policy for update
CREATE POLICY "Only admins can update calendar integrations"
ON public.calendar_integrations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create new admin-only policy for delete
CREATE POLICY "Only admins can delete calendar integrations"
ON public.calendar_integrations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));