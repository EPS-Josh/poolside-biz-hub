-- Migrate chlorine readings to new format
-- Single reading goes to total_chlorine_bromine
-- Dual readings: first number = total_chlorine_bromine, second = free_chlorine

DO $$
DECLARE
  record_row RECORD;
  chlorine_value TEXT;
  parts TEXT[];
BEGIN
  -- Process before_readings
  FOR record_row IN 
    SELECT id, before_readings 
    FROM service_records 
    WHERE before_readings ? 'chlorine'
  LOOP
    chlorine_value := record_row.before_readings->>'chlorine';
    
    IF chlorine_value IS NOT NULL AND chlorine_value != '' THEN
      -- Check if it contains a slash (dual reading)
      IF position('/' in chlorine_value) > 0 THEN
        -- Split by slash and trim whitespace
        parts := regexp_split_to_array(trim(chlorine_value), '\s*/\s*');
        
        -- Update with both values
        UPDATE service_records 
        SET before_readings = jsonb_set(
          jsonb_set(
            before_readings - 'chlorine',
            '{total_chlorine_bromine}',
            to_jsonb(trim(parts[1]))
          ),
          '{free_chlorine}',
          to_jsonb(trim(parts[2]))
        )
        WHERE id = record_row.id;
      ELSE
        -- Single reading, goes to total_chlorine_bromine only
        UPDATE service_records 
        SET before_readings = jsonb_set(
          before_readings - 'chlorine',
          '{total_chlorine_bromine}',
          to_jsonb(trim(chlorine_value))
        )
        WHERE id = record_row.id;
      END IF;
    END IF;
  END LOOP;
  
  -- Process after_readings
  FOR record_row IN 
    SELECT id, after_readings 
    FROM service_records 
    WHERE after_readings ? 'chlorine'
  LOOP
    chlorine_value := record_row.after_readings->>'chlorine';
    
    IF chlorine_value IS NOT NULL AND chlorine_value != '' THEN
      -- Check if it contains a slash (dual reading)
      IF position('/' in chlorine_value) > 0 THEN
        -- Split by slash and trim whitespace
        parts := regexp_split_to_array(trim(chlorine_value), '\s*/\s*');
        
        -- Update with both values
        UPDATE service_records 
        SET after_readings = jsonb_set(
          jsonb_set(
            after_readings - 'chlorine',
            '{total_chlorine_bromine}',
            to_jsonb(trim(parts[1]))
          ),
          '{free_chlorine}',
          to_jsonb(trim(parts[2]))
        )
        WHERE id = record_row.id;
      ELSE
        -- Single reading, goes to total_chlorine_bromine only
        UPDATE service_records 
        SET after_readings = jsonb_set(
          after_readings - 'chlorine',
          '{total_chlorine_bromine}',
          to_jsonb(trim(chlorine_value))
        )
        WHERE id = record_row.id;
      END IF;
    END IF;
  END LOOP;
END $$;