-- Update RLS policies for appointments table to allow all authenticated users (except guests) to view and edit
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON public.appointments;

-- Create new policies for appointments - all authenticated users can manage all appointments except guests
CREATE POLICY "Authenticated users can view all appointments" 
ON public.appointments 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can create appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can update all appointments" 
ON public.appointments 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role))
WITH CHECK (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can delete all appointments" 
ON public.appointments 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));