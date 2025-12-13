-- ============================================
-- FIX: Add missing unique constraints
-- ============================================
-- ERROR: there is no unique or exclusion constraint matching the ON CONFLICT specification
-- SOLUTION: Add the unique constraints that initialize_user_data expects

-- 1. user_code_ownership needs UNIQUE on user_id
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.user_code_ownership'::regclass 
    AND conname = 'user_code_ownership_user_id_key'
  ) THEN
    ALTER TABLE public.user_code_ownership 
    ADD CONSTRAINT user_code_ownership_user_id_key UNIQUE (user_id);
    RAISE NOTICE '✅ Added UNIQUE constraint on user_code_ownership(user_id)';
  ELSE
    RAISE NOTICE 'ℹ️ UNIQUE constraint on user_code_ownership(user_id) already exists';
  END IF;
END $$;

-- 2. business_cards needs UNIQUE on user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.business_cards'::regclass 
    AND conname = 'business_cards_user_id_key'
  ) THEN
    ALTER TABLE public.business_cards 
    ADD CONSTRAINT business_cards_user_id_key UNIQUE (user_id);
    RAISE NOTICE '✅ Added UNIQUE constraint on business_cards(user_id)';
  ELSE
    RAISE NOTICE 'ℹ️ UNIQUE constraint on business_cards(user_id) already exists';
  END IF;
END $$;

-- 3. user_share_groups should have PRIMARY KEY on id (likely already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.user_share_groups'::regclass 
    AND conname = 'user_share_groups_pkey'
  ) THEN
    ALTER TABLE public.user_share_groups 
    ADD CONSTRAINT user_share_groups_pkey PRIMARY KEY (id);
    RAISE NOTICE '✅ Added PRIMARY KEY on user_share_groups(id)';
  ELSE
    RAISE NOTICE 'ℹ️ PRIMARY KEY on user_share_groups(id) already exists';
  END IF;
END $$;

-- 4. user_share_settings needs UNIQUE on (user_code, group_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.user_share_settings'::regclass 
    AND conname = 'user_share_settings_user_code_group_id_key'
  ) THEN
    ALTER TABLE public.user_share_settings 
    ADD CONSTRAINT user_share_settings_user_code_group_id_key UNIQUE (user_code, group_id);
    RAISE NOTICE '✅ Added UNIQUE constraint on user_share_settings(user_code, group_id)';
  ELSE
    RAISE NOTICE 'ℹ️ UNIQUE constraint on user_share_settings(user_code, group_id) already exists';
  END IF;
END $$;

-- Verify all constraints
DO $$
DECLARE
  missing_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== VERIFICATION ===';
  
  -- Check user_code_ownership
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.user_code_ownership'::regclass 
    AND contype IN ('u', 'p')
    AND array_length(conkey, 1) = 1
    AND conkey[1] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.user_code_ownership'::regclass AND attname = 'user_id')
  ) THEN
    RAISE WARNING '❌ user_code_ownership(user_id) constraint MISSING';
    missing_count := missing_count + 1;
  ELSE
    RAISE NOTICE '✅ user_code_ownership(user_id) constraint exists';
  END IF;
  
  -- Check business_cards
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.business_cards'::regclass 
    AND contype IN ('u', 'p')
    AND array_length(conkey, 1) = 1
    AND conkey[1] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.business_cards'::regclass AND attname = 'user_id')
  ) THEN
    RAISE WARNING '❌ business_cards(user_id) constraint MISSING';
    missing_count := missing_count + 1;
  ELSE
    RAISE NOTICE '✅ business_cards(user_id) constraint exists';
  END IF;
  
  -- Check user_share_groups
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.user_share_groups'::regclass 
    AND contype IN ('u', 'p')
    AND array_length(conkey, 1) = 1
    AND conkey[1] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.user_share_groups'::regclass AND attname = 'id')
  ) THEN
    RAISE WARNING '❌ user_share_groups(id) constraint MISSING';
    missing_count := missing_count + 1;
  ELSE
    RAISE NOTICE '✅ user_share_groups(id) constraint exists';
  END IF;
  
  -- Check user_share_settings
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.user_share_settings'::regclass 
    AND contype IN ('u', 'p')
  ) THEN
    RAISE WARNING '❌ user_share_settings constraint MISSING';
    missing_count := missing_count + 1;
  ELSE
    RAISE NOTICE '✅ user_share_settings(user_code, group_id) constraint exists';
  END IF;
  
  RAISE NOTICE '';
  IF missing_count = 0 THEN
    RAISE NOTICE '🎉 All constraints exist! initialize_user_data() should work now';
  ELSE
    RAISE WARNING '⚠️ % constraint(s) still missing!', missing_count;
  END IF;
END $$;
