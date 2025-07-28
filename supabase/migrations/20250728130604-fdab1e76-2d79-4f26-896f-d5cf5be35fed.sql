-- Add fields to track owner updates in pima_assessor_records
ALTER TABLE public.pima_assessor_records 
ADD COLUMN updated_owner_name text,
ADD COLUMN is_owner_updated boolean DEFAULT false,
ADD COLUMN owner_updated_at timestamp with time zone,
ADD COLUMN owner_updated_by uuid REFERENCES auth.users(id);

-- Create index for better performance
CREATE INDEX idx_pima_assessor_updated_owner ON public.pima_assessor_records(is_owner_updated);