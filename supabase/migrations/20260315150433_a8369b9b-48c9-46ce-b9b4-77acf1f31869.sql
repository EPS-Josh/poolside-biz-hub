-- Set category to 'Zodiac' for all In-Floor solution items
UPDATE public.inventory_items
SET category = 'Zodiac'
WHERE solution = 'In-Floor';