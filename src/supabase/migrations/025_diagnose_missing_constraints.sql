-- ============================================
-- DIAGNOSTIC: Find missing unique constraints
-- ============================================
-- ERROR: there is no unique or exclusion constraint matching the ON CONFLICT specification
-- SOLUTION: Find which table is missing the constraint

-- Check user_code_ownership - needs UNIQUE on user_id
DO $$
DECLARE
  has_constraint BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'user_code_ownership'
      AND c.contype IN ('u', 'p') -- unique or primary key
      AND c.conkey = ARRAY[(
        SELECT attnum 
        FROM pg_attribute 
        WHERE attrelid = t.oid 
        AND attname = 'user_id'
      )]
  ) INTO has_constraint;
  
  RAISE NOTICE 'user_code_ownership: UNIQUE(user_id) exists = %', has_constraint;
END $$;

-- Check business_cards - needs UNIQUE on user_id
DO $$
DECLARE
  has_constraint BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'business_cards'
      AND c.contype IN ('u', 'p')
      AND c.conkey = ARRAY[(
        SELECT attnum 
        FROM pg_attribute 
        WHERE attrelid = t.oid 
        AND attname = 'user_id'
      )]
  ) INTO has_constraint;
  
  RAISE NOTICE 'business_cards: UNIQUE(user_id) exists = %', has_constraint;
END $$;

-- Check user_share_groups - needs UNIQUE on id
DO $$
DECLARE
  has_constraint BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'user_share_groups'
      AND c.contype IN ('u', 'p')
      AND c.conkey = ARRAY[(
        SELECT attnum 
        FROM pg_attribute 
        WHERE attrelid = t.oid 
        AND attname = 'id'
      )]
  ) INTO has_constraint;
  
  RAISE NOTICE 'user_share_groups: UNIQUE(id) exists = %', has_constraint;
END $$;

-- Check user_share_settings - needs UNIQUE on (user_code, group_id)
DO $$
DECLARE
  has_constraint BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'user_share_settings'
      AND c.contype IN ('u', 'p')
  ) INTO has_constraint;
  
  RAISE NOTICE 'user_share_settings: has ANY unique constraint = %', has_constraint;
  
  -- Show what constraints exist
  RAISE NOTICE 'user_share_settings constraints:';
  FOR has_constraint IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'user_share_settings'
  LOOP
    RAISE NOTICE '  - %', has_constraint;
  END LOOP;
END $$;

-- List all constraints on each table
SELECT 
  'user_code_ownership constraints' as table_info,
  c.conname as constraint_name,
  c.contype as constraint_type,
  pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.relname = 'user_code_ownership';

SELECT 
  'business_cards constraints' as table_info,
  c.conname as constraint_name,
  c.contype as constraint_type,
  pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.relname = 'business_cards';

SELECT 
  'user_share_groups constraints' as table_info,
  c.conname as constraint_name,
  c.contype as constraint_type,
  pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.relname = 'user_share_groups';

SELECT 
  'user_share_settings constraints' as table_info,
  c.conname as constraint_name,
  c.contype as constraint_type,
  pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.relname = 'user_share_settings';
