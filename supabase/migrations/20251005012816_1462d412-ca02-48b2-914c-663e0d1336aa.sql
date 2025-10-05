-- Create table for customer-submitted readings
CREATE TABLE public.customer_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  reading_date DATE NOT NULL,
  reading_time TIME WITHOUT TIME ZONE NOT NULL,
  readings JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_readings ENABLE ROW LEVEL SECURITY;

-- Customers can view their own readings
CREATE POLICY "Customers can view their own readings"
ON public.customer_readings
FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM public.customers 
    WHERE customer_user_id = auth.uid()
  )
);

-- Customers can insert their own readings
CREATE POLICY "Customers can insert their own readings"
ON public.customer_readings
FOR INSERT
WITH CHECK (
  customer_id IN (
    SELECT id FROM public.customers 
    WHERE customer_user_id = auth.uid()
  )
);

-- Customers can update their own readings
CREATE POLICY "Customers can update their own readings"
ON public.customer_readings
FOR UPDATE
USING (
  customer_id IN (
    SELECT id FROM public.customers 
    WHERE customer_user_id = auth.uid()
  )
)
WITH CHECK (
  customer_id IN (
    SELECT id FROM public.customers 
    WHERE customer_user_id = auth.uid()
  )
);

-- Customers can delete their own readings
CREATE POLICY "Customers can delete their own readings"
ON public.customer_readings
FOR DELETE
USING (
  customer_id IN (
    SELECT id FROM public.customers 
    WHERE customer_user_id = auth.uid()
  )
);

-- Staff can view all customer readings
CREATE POLICY "Staff can view all customer readings"
ON public.customer_readings
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  NOT has_role(auth.uid(), 'guest'::app_role)
);

-- Add trigger for updated_at
CREATE TRIGGER update_customer_readings_updated_at
  BEFORE UPDATE ON public.customer_readings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();