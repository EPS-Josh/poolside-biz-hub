-- Add leading zeros to single-digit numbers at the beginning of storage location names
UPDATE storage_locations
SET name = regexp_replace(name, '(^|\s)(\d)(\s|$)', '\10\2\3', 'g')
WHERE name ~ '(^|\s)\d(\s|$)';