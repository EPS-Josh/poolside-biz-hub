-- Update FPS Item # for In-Floor items: replace GEN with INF solution code
UPDATE public.inventory_items
SET fps_item_number = REPLACE(fps_item_number, '-GEN-', '-INF-')
WHERE solution = 'In-Floor' AND fps_item_number LIKE '%-GEN-%';