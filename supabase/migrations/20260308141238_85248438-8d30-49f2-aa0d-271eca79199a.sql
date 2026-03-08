
-- Create splash_photos table
CREATE TABLE public.splash_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.splash_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can view splash photos (public splash page)
CREATE POLICY "Anyone can view splash photos"
  ON public.splash_photos FOR SELECT
  USING (true);

-- Only admins/managers/technicians can insert
CREATE POLICY "Staff can insert splash photos"
  ON public.splash_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
    OR public.has_role(auth.uid(), 'technician'::app_role)
  );

-- Only admins/managers/technicians can delete
CREATE POLICY "Staff can delete splash photos"
  ON public.splash_photos FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
    OR public.has_role(auth.uid(), 'technician'::app_role)
  );

-- Create public storage bucket for splash photos
INSERT INTO storage.buckets (id, name, public) VALUES ('splash-photos', 'splash-photos', true);

-- Anyone can read splash photos from storage
CREATE POLICY "Anyone can view splash photo files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'splash-photos');

-- Staff can upload splash photos
CREATE POLICY "Staff can upload splash photo files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'splash-photos'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'manager'::app_role)
      OR public.has_role(auth.uid(), 'technician'::app_role)
    )
  );

-- Staff can delete splash photos
CREATE POLICY "Staff can delete splash photo files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'splash-photos'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'manager'::app_role)
      OR public.has_role(auth.uid(), 'technician'::app_role)
    )
  );
