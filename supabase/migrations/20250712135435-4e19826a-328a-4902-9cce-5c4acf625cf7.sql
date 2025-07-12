-- Add supplier fields to inventory_items table
ALTER TABLE public.inventory_items 
ADD COLUMN supplier_1_name TEXT,
ADD COLUMN supplier_1_price NUMERIC,
ADD COLUMN supplier_2_name TEXT,
ADD COLUMN supplier_2_price NUMERIC,
ADD COLUMN supplier_3_name TEXT,
ADD COLUMN supplier_3_price NUMERIC,
ADD COLUMN supplier_4_name TEXT,
ADD COLUMN supplier_4_price NUMERIC,
ADD COLUMN supplier_5_name TEXT,
ADD COLUMN supplier_5_price NUMERIC;