-- ============================================
-- DISABLE TRIGGER AND INVESTIGATE
-- ============================================
-- Step 1: Disable trigger so users can sign up
-- Step 2: Create safe diagnostic function
-- Step 3: Test what's actually failing

-- ============================================
-- STEP 1: DISABLE TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

RAISE NOTICE '✅ Trigger disabled - users can now sign up';

-- ============================================
-- STEP 2: CHECK WHAT TABLES/COLUMNS ACTUALLY EXIST
-- ============================================

DO $$
DECLARE
  v_col RECORD;
BEGIN
  RAISE NOTICE '========== CHECKING DATABASE SCHEMA ==========';
  
  -- Check user_code_ownership
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_code_ownership') THEN
    RAISE NOTICE '✅ Table: user_code_ownership exists';
    FOR v_col IN 
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_code_ownership'
    LOOP
      RAISE NOTICE '    - %: %', v_col.column_name, v_col.data_type;
    END LOOP;
  ELSE
    RAISE WARNING '❌ Table: user_code_ownership MISSING';
  END IF;
  
  -- Check business_cards
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_cards') THEN
    RAISE NOTICE '✅ Table: business_cards exists';
    FOR v_col IN 
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'business_cards'
    LOOP
      RAISE NOTICE '    - %: %', v_col.column_name, v_col.data_type;
    END LOOP;
  ELSE
    RAISE WARNING '❌ Table: business_cards MISSING';
  END IF;
  
  -- Check user_share_groups
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_share_groups') THEN
    RAISE NOTICE '✅ Table: user_share_groups exists';
    FOR v_col IN 
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_share_groups'
    LOOP
      RAISE NOTICE '    - %: %', v_col.column_name, v_col.data_type;
    END LOOP;
  ELSE
    RAISE WARNING '❌ Table: user_share_groups MISSING';
  END IF;
  
  -- Check user_share_settings
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_share_settings') THEN
    RAISE NOTICE '✅ Table: user_share_settings exists';
    FOR v_col IN 
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_share_settings'
    LOOP
      RAISE NOTICE '    - %: %', v_col.column_name, v_col.data_type;
    END LOOP;
  ELSE
    RAISE WARNING '❌ Table: user_share_settings MISSING';
  END IF;
  
  RAISE NOTICE '=============================================';
END $$;

-- ============================================
-- STEP 3: CHECK CONSTRAINTS ON business_cards
-- ============================================

DO $$
DECLARE
  v_constraint RECORD;
BEGIN
  RAISE NOTICE '========== BUSINESS_CARDS CONSTRAINTS ==========';
  
  FOR v_constraint IN
    SELECT 
      conname as constraint_name,
      contype as constraint_type,
      pg_get_constraintdef(oid) as definition
    FROM pg_constraint
    WHERE conrelid = 'business_cards'::regclass
  LOOP
    RAISE NOTICE '%: % - %', 
      v_constraint.constraint_type,
      v_constraint.constraint_name,
      v_constraint.definition;
  END LOOP;
  
  RAISE NOTICE '===============================================';
END $$;

-- ============================================
-- STEP 4: CHECK RLS POLICIES
-- ============================================

DO $$
DECLARE
  v_policy RECORD;
BEGIN
  RAISE NOTICE '========== RLS POLICIES ==========';
  
  FOR v_policy IN
    SELECT 
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE tablename IN ('user_code_ownership', 'business_cards', 'user_share_groups', 'user_share_settings')
    ORDER BY tablename, policyname
  LOOP
    RAISE NOTICE 'Table: % | Policy: % | Command: %', 
      v_policy.tablename,
      v_policy.policyname,
      v_policy.cmd;
  END LOOP;
  
  RAISE NOTICE '==================================';
END $$;

-- ============================================
-- STEP 5: TEST FUNCTION (Manual Test)
-- ============================================

-- Create a test function that we can run manually to see what fails
CREATE OR REPLACE FUNCTION public.test_user_initialization(p_test_user_id UUID)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_code TEXT;
  v_result TEXT := '';
BEGIN
  v_result := v_result || 'Starting test for user: ' || p_test_user_id || E'\n';
  
  -- Test 1: Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_test_user_id) THEN
    RETURN v_result || 'ERROR: User does not exist in auth.users';
  END IF;
  v_result := v_result || '✅ User exists in auth.users' || E'\n';
  
  -- Test 2: Try to generate user code
  BEGIN
    v_user_code := substr('TEST' || substr(md5(random()::text), 1, 2), 1, 6);
    v_result := v_result || '✅ Generated test code: ' || v_user_code || E'\n';
  EXCEPTION WHEN OTHERS THEN
    RETURN v_result || 'ERROR generating code: ' || SQLERRM;
  END;
  
  -- Test 3: Try to insert user_code_ownership
  BEGIN
    INSERT INTO user_code_ownership (user_id, user_code)
    VALUES (p_test_user_id, v_user_code);
    v_result := v_result || '✅ Inserted user_code_ownership' || E'\n';
  EXCEPTION WHEN OTHERS THEN
    v_result := v_result || 'ERROR inserting user_code_ownership: ' || SQLERRM || E'\n';
    ROLLBACK;
  END;
  
  -- Test 4: Try to insert business_cards
  BEGIN
    INSERT INTO business_cards (
      user_id,
      user_code,
      personal,
      contact,
      profile,
      "socialMessaging",
      "socialChannels",
      portfolio,
      "customLabels"
    )
    VALUES (
      p_test_user_id,
      v_user_code,
      '{"name":"","title":"","businessName":"","bio":"","profileImage":null}'::jsonb,
      '{"phone":"","email":"","address":""}'::jsonb,
      '{"about":"","serviceAreas":"","specialties":"","experience":"","languages":"","certifications":""}'::jsonb,
      '{"whatsapp":"","telegram":"","messenger":"","zalo":"","kakao":"","discord":"","wechat":""}'::jsonb,
      '{"facebook":"","linkedin":"","twitter":"","youtube":"","tiktok":""}'::jsonb,
      '[]'::jsonb,
      '{}'::jsonb
    );
    v_result := v_result || '✅ Inserted business_cards' || E'\n';
  EXCEPTION WHEN OTHERS THEN
    v_result := v_result || 'ERROR inserting business_cards: ' || SQLERRM || E'\n';
    ROLLBACK;
  END;
  
  -- Test 5: Try to insert share groups
  BEGIN
    INSERT INTO user_share_groups (id, user_id, user_code, label, description, share_code, icon, color, is_default, display_order)
    VALUES
      (p_test_user_id::text || '_public', p_test_user_id, v_user_code, 'Public', 'Test', upper(substr(md5(random()::text), 1, 6)), 'Users', 'blue', true, 1);
    v_result := v_result || '✅ Inserted user_share_groups' || E'\n';
  EXCEPTION WHEN OTHERS THEN
    v_result := v_result || 'ERROR inserting user_share_groups: ' || SQLERRM || E'\n';
    ROLLBACK;
  END;
  
  -- Test 6: Try to insert share settings
  BEGIN
    INSERT INTO user_share_settings (user_id, user_code, group_id, visible_fields)
    VALUES (p_test_user_id, v_user_code, p_test_user_id::text || '_public', '[]'::jsonb);
    v_result := v_result || '✅ Inserted user_share_settings' || E'\n';
  EXCEPTION WHEN OTHERS THEN
    v_result := v_result || 'ERROR inserting user_share_settings: ' || SQLERRM || E'\n';
    ROLLBACK;
  END;
  
  -- Cleanup test data
  BEGIN
    DELETE FROM user_share_settings WHERE user_id = p_test_user_id;
    DELETE FROM user_share_groups WHERE user_id = p_test_user_id;
    DELETE FROM business_cards WHERE user_id = p_test_user_id;
    DELETE FROM user_code_ownership WHERE user_id = p_test_user_id;
    v_result := v_result || '✅ Cleaned up test data' || E'\n';
  EXCEPTION WHEN OTHERS THEN
    v_result := v_result || 'Warning: Could not clean up: ' || SQLERRM || E'\n';
  END;
  
  RETURN v_result || E'\n' || '========== TEST COMPLETE ==========';
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION public.test_user_initialization(UUID) OWNER TO postgres;

-- ============================================
-- USAGE INSTRUCTIONS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '=============================================';
  RAISE NOTICE 'TRIGGER DISABLED - Users can now sign up!';
  RAISE NOTICE '=============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'To diagnose what was failing, run:';
  RAISE NOTICE '';
  RAISE NOTICE '  SELECT test_user_initialization(''user-uuid-here'');';
  RAISE NOTICE '';
  RAISE NOTICE 'Replace user-uuid-here with an actual user ID from auth.users';
  RAISE NOTICE '';
  RAISE NOTICE 'To get a user ID:';
  RAISE NOTICE '  SELECT id FROM auth.users LIMIT 1;';
  RAISE NOTICE '';
  RAISE NOTICE '=============================================';
END $$;
