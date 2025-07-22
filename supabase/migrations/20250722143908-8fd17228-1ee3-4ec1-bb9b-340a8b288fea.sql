-- Update customer records with company name "Cimarron Circle Const. Co." to "Cimarron Circle Construction Company"
UPDATE public.customers 
SET company = 'Cimarron Circle Construction Company'
WHERE company = 'Cimarron Circle Const. Co.';