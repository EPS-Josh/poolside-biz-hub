-- Create parts_diagrams table
CREATE TABLE public.parts_diagrams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.parts_diagrams ENABLE ROW LEVEL SECURITY;

-- Create policies for parts diagrams
CREATE POLICY "Authenticated users can view all parts diagrams" 
ON public.parts_diagrams 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create parts diagrams" 
ON public.parts_diagrams 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can update all parts diagrams" 
ON public.parts_diagrams 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all parts diagrams" 
ON public.parts_diagrams 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_parts_diagrams_updated_at
BEFORE UPDATE ON public.parts_diagrams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();