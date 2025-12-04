-- ============================================
-- AUTO-INITIALIZE USER DATA (SIMPLIFIED & FIXED)
-- ============================================
-- Issue: Previous version blocked by RLS during signup
-- Solution: Use SECURITY DEFINER with explicit RLS bypass

-- ============================================
-- CLEANUP PREVIOUS ATTEMPTS
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS initialize_new_user() CASCADE;
DROP FUNCTION IF EXISTS initialize_new_user_manual(UUID) CASCADE;
DROP FUNCTION IF EXISTS initialize_existing_user(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_default_business_card() CASCADE;

-- Keep these if they don't exist already:
-- DROP FUNCTION IF EXISTS generate_user_code() CASCADE;
-- DROP FUNCTION IF EXISTS generate_share_code() CASCADE;

-- ============================================
-- HELPER: Generate User Code (if not exists)
-- ============================================

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
    
    IF NOT EXISTS (SELECT 1 FROM user_code_ownership WHERE user_code = result) THEN
      RETURN result;
    END IF;
    
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique user code';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MAIN INITIALIZATION FUNCTION (RLS BYPASS)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER -- This allows bypassing RLS
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
  -- Skip if already initialized
  IF EXISTS (SELECT 1 FROM public.user_code_ownership WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Generate codes
  v_user_code := generate_user_code();
  v_group_id_public := NEW.id::text || '_public';
  v_group_id_private := NEW.id::text || '_private';
  v_group_id_business := NEW.id::text || '_business';
  v_group_id_personal := NEW.id::text || '_personal';
  
  -- Generate unique share codes
  v_share_code_public := upper(substr(md5(random()::text), 1, 6));
  v_share_code_private := upper(substr(md5(random()::text), 1, 6));
  v_share_code_business := upper(substr(md5(random()::text), 1, 6));
  v_share_code_personal := upper(substr(md5(random()::text), 1, 6));

  -- 1. User code ownership
  INSERT INTO public.user_code_ownership (user_id, user_code)
  VALUES (NEW.id, v_user_code)
  ON CONFLICT (user_id) DO NOTHING;

  -- 2. Business card
  INSERT INTO public.business_cards (
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
    jsonb_build_object(
      'name', '',
      'title', '',
      'businessName', '',
      'bio', '',
      'profileImage', null
    ),
    jsonb_build_object(
      'phone', '',
      'email', '',
      'address', ''
    ),
    jsonb_build_object(
      'about', '',
      'serviceAreas', '',
      'specialties', '',
      'experience', '',
      'languages', '',
      'certifications', ''
    ),
    jsonb_build_object(
      'whatsapp', '',
      'telegram', '',
      'messenger', '',
      'zalo', '',
      'kakao', '',
      'discord', '',
      'wechat', ''
    ),
    jsonb_build_object(
      'facebook', '',
      'linkedin', '',
      'twitter', '',
      'youtube', '',
      'tiktok', ''
    ),
    '[]'::jsonb,
    '{}'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Share groups
  INSERT INTO public.user_share_groups (id, user_id, user_code, label, description, share_code, icon, color, is_default, display_order)
  VALUES
    (v_group_id_public, NEW.id, v_user_code, 'Public', 'Anyone with your public link', v_share_code_public, 'Users', 'blue', true, 1),
    (v_group_id_private, NEW.id, v_user_code, 'Private', 'Trusted contacts only', v_share_code_private, 'Shield', 'purple', true, 2),
    (v_group_id_business, NEW.id, v_user_code, 'Business', 'Professional contacts', v_share_code_business, 'Briefcase', 'green', true, 3),
    (v_group_id_personal, NEW.id, v_user_code, 'Personal', 'Close friends & family', v_share_code_personal, 'Heart', 'pink', true, 4)
  ON CONFLICT (id) DO NOTHING;

  -- 4. Share settings
  INSERT INTO public.user_share_settings (user_id, user_code, group_id, visible_fields)
  VALUES
    (NEW.id, v_user_code, v_group_id_public, 
      '["personal.name", "personal.title", "personal.profileImage", "contact.phone", "contact.email"]'::jsonb),
    (NEW.id, v_user_code, v_group_id_private,
      '["personal.name", "personal.title", "personal.bio", "personal.businessName", "personal.profileImage", "contact.phone", "contact.email", "contact.address", "profile.about"]'::jsonb),
    (NEW.id, v_user_code, v_group_id_business,
      '["personal.name", "personal.title", "personal.businessName", "personal.profileImage", "contact.phone", "contact.email", "profile.about", "profile.experience"]'::jsonb),
    (NEW.id, v_user_code, v_group_id_personal, '[]'::jsonb)
  ON CONFLICT (user_code, group_id) DO NOTHING;

  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  -- Log but don't fail user creation
  RAISE WARNING 'Error initializing user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CREATE TRIGGER
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Allow the function to run with elevated privileges
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- ============================================
-- BACKFILL FUNCTION FOR EXISTING USERS
-- ============================================

CREATE OR REPLACE FUNCTION public.initialize_existing_users()
RETURNS TABLE(user_id uuid, success boolean, error_message text)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
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
  FOR v_user IN 
    SELECT u.id 
    FROM auth.users u
    LEFT JOIN public.user_code_ownership uco ON u.id = uco.user_id
    WHERE uco.user_id IS NULL
  LOOP
    BEGIN
      -- Generate codes
      v_user_code := generate_user_code();
      v_group_id_public := v_user.id::text || '_public';
      v_group_id_private := v_user.id::text || '_private';
      v_group_id_business := v_user.id::text || '_business';
      v_group_id_personal := v_user.id::text || '_personal';
      
      v_share_code_public := upper(substr(md5(random()::text), 1, 6));
      v_share_code_private := upper(substr(md5(random()::text), 1, 6));
      v_share_code_business := upper(substr(md5(random()::text), 1, 6));
      v_share_code_personal := upper(substr(md5(random()::text), 1, 6));

      -- Insert all data
      INSERT INTO public.user_code_ownership (user_id, user_code)
      VALUES (v_user.id, v_user_code);

      INSERT INTO public.business_cards (user_id, user_code, personal, contact, profile, "socialMessaging", "socialChannels", portfolio, "customLabels")
      VALUES (
        v_user.id, v_user_code,
        '{"name": "", "title": "", "businessName": "", "bio": "", "profileImage": null}'::jsonb,
        '{"phone": "", "email": "", "address": ""}'::jsonb,
        '{"about": "", "serviceAreas": "", "specialties": "", "experience": "", "languages": "", "certifications": ""}'::jsonb,
        '{"whatsapp": "", "telegram": "", "messenger": "", "zalo": "", "kakao": "", "discord": "", "wechat": ""}'::jsonb,
        '{"facebook": "", "linkedin": "", "twitter": "", "youtube": "", "tiktok": ""}'::jsonb,
        '[]'::jsonb, '{}'::jsonb
      );

      INSERT INTO public.user_share_groups (id, user_id, user_code, label, description, share_code, icon, color, is_default, display_order)
      VALUES
        (v_group_id_public, v_user.id, v_user_code, 'Public', 'Anyone with your public link', v_share_code_public, 'Users', 'blue', true, 1),
        (v_group_id_private, v_user.id, v_user_code, 'Private', 'Trusted contacts only', v_share_code_private, 'Shield', 'purple', true, 2),
        (v_group_id_business, v_user.id, v_user_code, 'Business', 'Professional contacts', v_share_code_business, 'Briefcase', 'green', true, 3),
        (v_group_id_personal, v_user.id, v_user_code, 'Personal', 'Close friends & family', v_share_code_personal, 'Heart', 'pink', true, 4);

      INSERT INTO public.user_share_settings (user_id, user_code, group_id, visible_fields)
      VALUES
        (v_user.id, v_user_code, v_group_id_public, '["personal.name", "personal.title", "personal.profileImage", "contact.phone", "contact.email"]'::jsonb),
        (v_user.id, v_user_code, v_group_id_private, '["personal.name", "personal.title", "personal.bio", "personal.businessName", "personal.profileImage", "contact.phone", "contact.email", "contact.address", "profile.about"]'::jsonb),
        (v_user.id, v_user_code, v_group_id_business, '["personal.name", "personal.title", "personal.businessName", "personal.profileImage", "contact.phone", "contact.email", "profile.about", "profile.experience"]'::jsonb),
        (v_user.id, v_user_code, v_group_id_personal, '[]'::jsonb);

      user_id := v_user.id;
      success := true;
      error_message := NULL;
      RETURN NEXT;

    EXCEPTION WHEN OTHERS THEN
      user_id := v_user.id;
      success := false;
      error_message := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    RAISE NOTICE '✅ Auto-initialization trigger is active';
  ELSE
    RAISE WARNING '⚠️  Trigger not found!';
  END IF;
END $$;

-- ============================================
-- USAGE
-- ============================================

-- To backfill existing users, run:
-- SELECT * FROM initialize_existing_users();
