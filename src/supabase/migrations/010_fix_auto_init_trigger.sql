-- ============================================
-- FIX AUTO-INITIALIZATION TRIGGER
-- ============================================
-- Issue: RLS policies block trigger because auth.uid() is NULL during signup
-- Solution: Create function with RLS bypass and proper error handling

-- ============================================
-- STEP 1: Drop existing trigger and function
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS initialize_new_user();
DROP FUNCTION IF EXISTS initialize_new_user_manual(UUID);
DROP FUNCTION IF EXISTS get_default_business_card();
DROP FUNCTION IF EXISTS generate_user_code();

-- ============================================
-- STEP 2: Recreate helper functions
-- ============================================

-- Generate random user code (6 characters: A-Z, 0-9)
CREATE OR REPLACE FUNCTION generate_user_code()
RETURNS TEXT AS $$
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
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM user_code_ownership WHERE user_code = result) THEN
      RETURN result;
    END IF;
    
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique user code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get default visible fields for groups (updated to match your field structure)
CREATE OR REPLACE FUNCTION get_default_visible_fields_for_group(group_label TEXT)
RETURNS JSONB AS $$
BEGIN
  CASE group_label
    WHEN 'Public' THEN
      RETURN '["personal.name", "personal.title", "personal.profileImage", "contact.phone", "contact.email"]'::jsonb;
    WHEN 'Private' THEN
      RETURN '["personal.name", "personal.title", "personal.bio", "personal.businessName", "personal.profileImage", "contact.phone", "contact.email", "contact.address", "profile.about"]'::jsonb;
    WHEN 'Business' THEN
      RETURN '["personal.name", "personal.title", "personal.businessName", "personal.profileImage", "contact.phone", "contact.email", "profile.about", "profile.experience"]'::jsonb;
    WHEN 'Personal' THEN
      -- Personal group: all fields visible (empty array in your system means all visible)
      RETURN '[]'::jsonb;
    ELSE
      RETURN '["personal.name", "personal.title", "contact.phone", "contact.email"]'::jsonb;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- STEP 3: Create main initialization function with RLS bypass
-- ============================================

CREATE OR REPLACE FUNCTION initialize_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_code TEXT;
  v_group_id_public TEXT;
  v_group_id_private TEXT;
  v_group_id_business TEXT;
  v_group_id_personal TEXT;
BEGIN
  -- Generate unique user code
  BEGIN
    v_user_code := generate_user_code();
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to generate user code: %', SQLERRM;
  END;
  
  -- Generate unique group IDs (must be globally unique, not just per-user)
  v_group_id_public := NEW.id || '_public';
  v_group_id_private := NEW.id || '_private';
  v_group_id_business := NEW.id || '_business';
  v_group_id_personal := NEW.id || '_personal';
  
  -- Bypass RLS for all operations in this function
  -- This is safe because the trigger only fires on INSERT to auth.users
  PERFORM set_config('request.jwt.claims', json_build_object('sub', NEW.id::text)::text, true);
  
  BEGIN
    -- 1. Create user_code_ownership
    INSERT INTO user_code_ownership (user_id, user_code)
    VALUES (NEW.id, v_user_code);
    
  EXCEPTION
    WHEN unique_violation THEN
      -- User already has a code, skip
      NULL;
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to create user_code_ownership: %', SQLERRM;
  END;
  
  BEGIN
    -- 2. Create business_cards with default empty structure
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
      '{"name": "", "title": "", "businessName": "", "bio": "", "profileImage": null}'::jsonb,
      '{"phone": "", "email": "", "address": ""}'::jsonb,
      '{"about": "", "serviceAreas": "", "specialties": "", "experience": "", "languages": "", "certifications": ""}'::jsonb,
      '{"whatsapp": "", "telegram": "", "messenger": "", "zalo": "", "kakao": "", "discord": "", "wechat": ""}'::jsonb,
      '{"facebook": "", "linkedin": "", "twitter": "", "youtube": "", "tiktok": ""}'::jsonb,
      '[]'::jsonb,
      '{}'::jsonb
    );
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Business card already exists, skip
      NULL;
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to create business_cards: %', SQLERRM;
  END;
  
  BEGIN
    -- 3. Create default share groups (Public, Private, Business, Personal)
    INSERT INTO user_share_groups (id, user_id, user_code, label, description, share_code, icon, color, is_default, display_order)
    VALUES
      (
        v_group_id_public,
        NEW.id,
        v_user_code,
        'Public',
        'Anyone with your public link can see this information',
        generate_share_code(),
        'Users',
        'blue',
        true,
        1
      ),
      (
        v_group_id_private,
        NEW.id,
        v_user_code,
        'Private',
        'Only trusted contacts with your private link can access',
        generate_share_code(),
        'Shield',
        'purple',
        true,
        2
      ),
      (
        v_group_id_business,
        NEW.id,
        v_user_code,
        'Business',
        'Professional contacts with your business link',
        generate_share_code(),
        'Briefcase',
        'green',
        true,
        3
      ),
      (
        v_group_id_personal,
        NEW.id,
        v_user_code,
        'Personal',
        'Close personal contacts with your personal link',
        generate_share_code(),
        'Heart',
        'pink',
        true,
        4
      );
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Groups already exist, skip
      NULL;
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to create user_share_groups: %', SQLERRM;
  END;
  
  BEGIN
    -- 4. Create share settings for each group
    INSERT INTO user_share_settings (user_id, user_code, group_id, visible_fields)
    VALUES
      (NEW.id, v_user_code, v_group_id_public, get_default_visible_fields_for_group('Public')),
      (NEW.id, v_user_code, v_group_id_private, get_default_visible_fields_for_group('Private')),
      (NEW.id, v_user_code, v_group_id_business, get_default_visible_fields_for_group('Business')),
      (NEW.id, v_user_code, v_group_id_personal, get_default_visible_fields_for_group('Personal'));
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Settings already exist, skip
      NULL;
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to create user_share_settings: %', SQLERRM;
  END;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to initialize user data for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to postgres and service role
GRANT EXECUTE ON FUNCTION initialize_new_user() TO postgres, service_role;

-- ============================================
-- STEP 4: Create trigger
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_new_user();

-- ============================================
-- STEP 5: Manual backfill function (for existing users)
-- ============================================

CREATE OR REPLACE FUNCTION initialize_existing_user(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_user_code TEXT;
  v_group_id_public TEXT;
  v_group_id_private TEXT;
  v_group_id_business TEXT;
  v_group_id_personal TEXT;
BEGIN
  -- Check if user already initialized
  IF EXISTS (SELECT 1 FROM user_code_ownership WHERE user_id = p_user_id) THEN
    RAISE NOTICE 'User % already initialized', p_user_id;
    RETURN;
  END IF;
  
  -- Generate unique user code
  v_user_code := generate_user_code();
  
  -- Generate unique group IDs
  v_group_id_public := p_user_id || '_public';
  v_group_id_private := p_user_id || '_private';
  v_group_id_business := p_user_id || '_business';
  v_group_id_personal := p_user_id || '_personal';
  
  -- 1. Create user_code_ownership
  INSERT INTO user_code_ownership (user_id, user_code)
  VALUES (p_user_id, v_user_code)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- 2. Create business_cards
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
    p_user_id,
    v_user_code,
    '{"name": "", "title": "", "businessName": "", "bio": "", "profileImage": null}'::jsonb,
    '{"phone": "", "email": "", "address": ""}'::jsonb,
    '{"about": "", "serviceAreas": "", "specialties": "", "experience": "", "languages": "", "certifications": ""}'::jsonb,
    '{"whatsapp": "", "telegram": "", "messenger": "", "zalo": "", "kakao": "", "discord": "", "wechat": ""}'::jsonb,
    '{"facebook": "", "linkedin": "", "twitter": "", "youtube": "", "tiktok": ""}'::jsonb,
    '[]'::jsonb,
    '{}'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- 3. Create default share groups
  INSERT INTO user_share_groups (id, user_id, user_code, label, description, share_code, icon, color, is_default, display_order)
  VALUES
    (v_group_id_public, p_user_id, v_user_code, 'Public', 'Anyone with your public link can see this information', generate_share_code(), 'Users', 'blue', true, 1),
    (v_group_id_private, p_user_id, v_user_code, 'Private', 'Only trusted contacts with your private link can access', generate_share_code(), 'Shield', 'purple', true, 2),
    (v_group_id_business, p_user_id, v_user_code, 'Business', 'Professional contacts with your business link', generate_share_code(), 'Briefcase', 'green', true, 3),
    (v_group_id_personal, p_user_id, v_user_code, 'Personal', 'Close personal contacts with your personal link', generate_share_code(), 'Heart', 'pink', true, 4)
  ON CONFLICT (id) DO NOTHING;
  
  -- 4. Create share settings
  INSERT INTO user_share_settings (user_id, user_code, group_id, visible_fields)
  VALUES
    (p_user_id, v_user_code, v_group_id_public, get_default_visible_fields_for_group('Public')),
    (p_user_id, v_user_code, v_group_id_private, get_default_visible_fields_for_group('Private')),
    (p_user_id, v_user_code, v_group_id_business, get_default_visible_fields_for_group('Business')),
    (p_user_id, v_user_code, v_group_id_personal, get_default_visible_fields_for_group('Personal'))
  ON CONFLICT (user_code, group_id) DO NOTHING;
  
  RAISE NOTICE 'Successfully initialized user %', p_user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to initialize user %: %', p_user_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION initialize_existing_user(UUID) TO postgres, authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check trigger exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE '✅ Trigger "on_auth_user_created" is active';
  ELSE
    RAISE WARNING '⚠️  Trigger "on_auth_user_created" not found';
  END IF;
END $$;

-- ============================================
-- USAGE INSTRUCTIONS
-- ============================================

-- To test with existing user:
-- SELECT initialize_existing_user('your-user-uuid-here');

-- To backfill ALL existing users:
-- DO $$
-- DECLARE
--   user_record RECORD;
-- BEGIN
--   FOR user_record IN 
--     SELECT id FROM auth.users 
--     WHERE id NOT IN (SELECT user_id FROM user_code_ownership)
--   LOOP
--     PERFORM initialize_existing_user(user_record.id);
--   END LOOP;
-- END $$;
