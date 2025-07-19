-- Create storage bucket for TSB attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('tsb-attachments', 'tsb-attachments', true);

-- Create policies for TSB attachment uploads
CREATE POLICY "TSB attachments are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'tsb-attachments');

CREATE POLICY "Authenticated users can upload TSB attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'tsb-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own TSB attachments" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'tsb-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own TSB attachments" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'tsb-attachments' AND auth.uid() IS NOT NULL);