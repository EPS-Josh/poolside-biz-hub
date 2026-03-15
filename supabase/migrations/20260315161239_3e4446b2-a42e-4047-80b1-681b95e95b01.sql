
-- Add MSC code for Misc
INSERT INTO fps_solution_codes (solution_name, code, user_id)
VALUES ('Misc', 'MSC', '00000000-0000-0000-0000-000000000000');

-- Add WGD code for White Goods
INSERT INTO fps_solution_codes (solution_name, code, user_id)
VALUES ('White Goods', 'WGD', '00000000-0000-0000-0000-000000000000');

-- Change Skimmer items' solution to White Goods
UPDATE inventory_items
SET solution = 'White Goods'
WHERE solution = 'Skimmer' AND fps_item_number LIKE '%-GEN-%';

-- Update Filter items: GEN -> FIL
UPDATE inventory_items
SET fps_item_number = REPLACE(fps_item_number, '-GEN-', '-FIL-')
WHERE solution = 'Filter' AND fps_item_number LIKE '%-GEN-%';

-- Update Pump items: GEN -> PMP
UPDATE inventory_items
SET fps_item_number = REPLACE(fps_item_number, '-GEN-', '-PMP-')
WHERE solution = 'Pump' AND fps_item_number LIKE '%-GEN-%';

-- Update Misc items: GEN -> MSC
UPDATE inventory_items
SET fps_item_number = REPLACE(fps_item_number, '-GEN-', '-MSC-')
WHERE solution = 'Misc' AND fps_item_number LIKE '%-GEN-%';

-- Update former Skimmer (now White Goods) items: GEN -> WGD
UPDATE inventory_items
SET fps_item_number = REPLACE(fps_item_number, '-GEN-', '-WGD-')
WHERE solution = 'White Goods' AND fps_item_number LIKE '%-GEN-%';
