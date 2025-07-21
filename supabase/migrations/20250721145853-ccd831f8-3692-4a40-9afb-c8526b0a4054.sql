-- Add category field to manuals table
ALTER TABLE public.manuals 
ADD COLUMN category TEXT;

-- Add category field to parts_diagrams table  
ALTER TABLE public.parts_diagrams 
ADD COLUMN category TEXT;