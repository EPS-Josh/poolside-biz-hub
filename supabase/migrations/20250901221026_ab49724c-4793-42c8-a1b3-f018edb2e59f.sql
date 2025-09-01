-- Create table for saved service routes
CREATE TABLE public.saved_service_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  route_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_service_routes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own saved routes" 
ON public.saved_service_routes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own saved routes" 
ON public.saved_service_routes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved routes" 
ON public.saved_service_routes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved routes" 
ON public.saved_service_routes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_saved_service_routes_updated_at
BEFORE UPDATE ON public.saved_service_routes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();