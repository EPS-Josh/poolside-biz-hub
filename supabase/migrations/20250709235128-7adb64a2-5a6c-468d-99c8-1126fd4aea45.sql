
-- Drop the existing restrictive policies for service_records table
DROP POLICY IF EXISTS "Users can view their own service records" ON public.service_records;
DROP POLICY IF EXISTS "Users can create their own service records" ON public.service_records;
DROP POLICY IF EXISTS "Users can update their own service records" ON public.service_records;
DROP POLICY IF EXISTS "Users can delete their own service records" ON public.service_records;

-- Create new policies that allow all authenticated users full access to service_records
CREATE POLICY "Authenticated users can view all service records" 
  ON public.service_records 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create service records" 
  ON public.service_records 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update all service records" 
  ON public.service_records 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete all service records" 
  ON public.service_records 
  FOR DELETE 
  TO authenticated
  USING (true);
