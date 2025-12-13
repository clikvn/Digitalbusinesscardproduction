-- Check what constraints exist on each table
SELECT 
  'user_code_ownership' as table_name,
  c.conname as constraint_name,
  c.contype as type,
  pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.relname = 'user_code_ownership'
ORDER BY c.conname;

SELECT 
  'business_cards' as table_name,
  c.conname as constraint_name,
  c.contype as type,
  pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.relname = 'business_cards'
ORDER BY c.conname;

SELECT 
  'user_share_groups' as table_name,
  c.conname as constraint_name,
  c.contype as type,
  pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.relname = 'user_share_groups'
ORDER BY c.conname;

SELECT 
  'user_share_settings' as table_name,
  c.conname as constraint_name,
  c.contype as type,
  pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.relname = 'user_share_settings'
ORDER BY c.conname;
