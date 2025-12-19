-- Create a table to store user menu layouts
CREATE TABLE public.user_menu_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  layout_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_menu_layouts_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_menu_layouts ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own menu layout
CREATE POLICY "Users can view their own menu layout"
ON public.user_menu_layouts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own menu layout"
ON public.user_menu_layouts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own menu layout"
ON public.user_menu_layouts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own menu layout"
ON public.user_menu_layouts
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_menu_layouts_updated_at
BEFORE UPDATE ON public.user_menu_layouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();