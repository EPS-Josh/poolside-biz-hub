-- Remove Cimarron Circle email addresses from all customers except the one named "Cimarron Circle Construction Company"
UPDATE public.customers 
SET email = NULL
WHERE email LIKE '%@cimarroncircle.com' 
AND NOT (first_name = 'Cimarron Circle' AND last_name = 'Construction Company');