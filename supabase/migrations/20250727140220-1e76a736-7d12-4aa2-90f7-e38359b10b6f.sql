-- Create table for Pima County Assessor records
CREATE TABLE public.pima_assessor_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parcel_number TEXT NOT NULL,
  owner_name TEXT,
  property_address TEXT,
  mailing_address TEXT,
  assessed_value NUMERIC,
  property_type TEXT,
  legal_description TEXT,
  square_footage INTEGER,
  year_built INTEGER,
  lot_size NUMERIC,
  zoning TEXT,
  last_sale_date DATE,
  last_sale_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for fast lookups
CREATE INDEX idx_pima_assessor_records_parcel ON public.pima_assessor_records(parcel_number);
CREATE INDEX idx_pima_assessor_records_owner ON public.pima_assessor_records(owner_name);
CREATE INDEX idx_pima_assessor_records_address ON public.pima_assessor_records(property_address);

-- Enable RLS
ALTER TABLE public.pima_assessor_records ENABLE ROW LEVEL SECURITY;

-- Create policies for read access (this is reference data, so allow all authenticated users to read)
CREATE POLICY "Authenticated users can view assessor records" 
ON public.pima_assessor_records 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create policy for admin/system to insert data
CREATE POLICY "System can insert assessor records" 
ON public.pima_assessor_records 
FOR INSERT 
WITH CHECK (true);

-- Create policy for admin/system to update data
CREATE POLICY "System can update assessor records" 
ON public.pima_assessor_records 
FOR UPDATE 
USING (true);

-- Create policy for admin/system to delete data
CREATE POLICY "System can delete assessor records" 
ON public.pima_assessor_records 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pima_assessor_records_updated_at
BEFORE UPDATE ON public.pima_assessor_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();