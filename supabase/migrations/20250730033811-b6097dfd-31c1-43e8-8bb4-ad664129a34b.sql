-- Update RLS policies for customer_photos table to allow all authenticated users (except guests) to view and edit
DROP POLICY IF EXISTS "Users can view photos for their own customers" ON public.customer_photos;
DROP POLICY IF EXISTS "Users can create photos for their own customers" ON public.customer_photos;
DROP POLICY IF EXISTS "Users can update photos for their own customers" ON public.customer_photos;
DROP POLICY IF EXISTS "Users can delete photos for their own customers" ON public.customer_photos;

-- Create new policies for customer_photos - all authenticated users can manage all photos except guests
CREATE POLICY "Authenticated users can view all customer photos" 
ON public.customer_photos 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can create customer photos" 
ON public.customer_photos 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can update all customer photos" 
ON public.customer_photos 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role))
WITH CHECK (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can delete all customer photos" 
ON public.customer_photos 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));