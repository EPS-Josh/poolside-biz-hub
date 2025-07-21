-- Create manuals table
CREATE TABLE public.manuals (
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
ALTER TABLE public.manuals ENABLE ROW LEVEL SECURITY;

-- Create policies for manuals
CREATE POLICY "Authenticated users can view all manuals" 
ON public.manuals 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create manuals" 
ON public.manuals 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can update all manuals" 
ON public.manuals 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all manuals" 
ON public.manuals 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_manuals_updated_at
BEFORE UPDATE ON public.manuals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();