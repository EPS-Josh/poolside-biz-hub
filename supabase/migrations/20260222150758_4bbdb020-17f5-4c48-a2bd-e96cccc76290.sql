
-- Drop overly permissive policies
DROP POLICY IF EXISTS "System can insert assessor records" ON public.pima_assessor_records;
DROP POLICY IF EXISTS "System can update assessor records" ON public.pima_assessor_records;
DROP POLICY IF EXISTS "System can delete assessor records" ON public.pima_assessor_records;

-- Create admin-only write policies
CREATE POLICY "Only admins can insert assessor records" 
ON public.pima_assessor_records 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update assessor records" 
ON public.pima_assessor_records 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete assessor records" 
ON public.pima_assessor_records 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));
