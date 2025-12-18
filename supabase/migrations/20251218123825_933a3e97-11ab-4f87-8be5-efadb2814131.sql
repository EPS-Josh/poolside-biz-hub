-- Create mileage_entries table for tax record keeping
CREATE TABLE public.mileage_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  start_miles NUMERIC NOT NULL DEFAULT 0,
  end_miles NUMERIC NOT NULL,
  employee TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mileage_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admin/manager access)
CREATE POLICY "Admins and managers can view all mileage entries" 
ON public.mileage_entries 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins and managers can create mileage entries" 
ON public.mileage_entries 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins and managers can update mileage entries" 
ON public.mileage_entries 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins and managers can delete mileage entries" 
ON public.mileage_entries 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_mileage_entries_updated_at
BEFORE UPDATE ON public.mileage_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries by date and employee
CREATE INDEX idx_mileage_entries_date ON public.mileage_entries(date);
CREATE INDEX idx_mileage_entries_employee ON public.mileage_entries(employee);