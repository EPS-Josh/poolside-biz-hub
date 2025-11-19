-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload customer photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view customer photos" ON storage.objects;
DROP POLICY IF EXISTS "Customers can view their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update customer photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete customer photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload plans/drawings" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view plans/drawings" ON storage.objects;
DROP POLICY IF EXISTS "Customers can view their own plans/drawings" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update plans/drawings" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete plans/drawings" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload TSB attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view TSB attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update TSB attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete TSB attachments" ON storage.objects;

-- Update storage buckets to be private and secure
UPDATE storage.buckets 
SET 
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'customer-photos';

UPDATE storage.buckets 
SET 
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf']
WHERE id = 'customer-plans-drawings';

UPDATE storage.buckets 
SET 
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf', 'video/mp4', 'video/quicktime']
WHERE id = 'tsb-attachments';

-- Secure storage policies for customer-photos
CREATE POLICY "Staff can upload customer photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'customer-photos' 
  AND auth.uid() IS NOT NULL 
  AND NOT has_role(auth.uid(), 'guest'::app_role)
);

CREATE POLICY "Staff can view customer photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'customer-photos' 
  AND auth.uid() IS NOT NULL 
  AND NOT has_role(auth.uid(), 'guest'::app_role)
);

CREATE POLICY "Customers view own photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'customer-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM customers WHERE customer_user_id = auth.uid()
  )
);

CREATE POLICY "Staff can update customer photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'customer-photos' 
  AND auth.uid() IS NOT NULL 
  AND NOT has_role(auth.uid(), 'guest'::app_role)
);

CREATE POLICY "Staff can delete customer photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'customer-photos' 
  AND auth.uid() IS NOT NULL 
  AND NOT has_role(auth.uid(), 'guest'::app_role)
);

-- Secure storage policies for customer-plans-drawings
CREATE POLICY "Staff can upload plans"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'customer-plans-drawings' 
  AND auth.uid() IS NOT NULL 
  AND NOT has_role(auth.uid(), 'guest'::app_role)
);

CREATE POLICY "Staff can view plans"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'customer-plans-drawings' 
  AND auth.uid() IS NOT NULL 
  AND NOT has_role(auth.uid(), 'guest'::app_role)
);

CREATE POLICY "Customers view own plans"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'customer-plans-drawings'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM customers WHERE customer_user_id = auth.uid()
  )
);

CREATE POLICY "Staff can update plans"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'customer-plans-drawings' 
  AND auth.uid() IS NOT NULL 
  AND NOT has_role(auth.uid(), 'guest'::app_role)
);

CREATE POLICY "Staff can delete plans"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'customer-plans-drawings' 
  AND auth.uid() IS NOT NULL 
  AND NOT has_role(auth.uid(), 'guest'::app_role)
);

-- Secure storage policies for tsb-attachments
CREATE POLICY "Staff can upload TSB attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tsb-attachments' 
  AND auth.uid() IS NOT NULL 
  AND NOT has_role(auth.uid(), 'guest'::app_role)
);

CREATE POLICY "All authenticated can view TSB attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tsb-attachments' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Staff can update TSB attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tsb-attachments' 
  AND auth.uid() IS NOT NULL 
  AND NOT has_role(auth.uid(), 'guest'::app_role)
);

CREATE POLICY "Staff can delete TSB attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tsb-attachments' 
  AND auth.uid() IS NOT NULL 
  AND NOT has_role(auth.uid(), 'guest'::app_role)
);

-- Create rate limiting table for public endpoints
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL,
  identifier text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System manages rate limits"
ON public.rate_limit_log FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_rate_limit_log_lookup 
ON public.rate_limit_log(endpoint, identifier, window_start);