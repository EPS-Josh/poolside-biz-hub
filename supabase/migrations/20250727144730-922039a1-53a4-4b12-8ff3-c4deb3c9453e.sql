-- Drop the existing table and recreate with correct structure
DROP TABLE IF EXISTS public.pima_assessor_records;

-- Create new table with exact CSV structure
CREATE TABLE public.pima_assessor_records (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    parcel text,
    mail1 text,
    mail2 text,
    mail3 text,
    mail4 text,
    mail5 text,
    zip text,
    zip4 text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pima_assessor_records ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to view the data
CREATE POLICY "Authenticated users can view assessor records" 
ON public.pima_assessor_records 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create policies for system operations (for future imports)
CREATE POLICY "System can insert assessor records" 
ON public.pima_assessor_records 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update assessor records" 
ON public.pima_assessor_records 
FOR UPDATE 
USING (true);

CREATE POLICY "System can delete assessor records" 
ON public.pima_assessor_records 
FOR DELETE 
USING (true);