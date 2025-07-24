-- Remove TMC Pools email addresses from all customers except the one named "TMC Custom Pools"
UPDATE public.customers 
SET email = NULL
WHERE (email LIKE '%@tmcpools.com' OR email LIKE '%tmcpool%')
AND NOT (first_name = 'TMC' AND last_name = 'Custom Pools');