
-- Create a table to store service requests from the public website
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  service_type TEXT NOT NULL,
  preferred_contact_method TEXT NOT NULL CHECK (preferred_contact_method IN ('phone', 'email')),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) - Since this is for public service requests,
-- we'll allow inserts from anyone but restrict viewing to authenticated users only
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert service requests (for the public form)
CREATE POLICY "Anyone can create service requests" 
  ON public.service_requests 
  FOR INSERT 
  WITH CHECK (true);

-- Only authenticated users (staff) can view service requests
CREATE POLICY "Authenticated users can view all service requests" 
  ON public.service_requests 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Only authenticated users can update service requests (for status changes)
CREATE POLICY "Authenticated users can update service requests" 
  ON public.service_requests 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Add trigger to update the updated_at timestamp
CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
