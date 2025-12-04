-- ============================================
-- FIX TRIGGER WITH PROPER ERROR LOGGING
-- ============================================
-- Issue: Trigger fails silently, user created but no data
-- Solution: Remove broad exception handler, add detailed logging

-- ============================================
-- CLEANUP
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================
-- RECREATE WITH DETAILED ERROR HANDLING
-- ============================================

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
  -- Log start
  RAISE NOTICE 'Starting initialization for user: %', NEW.id;
  
  -- Skip if already initialized
  IF EXISTS (SELECT 1 FROM public.user_code_ownership WHERE user_id = NEW.id) THEN
    RAISE NOTICE 'User % already initialized, skipping', NEW.id;
    RETURN NEW;
  END IF;

  -- Generate codes
  RAISE NOTICE 'Generating user code...';
  v_user_code := generate_user_code();
  RAISE NOTICE 'Generated user_code: %', v_user_code;
  
  v_group_id_public := NEW.id::text || '_public';
  v_group_id_private := NEW.id::text || '_private';
  v_group_id_business := NEW.id::text || '_business';
  v_group_id_personal := NEW.id::text || '_personal';
  
  -- Generate share codes (simpler method)
  v_share_code_public := upper(substr(md5(random()::text || NEW.id::text || 'public'), 1, 6));
  v_share_code_private := upper(substr(md5(random()::text || NEW.id::text || 'private'), 1, 6));
  v_share_code_business := upper(substr(md5(random()::text || NEW.id::text || 'business'), 1, 6));
  v_share_code_personal := upper(substr(md5(random()::text || NEW.id::text || 'personal'), 1, 6));

  -- 1. User code ownership
  RAISE NOTICE 'Creating user_code_ownership...';
  BEGIN
    INSERT INTO public.user_code_ownership (user_id, user_code)
    VALUES (NEW.id, v_user_code);
    RAISE NOTICE '✅ Created user_code_ownership';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create user_code_ownership: %', SQLERRM;
  END;

  -- 2. Business card
  RAISE NOTICE 'Creating business_cards...';
  BEGIN
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
    );
    RAISE NOTICE '✅ Created business_cards';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create business_cards: %', SQLERRM;
  END;

  -- 3. Share groups
  RAISE NOTICE 'Creating user_share_groups...';
  BEGIN
    INSERT INTO public.user_share_groups (id, user_id, user_code, label, description, share_code, icon, color, is_default, display_order)
    VALUES
      (v_group_id_public, NEW.id, v_user_code, 'Public', 'Anyone with your public link', v_share_code_public, 'Users', 'blue', true, 1),
      (v_group_id_private, NEW.id, v_user_code, 'Private', 'Trusted contacts only', v_share_code_private, 'Shield', 'purple', true, 2),
      (v_group_id_business, NEW.id, v_user_code, 'Business', 'Professional contacts', v_share_code_business, 'Briefcase', 'green', true, 3),
      (v_group_id_personal, NEW.id, v_user_code, 'Personal', 'Close friends & family', v_share_code_personal, 'Heart', 'pink', true, 4);
    RAISE NOTICE '✅ Created user_share_groups (4 rows)';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create user_share_groups: %', SQLERRM;
  END;

  -- 4. Share settings
  RAISE NOTICE 'Creating user_share_settings...';
  BEGIN
    INSERT INTO public.user_share_settings (user_id, user_code, group_id, visible_fields)
    VALUES
      (NEW.id, v_user_code, v_group_id_public, 
        '["personal.name", "personal.title", "personal.profileImage", "contact.phone", "contact.email"]'::jsonb),
      (NEW.id, v_user_code, v_group_id_private,
        '["personal.name", "personal.title", "personal.bio", "personal.businessName", "personal.profileImage", "contact.phone", "contact.email", "contact.address", "profile.about"]'::jsonb),
      (NEW.id, v_user_code, v_group_id_business,
        '["personal.name", "personal.title", "personal.businessName", "personal.profileImage", "contact.phone", "contact.email", "profile.about", "profile.experience"]'::jsonb),
      (NEW.id, v_user_code, v_group_id_personal, '[]'::jsonb);
    RAISE NOTICE '✅ Created user_share_settings (4 rows)';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create user_share_settings: %', SQLERRM;
  END;

  RAISE NOTICE '✅✅✅ Successfully initialized user: %', NEW.id;
  RETURN NEW;
  
END;
$$ LANGUAGE plpgsql;

-- Set owner to postgres for RLS bypass
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- ============================================
-- RECREATE TRIGGER
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Trigger recreated with detailed logging';
  RAISE NOTICE 'Check Logs tab in Supabase to see execution';
  RAISE NOTICE '===========================================';
END $$;

-- ============================================
-- TEST FUNCTION (for existing users)
-- ============================================

-- You can test the function manually with an existing user:
-- SELECT public.handle_new_user_manual('user-uuid-here');

CREATE OR REPLACE FUNCTION public.handle_new_user_manual(p_user_id UUID)
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
  -- Skip if already initialized
  IF EXISTS (SELECT 1 FROM public.user_code_ownership WHERE user_id = p_user_id) THEN
    RETURN 'User already initialized';
  END IF;

  -- Generate codes
  v_user_code := generate_user_code();
  v_group_id_public := p_user_id::text || '_public';
  v_group_id_private := p_user_id::text || '_private';
  v_group_id_business := p_user_id::text || '_business';
  v_group_id_personal := p_user_id::text || '_personal';
  
  v_share_code_public := upper(substr(md5(random()::text || p_user_id::text || 'public'), 1, 6));
  v_share_code_private := upper(substr(md5(random()::text || p_user_id::text || 'private'), 1, 6));
  v_share_code_business := upper(substr(md5(random()::text || p_user_id::text || 'business'), 1, 6));
  v_share_code_personal := upper(substr(md5(random()::text || p_user_id::text || 'personal'), 1, 6));

  -- Insert all data
  INSERT INTO public.user_code_ownership (user_id, user_code)
  VALUES (p_user_id, v_user_code);

  INSERT INTO public.business_cards (user_id, user_code, personal, contact, profile, "socialMessaging", "socialChannels", portfolio, "customLabels")
  VALUES (
    p_user_id, v_user_code,
    '{"name": "", "title": "", "businessName": "", "bio": "", "profileImage": null}'::jsonb,
    '{"phone": "", "email": "", "address": ""}'::jsonb,
    '{"about": "", "serviceAreas": "", "specialties": "", "experience": "", "languages": "", "certifications": ""}'::jsonb,
    '{"whatsapp": "", "telegram": "", "messenger": "", "zalo": "", "kakao": "", "discord": "", "wechat": ""}'::jsonb,
    '{"facebook": "", "linkedin": "", "twitter": "", "youtube": "", "tiktok": ""}'::jsonb,
    '[]'::jsonb, '{}'::jsonb
  );

  INSERT INTO public.user_share_groups (id, user_id, user_code, label, description, share_code, icon, color, is_default, display_order)
  VALUES
    (v_group_id_public, p_user_id, v_user_code, 'Public', 'Anyone with your public link', v_share_code_public, 'Users', 'blue', true, 1),
    (v_group_id_private, p_user_id, v_user_code, 'Private', 'Trusted contacts only', v_share_code_private, 'Shield', 'purple', true, 2),
    (v_group_id_business, p_user_id, v_user_code, 'Business', 'Professional contacts', v_share_code_business, 'Briefcase', 'green', true, 3),
    (v_group_id_personal, p_user_id, v_user_code, 'Personal', 'Close friends & family', v_share_code_personal, 'Heart', 'pink', true, 4);

  INSERT INTO public.user_share_settings (user_id, user_code, group_id, visible_fields)
  VALUES
    (p_user_id, v_user_code, v_group_id_public, '["personal.name", "personal.title", "personal.profileImage", "contact.phone", "contact.email"]'::jsonb),
    (p_user_id, v_user_code, v_group_id_private, '["personal.name", "personal.title", "personal.bio", "personal.businessName", "personal.profileImage", "contact.phone", "contact.email", "contact.address", "profile.about"]'::jsonb),
    (p_user_id, v_user_code, v_group_id_business, '["personal.name", "personal.title", "personal.businessName", "personal.profileImage", "contact.phone", "contact.email", "profile.about", "profile.experience"]'::jsonb),
    (p_user_id, v_user_code, v_group_id_personal, '[]'::jsonb);

  RETURN 'Successfully initialized user ' || p_user_id::text || ' with code ' || v_user_code;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION public.handle_new_user_manual(UUID) OWNER TO postgres;
