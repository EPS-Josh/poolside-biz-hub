-- Make tsb-attachments bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'tsb-attachments';

-- Drop any existing public access policy
DROP POLICY IF EXISTS "TSB attachments are publicly accessible" ON storage.objects;

-- Ensure authenticated users can view TSB attachments
CREATE POLICY "Authenticated users can view TSB attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'tsb-attachments' AND auth.uid() IS NOT NULL);

-- Ensure authenticated users can upload TSB attachments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload TSB attachments' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated users can upload TSB attachments"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'tsb-attachments' AND auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Ensure authenticated users can delete TSB attachments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete TSB attachments' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated users can delete TSB attachments"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'tsb-attachments' AND auth.uid() IS NOT NULL);
  END IF;
END $$;