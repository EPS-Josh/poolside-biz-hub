-- Remove Cimarron Circle email addresses from customers not belonging to Cimarron Circle Construction Company
UPDATE public.customers 
SET email = NULL
WHERE email LIKE '%@cimarroncircle.com' 
AND company != 'Cimarron Circle Construction Company';