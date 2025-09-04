-- Create tables for customer documents
CREATE TABLE public.customer_plans_drawings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  description TEXT,
  category TEXT DEFAULT 'plan', -- 'plan', 'print', 'drawing'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_scanned_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  description TEXT,
  document_type TEXT, -- 'contract', 'invoice', 'permit', 'other'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customer_plans_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_scanned_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customer_plans_drawings
CREATE POLICY "Authenticated users can view all customer plans/drawings" 
ON public.customer_plans_drawings 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can create customer plans/drawings" 
ON public.customer_plans_drawings 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can update all customer plans/drawings" 
ON public.customer_plans_drawings 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role))
WITH CHECK (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can delete all customer plans/drawings" 
ON public.customer_plans_drawings 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

-- Create RLS policies for customer_scanned_documents
CREATE POLICY "Authenticated users can view all customer scanned documents" 
ON public.customer_scanned_documents 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can create customer scanned documents" 
ON public.customer_scanned_documents 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can update all customer scanned documents" 
ON public.customer_scanned_documents 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role))
WITH CHECK (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Authenticated users can delete all customer scanned documents" 
ON public.customer_scanned_documents 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'guest'::app_role));

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-plans-drawings', 'customer-plans-drawings', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-scanned-documents', 'customer-scanned-documents', false);

-- Create storage policies for customer-plans-drawings bucket (public access for viewing)
CREATE POLICY "Customer plans/drawings are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'customer-plans-drawings');

CREATE POLICY "Authenticated users can upload customer plans/drawings" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'customer-plans-drawings' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update customer plans/drawings" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'customer-plans-drawings' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete customer plans/drawings" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'customer-plans-drawings' AND auth.uid() IS NOT NULL);

-- Create storage policies for customer-scanned-documents bucket (private access)
CREATE POLICY "Authenticated users can view customer scanned documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'customer-scanned-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload customer scanned documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'customer-scanned-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update customer scanned documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'customer-scanned-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete customer scanned documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'customer-scanned-documents' AND auth.uid() IS NOT NULL);