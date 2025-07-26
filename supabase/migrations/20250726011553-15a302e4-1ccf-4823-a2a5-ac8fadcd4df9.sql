-- Remove duplicate Sheldon & Kathleen Brown customer without phone and email
DELETE FROM customers 
WHERE first_name = 'Sheldon & Kathleen' 
  AND last_name = 'Brown' 
  AND address = '6101 N Camino Padre Isidoro'
  AND email IS NULL 
  AND phone IS NULL;