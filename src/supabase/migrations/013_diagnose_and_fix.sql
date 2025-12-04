-- ============================================
-- DIAGNOSE AND FIX AUTO-INITIALIZATION
-- ============================================

-- ============================================
-- STEP 1: Check what exists
-- ============================================

DO $$
DECLARE
  v_trigger_exists BOOLEAN;
  v_function_exists BOOLEAN;
  v_gen_code_exists BOOLEAN;
  v_gen_share_exists BOOLEAN;
  v_business_cards_exists BOOLEAN;
BEGIN
  -- Check trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) INTO v_trigger_exists;
  
  -- Check functions
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user'
  ) INTO v_function_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'generate_user_code'
  ) INTO v_gen_code_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'generate_share_code'
  ) INTO v_gen_share_exists;
  
  -- Check table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'business_cards'
  ) INTO v_business_cards_exists;
  
  RAISE NOTICE '========== DIAGNOSTIC RESULTS ==========';
  RAISE NOTICE 'Trigger exists: %', v_trigger_exists;
  RAISE NOTICE 'Function handle_new_user exists: %', v_function_exists;
  RAISE NOTICE 'Function generate_user_code exists: %', v_gen_code_exists;
  RAISE NOTICE 'Function generate_share_code exists: %', v_gen_share_exists;
  RAISE NOTICE 'Table business_cards exists: %', v_business_cards_exists;
  RAISE NOTICE '======================================';
END $$;

-- ============================================
-- STEP 2: Show business_cards columns
-- ============================================

DO $$
DECLARE
  v_column RECORD;
BEGIN
  RAISE NOTICE '========== BUSINESS_CARDS COLUMNS ==========';
  FOR v_column IN 
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'business_cards' 
    AND table_schema = 'public'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '  - % (%)', v_column.column_name, v_column.data_type;
  END LOOP;
  RAISE NOTICE '==========================================';
END $$;

-- ============================================
-- STEP 3: Ensure all helper functions exist
-- ============================================

-- Generate user code
CREATE OR REPLACE FUNCTION public.generate_user_code()
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(characters, floor(random() * length(characters) + 1)::int, 1);
    END LOOP;
    
    IF NOT EXISTS (SELECT 1 FROM public.user_code_ownership WHERE user_code = result) THEN
      RETURN result;
    END IF;
    
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique user code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Ensure it's owned by postgres
ALTER FUNCTION public.generate_user_code() OWNER TO postgres;

-- Generate share code
CREATE OR REPLACE FUNCTION public.generate_share_code()
RETURNS TEXT AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION public.generate_share_code() OWNER TO postgres;

-- ============================================
-- STEP 4: Drop and recreate main function
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create function with explicit error messages
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_code TEXT;
  v_group_id_public TEXT;
  v_group_id_private TEXT;
  v_group_id_business TEXT;
  v_group_id_personal TEXT;
  v_share_code_public TEXT;
  v_share_code_private TEXT;
  v_share_code_business TEXT;
  v_share_code_personal TEXT;
BEGIN
  -- Skip if already initialized (idempotent)
  IF EXISTS (SELECT 1 FROM user_code_ownership WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Step 1: Generate user code
  v_user_code := public.generate_user_code();
  
  -- Step 2: Generate group IDs (must be globally unique)
  v_group_id_public := NEW.id::text || '_public';
  v_group_id_private := NEW.id::text || '_private';
  v_group_id_business := NEW.id::text || '_business';
  v_group_id_personal := NEW.id::text || '_personal';
  
  -- Step 3: Generate share codes
  v_share_code_public := upper(substr(md5(random()::text || NEW.id::text || 'pub'), 1, 6));
  v_share_code_private := upper(substr(md5(random()::text || NEW.id::text || 'prv'), 1, 6));
  v_share_code_business := upper(substr(md5(random()::text || NEW.id::text || 'biz'), 1, 6));
  v_share_code_personal := upper(substr(md5(random()::text || NEW.id::text || 'per'), 1, 6));

  -- Step 4: Create user_code_ownership (CRITICAL - must succeed)
  INSERT INTO user_code_ownership (user_id, user_code)
  VALUES (NEW.id, v_user_code);

  -- Step 5: Create business_cards
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
    NEW.id,
    v_user_code,
    '{"name":"","title":"","businessName":"","bio":"","profileImage":null}'::jsonb,
    '{"phone":"","email":"","address":""}'::jsonb,
    '{"about":"","serviceAreas":"","specialties":"","experience":"","languages":"","certifications":""}'::jsonb,
    '{"whatsapp":"","telegram":"","messenger":"","zalo":"","kakao":"","discord":"","wechat":""}'::jsonb,
    '{"facebook":"","linkedin":"","twitter":"","youtube":"","tiktok":""}'::jsonb,
    '[]'::jsonb,
    '{}'::jsonb
  );

  -- Step 6: Create share groups
  INSERT INTO user_share_groups (id, user_id, user_code, label, description, share_code, icon, color, is_default, display_order)
  VALUES
    (v_group_id_public, NEW.id, v_user_code, 'Public', 'Anyone with your public link', v_share_code_public, 'Users', 'blue', true, 1),
    (v_group_id_private, NEW.id, v_user_code, 'Private', 'Trusted contacts only', v_share_code_private, 'Shield', 'purple', true, 2),
    (v_group_id_business, NEW.id, v_user_code, 'Business', 'Professional contacts', v_share_code_business, 'Briefcase', 'green', true, 3),
    (v_group_id_personal, NEW.id, v_user_code, 'Personal', 'Close friends & family', v_share_code_personal, 'Heart', 'pink', true, 4);

  -- Step 7: Create share settings
  INSERT INTO user_share_settings (user_id, user_code, group_id, visible_fields)
  VALUES
    (NEW.id, v_user_code, v_group_id_public, '["personal.name","personal.title","personal.profileImage","contact.phone","contact.email"]'::jsonb),
    (NEW.id, v_user_code, v_group_id_private, '["personal.name","personal.title","personal.bio","personal.businessName","personal.profileImage","contact.phone","contact.email","contact.address","profile.about"]'::jsonb),
    (NEW.id, v_user_code, v_group_id_business, '["personal.name","personal.title","personal.businessName","personal.profileImage","contact.phone","contact.email","profile.about","profile.experience"]'::jsonb),
    (NEW.id, v_user_code, v_group_id_personal, '[]'::jsonb);

  RETURN NEW;
  
END;
$$ LANGUAGE plpgsql;

-- Set owner to postgres for RLS bypass
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- ============================================
-- STEP 5: Create trigger
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 6: Verification
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ Auto-initialization setup complete';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Test by creating a new user';
  RAISE NOTICE 'Check logs for any errors';
  RAISE NOTICE '===========================================';
END $$;

-- ============================================
-- STEP 7: Manual initialization function
-- ============================================

CREATE OR REPLACE FUNCTION public.initialize_user_manual(p_user_id UUID)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_code TEXT;
  v_group_id_public TEXT;
  v_group_id_private TEXT;
  v_group_id_business TEXT;
  v_group_id_personal TEXT;
  v_share_code_public TEXT;
  v_share_code_private TEXT;
  v_share_code_business TEXT;
  v_share_code_personal TEXT;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN 'ERROR: User does not exist';
  END IF;
  
  -- Check if already initialized
  IF EXISTS (SELECT 1 FROM user_code_ownership WHERE user_id = p_user_id) THEN
    RETURN 'User already initialized';
  END IF;

  -- Generate codes
  v_user_code := public.generate_user_code();
  v_group_id_public := p_user_id::text || '_public';
  v_group_id_private := p_user_id::text || '_private';
  v_group_id_business := p_user_id::text || '_business';
  v_group_id_personal := p_user_id::text || '_personal';
  
  v_share_code_public := upper(substr(md5(random()::text || p_user_id::text || 'pub'), 1, 6));
  v_share_code_private := upper(substr(md5(random()::text || p_user_id::text || 'prv'), 1, 6));
  v_share_code_business := upper(substr(md5(random()::text || p_user_id::text || 'biz'), 1, 6));
  v_share_code_personal := upper(substr(md5(random()::text || p_user_id::text || 'per'), 1, 6));

  -- Create all data
  INSERT INTO user_code_ownership (user_id, user_code)
  VALUES (p_user_id, v_user_code);

  INSERT INTO business_cards (user_id, user_code, personal, contact, profile, "socialMessaging", "socialChannels", portfolio, "customLabels")
  VALUES (
    p_user_id, v_user_code,
    '{"name":"","title":"","businessName":"","bio":"","profileImage":null}'::jsonb,
    '{"phone":"","email":"","address":""}'::jsonb,
    '{"about":"","serviceAreas":"","specialties":"","experience":"","languages":"","certifications":""}'::jsonb,
    '{"whatsapp":"","telegram":"","messenger":"","zalo":"","kakao":"","discord":"","wechat":""}'::jsonb,
    '{"facebook":"","linkedin":"","twitter":"","youtube":"","tiktok":""}'::jsonb,
    '[]'::jsonb, '{}'::jsonb
  );

  INSERT INTO user_share_groups (id, user_id, user_code, label, description, share_code, icon, color, is_default, display_order)
  VALUES
    (v_group_id_public, p_user_id, v_user_code, 'Public', 'Anyone with your public link', v_share_code_public, 'Users', 'blue', true, 1),
    (v_group_id_private, p_user_id, v_user_code, 'Private', 'Trusted contacts only', v_share_code_private, 'Shield', 'purple', true, 2),
    (v_group_id_business, p_user_id, v_user_code, 'Business', 'Professional contacts', v_share_code_business, 'Briefcase', 'green', true, 3),
    (v_group_id_personal, p_user_id, v_user_code, 'Personal', 'Close friends & family', v_share_code_personal, 'Heart', 'pink', true, 4);

  INSERT INTO user_share_settings (user_id, user_code, group_id, visible_fields)
  VALUES
    (p_user_id, v_user_code, v_group_id_public, '["personal.name","personal.title","personal.profileImage","contact.phone","contact.email"]'::jsonb),
    (p_user_id, v_user_code, v_group_id_private, '["personal.name","personal.title","personal.bio","personal.businessName","personal.profileImage","contact.phone","contact.email","contact.address","profile.about"]'::jsonb),
    (p_user_id, v_user_code, v_group_id_business, '["personal.name","personal.title","personal.businessName","personal.profileImage","contact.phone","contact.email","profile.about","profile.experience"]'::jsonb),
    (p_user_id, v_user_code, v_group_id_personal, '[]'::jsonb);

  RETURN 'Successfully initialized user ' || p_user_id::text || ' with code: ' || v_user_code;
  
EXCEPTION WHEN OTHERS THEN
  RETURN 'ERROR: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION public.initialize_user_manual(UUID) OWNER TO postgres;

-- ============================================
-- USAGE INSTRUCTIONS
-- ============================================

-- To initialize a user manually (for users created while trigger was broken):
-- SELECT initialize_user_manual('user-uuid-here');

-- To initialize ALL uninitialized users:
-- SELECT 
--   u.id,
--   u.email,
--   initialize_user_manual(u.id) as result
-- FROM auth.users u
-- LEFT JOIN user_code_ownership uco ON u.id = uco.user_id
-- WHERE uco.user_id IS NULL;
