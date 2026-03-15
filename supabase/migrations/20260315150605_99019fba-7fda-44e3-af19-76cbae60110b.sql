-- Update FPS Item # for In-Floor items: replace UNK prefix with ZOD (Zodiac)
UPDATE public.inventory_items
SET fps_item_number = 'ZOD' || SUBSTRING(fps_item_number FROM 4)
WHERE solution = 'In-Floor' AND fps_item_number LIKE 'UNK-%';