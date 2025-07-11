-- Update company_data to be global instead of user-specific
-- Remove user-specific RLS policies and create global ones

-- Drop existing user-specific policies
DROP POLICY IF EXISTS "Users can view their own company data" ON public.company_data;
DROP POLICY IF EXISTS "Users can create their own company data" ON public.company_data;
DROP POLICY IF EXISTS "Users can update their own company data" ON public.company_data;
DROP POLICY IF EXISTS "Users can delete their own company data" ON public.company_data;

-- Create new global policies for authenticated users
CREATE POLICY "Authenticated users can view company data" 
ON public.company_data 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can update company data" 
ON public.company_data 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert company data" 
ON public.company_data 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete company data" 
ON public.company_data 
FOR DELETE 
TO authenticated 
USING (true);