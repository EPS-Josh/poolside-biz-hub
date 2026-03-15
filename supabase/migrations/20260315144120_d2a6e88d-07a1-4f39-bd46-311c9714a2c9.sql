-- Update all inventory items with type 'PARTS' to 'Parts'
UPDATE public.inventory_items
SET type = 'Parts'
WHERE type = 'PARTS';