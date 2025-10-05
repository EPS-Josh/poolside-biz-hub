-- Insert 45 weekly service records for Joshua Wilkinson starting 1/1/2025
-- Customer ID: e85be1b7-ade8-4995-91da-db97dd20b159
-- User ID: a50ba583-3bd8-4870-a6c5-bfab7781580b

INSERT INTO public.service_records (
  customer_id,
  user_id,
  service_date,
  service_time,
  service_type,
  technician_name,
  work_performed,
  chemicals_added,
  before_readings,
  after_readings,
  service_status,
  invoicing_status
) VALUES
-- Week 1: 2025-01-01
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-01-01', '09:00:00', 'Weekly Maintenance', 'Tech A', 'Skimmed pool, vacuumed, brushed walls', 'Added 2 lbs chlorine', '{"ph": "7.8", "chlorine": "1.2", "alkalinity": "90", "cyanuricAcid": "45", "totalHardness": "280"}'::jsonb, '{"ph": "7.4", "chlorine": "3.0", "alkalinity": "95", "cyanuricAcid": "45", "totalHardness": "280"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 2: 2025-01-08
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-01-08', '09:15:00', 'Weekly Maintenance', 'Tech B', 'Skimmed pool, vacuumed, checked equipment', 'Added 1.5 lbs chlorine, 2 oz algaecide', '{"ph": "7.6", "chlorine": "2.1", "alkalinity": "98", "cyanuricAcid": "47", "totalHardness": "285"}'::jsonb, '{"ph": "7.5", "chlorine": "3.5", "alkalinity": "100", "cyanuricAcid": "47", "totalHardness": "285"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 3: 2025-01-15
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-01-15', '10:00:00', 'Weekly Maintenance', 'Tech A', 'Skimmed pool, brushed walls, emptied baskets', 'Added 2 lbs chlorine', '{"ph": "7.4", "chlorine": "2.8", "alkalinity": "102", "cyanuricAcid": "48", "totalHardness": "290"}'::jsonb, '{"ph": "7.4", "chlorine": "4.0", "alkalinity": "105", "cyanuricAcid": "48", "totalHardness": "290"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 4: 2025-01-22
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-01-22', '09:30:00', 'Weekly Maintenance', 'Tech C', 'Skimmed pool, vacuumed, cleaned filter', 'Added 1.5 lbs chlorine, pH decreaser 1 lb', '{"ph": "7.9", "chlorine": "2.5", "alkalinity": "108", "cyanuricAcid": "50", "totalHardness": "295"}'::jsonb, '{"ph": "7.5", "chlorine": "3.8", "alkalinity": "105", "cyanuricAcid": "50", "totalHardness": "295"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 5: 2025-01-29
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-01-29', '10:30:00', 'Weekly Maintenance', 'Tech B', 'Skimmed pool, brushed steps, checked chemicals', 'Added 2 lbs chlorine', '{"ph": "7.5", "chlorine": "2.3", "alkalinity": "106", "cyanuricAcid": "52", "totalHardness": "300"}'::jsonb, '{"ph": "7.5", "chlorine": "3.5", "alkalinity": "108", "cyanuricAcid": "52", "totalHardness": "300"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 6: 2025-02-05
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-02-05', '09:00:00', 'Weekly Maintenance', 'Tech A', 'Skimmed pool, vacuumed, emptied baskets', 'Added 1.5 lbs chlorine, 3 oz algaecide', '{"ph": "7.6", "chlorine": "1.8", "alkalinity": "110", "cyanuricAcid": "53", "totalHardness": "305"}'::jsonb, '{"ph": "7.6", "chlorine": "3.2", "alkalinity": "112", "cyanuricAcid": "53", "totalHardness": "305"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 7: 2025-02-12
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-02-12', '09:45:00', 'Weekly Maintenance', 'Tech C', 'Skimmed pool, brushed walls, checked pump', 'Added 2 lbs chlorine', '{"ph": "7.7", "chlorine": "2.0", "alkalinity": "115", "cyanuricAcid": "55", "totalHardness": "310"}'::jsonb, '{"ph": "7.6", "chlorine": "3.8", "alkalinity": "115", "cyanuricAcid": "55", "totalHardness": "310"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 8: 2025-02-19
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-02-19', '10:15:00', 'Weekly Maintenance', 'Tech B', 'Skimmed pool, vacuumed, cleaned skimmer', 'Added 1.5 lbs chlorine, pH increaser 1 lb', '{"ph": "7.2", "chlorine": "2.4", "alkalinity": "88", "cyanuricAcid": "56", "totalHardness": "315"}'::jsonb, '{"ph": "7.5", "chlorine": "3.5", "alkalinity": "95", "cyanuricAcid": "56", "totalHardness": "315"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 9: 2025-02-26
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-02-26', '09:30:00', 'Weekly Maintenance', 'Tech A', 'Skimmed pool, brushed tiles, emptied baskets', 'Added 2 lbs chlorine', '{"ph": "7.5", "chlorine": "2.7", "alkalinity": "98", "cyanuricAcid": "58", "totalHardness": "318"}'::jsonb, '{"ph": "7.5", "chlorine": "4.0", "alkalinity": "100", "cyanuricAcid": "58", "totalHardness": "318"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 10: 2025-03-05
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-03-05', '10:00:00', 'Weekly Maintenance', 'Tech C', 'Skimmed pool, vacuumed, checked filter pressure', 'Added 1.5 lbs chlorine, 2 oz algaecide', '{"ph": "7.4", "chlorine": "2.2", "alkalinity": "102", "cyanuricAcid": "60", "totalHardness": "320"}'::jsonb, '{"ph": "7.4", "chlorine": "3.3", "alkalinity": "105", "cyanuricAcid": "60", "totalHardness": "320"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 11: 2025-03-12
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-03-12', '09:15:00', 'Weekly Maintenance', 'Tech B', 'Skimmed pool, brushed walls, cleaned pump basket', 'Added 2 lbs chlorine', '{"ph": "7.6", "chlorine": "1.9", "alkalinity": "107", "cyanuricAcid": "62", "totalHardness": "325"}'::jsonb, '{"ph": "7.6", "chlorine": "3.7", "alkalinity": "110", "cyanuricAcid": "62", "totalHardness": "325"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 12: 2025-03-19
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-03-19', '09:45:00', 'Weekly Maintenance', 'Tech A', 'Skimmed pool, vacuumed, brushed steps', 'Added 1.5 lbs chlorine, pH decreaser 1 lb', '{"ph": "7.8", "chlorine": "2.5", "alkalinity": "112", "cyanuricAcid": "63", "totalHardness": "328"}'::jsonb, '{"ph": "7.5", "chlorine": "3.6", "alkalinity": "110", "cyanuricAcid": "63", "totalHardness": "328"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 13: 2025-03-26
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-03-26', '10:30:00', 'Weekly Maintenance', 'Tech C', 'Skimmed pool, brushed walls, emptied baskets', 'Added 2 lbs chlorine, 3 oz algaecide', '{"ph": "7.5", "chlorine": "2.1", "alkalinity": "108", "cyanuricAcid": "65", "totalHardness": "330"}'::jsonb, '{"ph": "7.5", "chlorine": "3.9", "alkalinity": "110", "cyanuricAcid": "65", "totalHardness": "330"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 14: 2025-04-02
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-04-02', '09:00:00', 'Weekly Maintenance', 'Tech B', 'Skimmed pool, vacuumed, checked equipment', 'Added 1.5 lbs chlorine', '{"ph": "7.4", "chlorine": "2.6", "alkalinity": "105", "cyanuricAcid": "66", "totalHardness": "332"}'::jsonb, '{"ph": "7.4", "chlorine": "3.4", "alkalinity": "108", "cyanuricAcid": "66", "totalHardness": "332"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 15: 2025-04-09
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-04-09', '09:30:00', 'Weekly Maintenance', 'Tech A', 'Skimmed pool, brushed tiles, cleaned filter', 'Added 2 lbs chlorine', '{"ph": "7.7", "chlorine": "2.0", "alkalinity": "110", "cyanuricAcid": "68", "totalHardness": "335"}'::jsonb, '{"ph": "7.6", "chlorine": "3.8", "alkalinity": "112", "cyanuricAcid": "68", "totalHardness": "335"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 16: 2025-04-16
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-04-16', '10:00:00', 'Weekly Maintenance', 'Tech C', 'Skimmed pool, vacuumed, emptied baskets', 'Added 1.5 lbs chlorine, 2 oz algaecide', '{"ph": "7.5", "chlorine": "2.3", "alkalinity": "114", "cyanuricAcid": "70", "totalHardness": "338"}'::jsonb, '{"ph": "7.5", "chlorine": "3.5", "alkalinity": "115", "cyanuricAcid": "70", "totalHardness": "338"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 17: 2025-04-23
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-04-23', '09:15:00', 'Weekly Maintenance', 'Tech B', 'Skimmed pool, brushed walls, checked pump', 'Added 2 lbs chlorine, pH increaser 1 lb', '{"ph": "7.1", "chlorine": "2.8", "alkalinity": "86", "cyanuricAcid": "71", "totalHardness": "340"}'::jsonb, '{"ph": "7.4", "chlorine": "4.0", "alkalinity": "92", "cyanuricAcid": "71", "totalHardness": "340"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 18: 2025-04-30
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-04-30', '09:45:00', 'Weekly Maintenance', 'Tech A', 'Skimmed pool, vacuumed, brushed steps', 'Added 1.5 lbs chlorine', '{"ph": "7.4", "chlorine": "2.4", "alkalinity": "96", "cyanuricAcid": "72", "totalHardness": "342"}'::jsonb, '{"ph": "7.4", "chlorine": "3.3", "alkalinity": "98", "cyanuricAcid": "72", "totalHardness": "342"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 19: 2025-05-07
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-05-07', '10:15:00', 'Weekly Maintenance', 'Tech C', 'Skimmed pool, brushed walls, emptied baskets', 'Added 2 lbs chlorine, 3 oz algaecide', '{"ph": "7.6", "chlorine": "1.8", "alkalinity": "100", "cyanuricAcid": "74", "totalHardness": "345"}'::jsonb, '{"ph": "7.6", "chlorine": "3.7", "alkalinity": "103", "cyanuricAcid": "74", "totalHardness": "345"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 20: 2025-05-14
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-05-14', '09:30:00', 'Weekly Maintenance', 'Tech B', 'Skimmed pool, vacuumed, checked filter pressure', 'Added 1.5 lbs chlorine', '{"ph": "7.5", "chlorine": "2.2", "alkalinity": "105", "cyanuricAcid": "75", "totalHardness": "348"}'::jsonb, '{"ph": "7.5", "chlorine": "3.4", "alkalinity": "107", "cyanuricAcid": "75", "totalHardness": "348"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 21: 2025-05-21
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-05-21', '10:00:00', 'Weekly Maintenance', 'Tech A', 'Skimmed pool, brushed tiles, cleaned pump basket', 'Added 2 lbs chlorine, pH decreaser 1 lb', '{"ph": "7.9", "chlorine": "2.5", "alkalinity": "110", "cyanuricAcid": "77", "totalHardness": "350"}'::jsonb, '{"ph": "7.5", "chlorine": "3.9", "alkalinity": "108", "cyanuricAcid": "77", "totalHardness": "350"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 22: 2025-05-28
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-05-28', '09:00:00', 'Weekly Maintenance', 'Tech C', 'Skimmed pool, vacuumed, brushed walls', 'Added 1.5 lbs chlorine, 2 oz algaecide', '{"ph": "7.5", "chlorine": "2.1", "alkalinity": "106", "cyanuricAcid": "78", "totalHardness": "352"}'::jsonb, '{"ph": "7.5", "chlorine": "3.5", "alkalinity": "108", "cyanuricAcid": "78", "totalHardness": "352"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 23: 2025-06-04
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-06-04', '09:30:00', 'Weekly Maintenance', 'Tech B', 'Skimmed pool, brushed steps, emptied baskets', 'Added 2 lbs chlorine', '{"ph": "7.4", "chlorine": "2.6", "alkalinity": "104", "cyanuricAcid": "80", "totalHardness": "355"}'::jsonb, '{"ph": "7.4", "chlorine": "4.0", "alkalinity": "106", "cyanuricAcid": "80", "totalHardness": "355"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 24: 2025-06-11
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-06-11', '10:00:00', 'Weekly Maintenance', 'Tech A', 'Skimmed pool, vacuumed, checked equipment', 'Added 1.5 lbs chlorine, 3 oz algaecide', '{"ph": "7.6", "chlorine": "1.9", "alkalinity": "108", "cyanuricAcid": "81", "totalHardness": "358"}'::jsonb, '{"ph": "7.6", "chlorine": "3.6", "alkalinity": "110", "cyanuricAcid": "81", "totalHardness": "358"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 25: 2025-06-18
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-06-18', '09:15:00', 'Weekly Maintenance', 'Tech C', 'Skimmed pool, brushed walls, cleaned filter', 'Added 2 lbs chlorine', '{"ph": "7.7", "chlorine": "2.3", "alkalinity": "112", "cyanuricAcid": "83", "totalHardness": "360"}'::jsonb, '{"ph": "7.6", "chlorine": "3.8", "alkalinity": "114", "cyanuricAcid": "83", "totalHardness": "360"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 26: 2025-06-25
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-06-25', '09:45:00', 'Weekly Maintenance', 'Tech B', 'Skimmed pool, vacuumed, emptied baskets', 'Added 1.5 lbs chlorine, pH increaser 1 lb', '{"ph": "7.2", "chlorine": "2.7", "alkalinity": "88", "cyanuricAcid": "84", "totalHardness": "362"}'::jsonb, '{"ph": "7.5", "chlorine": "3.5", "alkalinity": "95", "cyanuricAcid": "84", "totalHardness": "362"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 27: 2025-07-02
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-07-02', '10:15:00', 'Weekly Maintenance', 'Tech A', 'Skimmed pool, brushed tiles, checked pump', 'Added 2 lbs chlorine, 2 oz algaecide', '{"ph": "7.5", "chlorine": "2.0", "alkalinity": "98", "cyanuricAcid": "85", "totalHardness": "365"}'::jsonb, '{"ph": "7.5", "chlorine": "3.9", "alkalinity": "100", "cyanuricAcid": "85", "totalHardness": "365"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 28: 2025-07-09
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-07-09', '09:30:00', 'Weekly Maintenance', 'Tech C', 'Skimmed pool, vacuumed, brushed steps', 'Added 1.5 lbs chlorine', '{"ph": "7.4", "chlorine": "2.4", "alkalinity": "102", "cyanuricAcid": "87", "totalHardness": "368"}'::jsonb, '{"ph": "7.4", "chlorine": "3.3", "alkalinity": "105", "cyanuricAcid": "87", "totalHardness": "368"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 29: 2025-07-16
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-07-16', '10:00:00', 'Weekly Maintenance', 'Tech B', 'Skimmed pool, brushed walls, emptied baskets', 'Added 2 lbs chlorine, 3 oz algaecide', '{"ph": "7.6", "chlorine": "1.8", "alkalinity": "107", "cyanuricAcid": "88", "totalHardness": "370"}'::jsonb, '{"ph": "7.6", "chlorine": "3.7", "alkalinity": "110", "cyanuricAcid": "88", "totalHardness": "370"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 30: 2025-07-23
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-07-23', '09:00:00', 'Weekly Maintenance', 'Tech A', 'Skimmed pool, vacuumed, checked filter pressure', 'Added 1.5 lbs chlorine, pH decreaser 1 lb', '{"ph": "7.8", "chlorine": "2.2", "alkalinity": "112", "cyanuricAcid": "90", "totalHardness": "372"}'::jsonb, '{"ph": "7.5", "chlorine": "3.4", "alkalinity": "110", "cyanuricAcid": "90", "totalHardness": "372"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 31: 2025-07-30
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-07-30', '09:30:00', 'Weekly Maintenance', 'Tech C', 'Skimmed pool, brushed tiles, cleaned pump basket', 'Added 2 lbs chlorine', '{"ph": "7.5", "chlorine": "2.5", "alkalinity": "108", "cyanuricAcid": "91", "totalHardness": "375"}'::jsonb, '{"ph": "7.5", "chlorine": "3.8", "alkalinity": "110", "cyanuricAcid": "91", "totalHardness": "375"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 32: 2025-08-06
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-08-06', '10:00:00', 'Weekly Maintenance', 'Tech B', 'Skimmed pool, vacuumed, brushed walls', 'Added 1.5 lbs chlorine, 2 oz algaecide', '{"ph": "7.4", "chlorine": "2.1", "alkalinity": "105", "cyanuricAcid": "92", "totalHardness": "378"}'::jsonb, '{"ph": "7.4", "chlorine": "3.5", "alkalinity": "108", "cyanuricAcid": "92", "totalHardness": "378"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 33: 2025-08-13
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-08-13', '09:15:00', 'Weekly Maintenance', 'Tech A', 'Skimmed pool, brushed steps, emptied baskets', 'Added 2 lbs chlorine', '{"ph": "7.6", "chlorine": "2.6", "alkalinity": "110", "cyanuricAcid": "94", "totalHardness": "380"}'::jsonb, '{"ph": "7.6", "chlorine": "4.0", "alkalinity": "112", "cyanuricAcid": "94", "totalHardness": "380"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 34: 2025-08-20
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-08-20', '09:45:00', 'Weekly Maintenance', 'Tech C', 'Skimmed pool, vacuumed, checked equipment', 'Added 1.5 lbs chlorine, 3 oz algaecide', '{"ph": "7.5", "chlorine": "1.9", "alkalinity": "106", "cyanuricAcid": "95", "totalHardness": "382"}'::jsonb, '{"ph": "7.5", "chlorine": "3.6", "alkalinity": "108", "cyanuricAcid": "95", "totalHardness": "382"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 35: 2025-08-27
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-08-27', '10:15:00', 'Weekly Maintenance', 'Tech B', 'Skimmed pool, brushed walls, cleaned filter', 'Added 2 lbs chlorine, pH increaser 1 lb', '{"ph": "7.1", "chlorine": "2.3", "alkalinity": "84", "cyanuricAcid": "96", "totalHardness": "385"}'::jsonb, '{"ph": "7.4", "chlorine": "3.8", "alkalinity": "90", "cyanuricAcid": "96", "totalHardness": "385"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 36: 2025-09-03
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-09-03', '09:30:00', 'Weekly Maintenance', 'Tech A', 'Skimmed pool, vacuumed, emptied baskets', 'Added 1.5 lbs chlorine', '{"ph": "7.4", "chlorine": "2.7", "alkalinity": "94", "cyanuricAcid": "97", "totalHardness": "388"}'::jsonb, '{"ph": "7.4", "chlorine": "3.5", "alkalinity": "96", "cyanuricAcid": "97", "totalHardness": "388"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 37: 2025-09-10
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-09-10', '10:00:00', 'Weekly Maintenance', 'Tech C', 'Skimmed pool, brushed tiles, checked pump', 'Added 2 lbs chlorine, 2 oz algaecide', '{"ph": "7.6", "chlorine": "2.0", "alkalinity": "98", "cyanuricAcid": "98", "totalHardness": "390"}'::jsonb, '{"ph": "7.6", "chlorine": "3.9", "alkalinity": "100", "cyanuricAcid": "98", "totalHardness": "390"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 38: 2025-09-17
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-09-17', '09:00:00', 'Weekly Maintenance', 'Tech B', 'Skimmed pool, vacuumed, brushed steps', 'Added 1.5 lbs chlorine', '{"ph": "7.5", "chlorine": "2.4", "alkalinity": "102", "cyanuricAcid": "100", "totalHardness": "392"}'::jsonb, '{"ph": "7.5", "chlorine": "3.3", "alkalinity": "105", "cyanuricAcid": "100", "totalHardness": "392"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 39: 2025-09-24
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-09-24', '09:30:00', 'Weekly Maintenance', 'Tech A', 'Skimmed pool, brushed walls, emptied baskets', 'Added 2 lbs chlorine, 3 oz algaecide', '{"ph": "7.7", "chlorine": "1.8", "alkalinity": "107", "cyanuricAcid": "101", "totalHardness": "395"}'::jsonb, '{"ph": "7.6", "chlorine": "3.7", "alkalinity": "110", "cyanuricAcid": "101", "totalHardness": "395"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 40: SKIP 2025-10-01 (not 10/3, but close enough - this would be the 40th week)
-- Week 40 Alternative: 2025-10-08 (adding 2 weeks instead to skip the 10/3 area)
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-10-08', '10:00:00', 'Weekly Maintenance', 'Tech C', 'Skimmed pool, vacuumed, checked filter pressure', 'Added 1.5 lbs chlorine, pH decreaser 1 lb', '{"ph": "7.8", "chlorine": "2.2", "alkalinity": "112", "cyanuricAcid": "102", "totalHardness": "398"}'::jsonb, '{"ph": "7.5", "chlorine": "3.4", "alkalinity": "110", "cyanuricAcid": "102", "totalHardness": "398"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 41: 2025-10-15
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-10-15', '09:15:00', 'Weekly Maintenance', 'Tech B', 'Skimmed pool, brushed tiles, cleaned pump basket', 'Added 2 lbs chlorine', '{"ph": "7.5", "chlorine": "2.5", "alkalinity": "108", "cyanuricAcid": "103", "totalHardness": "400"}'::jsonb, '{"ph": "7.5", "chlorine": "3.8", "alkalinity": "110", "cyanuricAcid": "103", "totalHardness": "400"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 42: 2025-10-22
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-10-22', '09:45:00', 'Weekly Maintenance', 'Tech A', 'Skimmed pool, vacuumed, brushed walls', 'Added 1.5 lbs chlorine, 2 oz algaecide', '{"ph": "7.4", "chlorine": "2.1", "alkalinity": "105", "cyanuricAcid": "104", "totalHardness": "402"}'::jsonb, '{"ph": "7.4", "chlorine": "3.5", "alkalinity": "108", "cyanuricAcid": "104", "totalHardness": "402"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 43: 2025-10-29
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-10-29', '10:15:00', 'Weekly Maintenance', 'Tech C', 'Skimmed pool, brushed steps, emptied baskets', 'Added 2 lbs chlorine', '{"ph": "7.6", "chlorine": "2.6", "alkalinity": "110", "cyanuricAcid": "105", "totalHardness": "405"}'::jsonb, '{"ph": "7.6", "chlorine": "4.0", "alkalinity": "112", "cyanuricAcid": "105", "totalHardness": "405"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 44: 2025-11-05
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-11-05', '09:30:00', 'Weekly Maintenance', 'Tech B', 'Skimmed pool, vacuumed, checked equipment', 'Added 1.5 lbs chlorine, 3 oz algaecide', '{"ph": "7.5", "chlorine": "1.9", "alkalinity": "106", "cyanuricAcid": "106", "totalHardness": "408"}'::jsonb, '{"ph": "7.5", "chlorine": "3.6", "alkalinity": "108", "cyanuricAcid": "106", "totalHardness": "408"}'::jsonb, 'completed', 'ready_for_qb'),

-- Week 45: 2025-11-12
('e85be1b7-ade8-4995-91da-db97dd20b159', 'a50ba583-3bd8-4870-a6c5-bfab7781580b', '2025-11-12', '10:00:00', 'Weekly Maintenance', 'Tech A', 'Skimmed pool, brushed walls, cleaned filter', 'Added 2 lbs chlorine, pH increaser 1 lb', '{"ph": "7.2", "chlorine": "2.3", "alkalinity": "86", "cyanuricAcid": "107", "totalHardness": "410"}'::jsonb, '{"ph": "7.5", "chlorine": "3.8", "alkalinity": "92", "cyanuricAcid": "107", "totalHardness": "410"}'::jsonb, 'completed', 'ready_for_qb');