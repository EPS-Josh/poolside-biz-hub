-- Add FPS Sales Price and Markup Percentage fields to inventory_items table
ALTER TABLE public.inventory_items
ADD COLUMN fps_sales_price numeric,
ADD COLUMN markup_percentage numeric;