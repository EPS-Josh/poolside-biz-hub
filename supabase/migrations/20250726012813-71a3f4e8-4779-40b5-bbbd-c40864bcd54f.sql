-- Remove phone number 520 881 2777 from all customers except Cimarron Circle Construction Company main contact
UPDATE customers 
SET phone = NULL 
WHERE phone IN ('520 881 2777', '5208812777') 
  AND id != 'dd7572fd-f750-4de8-97f3-eaab9b2cd104';