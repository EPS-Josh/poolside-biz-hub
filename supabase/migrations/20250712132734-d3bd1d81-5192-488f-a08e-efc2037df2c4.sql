-- Add new columns to inventory_items table to match the new CSV format
ALTER TABLE public.inventory_items 
ADD COLUMN item_number TEXT,
ADD COLUMN solution TEXT,
ADD COLUMN type TEXT,
ADD COLUMN pieces_per_part INTEGER,
ADD COLUMN min_order_qty INTEGER,
ADD COLUMN item_status TEXT,
ADD COLUMN list_price DECIMAL(10,2),
ADD COLUMN upc TEXT,
ADD COLUMN superseded_item TEXT,
ADD COLUMN pieces_per_case INTEGER,
ADD COLUMN pieces_per_pallet INTEGER,
ADD COLUMN length DECIMAL(10,2),
ADD COLUMN width DECIMAL(10,2),
ADD COLUMN height DECIMAL(10,2),
ADD COLUMN weight DECIMAL(10,2);

-- Update the name column to be nullable since we now have item_number
ALTER TABLE public.inventory_items ALTER COLUMN name DROP NOT NULL;