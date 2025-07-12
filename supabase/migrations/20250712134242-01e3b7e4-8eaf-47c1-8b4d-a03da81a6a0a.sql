-- Add FPS Item # column to inventory_items table
ALTER TABLE public.inventory_items 
ADD COLUMN fps_item_number TEXT;