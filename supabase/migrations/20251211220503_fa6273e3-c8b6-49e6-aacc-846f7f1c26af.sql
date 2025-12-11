-- Activate SMS opt-in for customers who sent YES before webhook fix
UPDATE public.customers 
SET sms_opt_in = true, 
    sms_opt_in_date = NOW(), 
    phone_verified = true 
WHERE id IN (
    '20f59a09-9595-4465-b695-1cb56fba2d5d',  -- William & Joy Schmitt (646-306-5261)
    '7d567e43-4d29-4db7-90e8-8121b282053a',  -- Doug Cornett (859-200-2133)
    '52b4426b-0475-49bc-a12a-bd039643abf7'   -- David & Cathy Lee (520-954-8008)
);