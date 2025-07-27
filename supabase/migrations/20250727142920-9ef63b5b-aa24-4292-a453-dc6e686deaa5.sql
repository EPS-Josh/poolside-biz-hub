-- Create storage bucket for large data files
INSERT INTO storage.buckets (id, name, public) VALUES ('data-imports', 'data-imports', false);

-- Create storage policies for data imports bucket
CREATE POLICY "Authenticated users can upload to data-imports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'data-imports' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read from data-imports" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'data-imports' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update data-imports" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'data-imports' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from data-imports" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'data-imports' AND auth.uid() IS NOT NULL);