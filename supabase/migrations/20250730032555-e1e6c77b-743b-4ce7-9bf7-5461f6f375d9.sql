-- Create customer-photos storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('customer-photos', 'customer-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for customer photos
CREATE POLICY "Anyone can view customer photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'customer-photos');

CREATE POLICY "Authenticated users can upload customer photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'customer-photos' AND auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can update customer photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'customer-photos' AND auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can delete customer photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'customer-photos' AND auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));