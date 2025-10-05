-- Insert 300 customer readings for Joshua Wilkinson on dates without service records
-- Customer ID: e85be1b7-ade8-4995-91da-db97dd20b159

DO $$
DECLARE
  customer_uuid UUID := 'e85be1b7-ade8-4995-91da-db97dd20b159';
  service_dates DATE[];
  date_iter DATE := '2025-01-01'::DATE;
  end_date DATE := '2025-12-31'::DATE;
  readings_count INTEGER := 0;
  random_ph NUMERIC;
  random_cyanuric_acid INTEGER;
  random_free_chlorine NUMERIC;
  random_total_hardness INTEGER;
  random_total_alkalinity INTEGER;
  random_total_chlorine_bromine NUMERIC;
  random_hour INTEGER;
  random_minute INTEGER;
BEGIN
  -- Get all service record dates for this customer
  SELECT ARRAY_AGG(service_date) INTO service_dates
  FROM service_records
  WHERE customer_id = customer_uuid;

  -- Loop through dates and insert readings on non-service days
  WHILE date_iter <= end_date AND readings_count < 300 LOOP
    -- Check if this date is NOT a service record date
    IF NOT (date_iter = ANY(service_dates)) THEN
      -- Generate random but realistic pool chemistry readings
      random_ph := ROUND((7.0 + (RANDOM() * 1.2))::NUMERIC, 1); -- 7.0 to 8.2
      random_cyanuric_acid := FLOOR(20 + (RANDOM() * 180)); -- 20 to 200 ppm
      random_free_chlorine := ROUND((0.5 + (RANDOM() * 4.5))::NUMERIC, 1); -- 0.5 to 5.0 ppm
      random_total_hardness := FLOOR(100 + (RANDOM() * 350)); -- 100 to 450 ppm
      random_total_alkalinity := FLOOR(80 + (RANDOM() * 150)); -- 80 to 230 ppm
      random_total_chlorine_bromine := ROUND((1.0 + (RANDOM() * 7.0))::NUMERIC, 1); -- 1.0 to 8.0 ppm
      
      -- Random time of day (mostly afternoon/evening when people check pools)
      random_hour := FLOOR(12 + (RANDOM() * 9)); -- 12 PM to 9 PM
      random_minute := FLOOR(RANDOM() * 60);
      
      INSERT INTO customer_readings (
        customer_id,
        reading_date,
        reading_time,
        readings,
        created_at,
        updated_at
      ) VALUES (
        customer_uuid,
        date_iter,
        (random_hour || ':' || LPAD(random_minute::TEXT, 2, '0') || ':00')::TIME,
        jsonb_build_object(
          'ph', random_ph::TEXT,
          'cyanuric_acid', random_cyanuric_acid::TEXT,
          'free_chlorine', random_free_chlorine::TEXT,
          'total_hardness', random_total_hardness::TEXT,
          'total_alkalinity', random_total_alkalinity::TEXT,
          'total_chlorine_bromine', random_total_chlorine_bromine::TEXT
        ),
        NOW(),
        NOW()
      );
      
      readings_count := readings_count + 1;
      
      -- Exit if we've reached 300 readings
      IF readings_count >= 300 THEN
        EXIT;
      END IF;
    END IF;
    
    -- Move to next day
    date_iter := date_iter + INTERVAL '1 day';
  END LOOP;
  
  RAISE NOTICE 'Successfully inserted % customer readings', readings_count;
END $$;