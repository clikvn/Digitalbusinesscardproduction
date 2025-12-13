-- ============================================
-- FIX MISSING TRIGGER ON auth.users
-- ============================================
-- Issue: No trigger exists on auth.users to initialize user data
-- Solution: Create the trigger that calls handle_new_user()

-- ============================================
-- STEP 1: Update handle_new_user to SECURITY DEFINER
-- ============================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER -- Must be DEFINER to bypass RLS when auth.uid() is NULL
SET search_path = public, pg_temp
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
  IF EXISTS (SELECT 1 FROM public.user_code_ownership WHERE user_id = NEW.id) THEN
    RAISE NOTICE 'User % already initialized', NEW.id;
    RETURN NEW;
  END IF;

  RAISE NOTICE 'Initializing new user: %', NEW.id;

  -- Generate unique codes
  v_user_code := generate_user_code();
  v_group_id_public := NEW.id::text || '_public';
  v_group_id_private := NEW.id::text || '_private';
  v_group_id_business := NEW.id::text || '_business';
  v_group_id_personal := NEW.id::text || '_personal';
  
  v_share_code_public := generate_share_code();
  v_share_code_private := generate_share_code();
  v_share_code_business := generate_share_code();
  v_share_code_personal := generate_share_code();

  -- 1. Create user_code_ownership
  INSERT INTO public.user_code_ownership (user_id, user_code)
  VALUES (NEW.id, v_user_code)
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Created user_code_ownership: %', v_user_code;

  -- 2. Create business_cards
  INSERT INTO public.business_cards (user_id, user_code)
  VALUES (NEW.id, v_user_code)
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Created business_cards';

  -- 3. Create default share groups
  INSERT INTO public.user_share_groups (id, user_id, user_code, label, description, share_code, icon, color, is_default, display_order)
  VALUES
    (v_group_id_public, NEW.id, v_user_code, 'Public', 'Anyone with your public link can see this information', v_share_code_public, 'Users', 'blue', true, 1),
    (v_group_id_private, NEW.id, v_user_code, 'Private', 'Only trusted contacts with your private link can access', v_share_code_private, 'Shield', 'purple', true, 2),
    (v_group_id_business, NEW.id, v_user_code, 'Business', 'Professional contacts with your business link', v_share_code_business, 'Briefcase', 'green', true, 3),
    (v_group_id_personal, NEW.id, v_user_code, 'Personal', 'Close personal contacts with your personal link', v_share_code_personal, 'Heart', 'pink', true, 4)
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE 'Created share groups';

  -- 4. Create share settings
  INSERT INTO public.user_share_settings (user_id, user_code, group_id, visible_fields)
  VALUES
    (NEW.id, v_user_code, v_group_id_public,
      '[\"personal.name\", \"personal.title\", \"personal.businessName\", \"personal.profileImage\", \"contact.phone\", \"contact.email\", \"profile.about\"]'::jsonb),
    (NEW.id, v_user_code, v_group_id_private,
      '[\"personal.name\", \"personal.title\", \"personal.bio\", \"personal.businessName\", \"personal.profileImage\", \"contact.phone\", \"contact.email\", \"contact.address\", \"profile.about\"]'::jsonb),
    (NEW.id, v_user_code, v_group_id_business,
      '[\"personal.name\", \"personal.title\", \"personal.businessName\", \"personal.profileImage\", \"contact.phone\", \"contact.email\", \"profile.about\", \"profile.experience\"]'::jsonb),
    (NEW.id, v_user_code, v_group_id_personal, '[]'::jsonb)
  ON CONFLICT (user_code, group_id) DO NOTHING;
  
  RAISE NOTICE 'Created share settings';
  RAISE NOTICE 'Successfully initialized user: %', NEW.id;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block user creation
  RAISE WARNING 'Error initializing user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 2: Grant permissions to the function
-- ============================================

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- ============================================
-- STEP 3: Create the MISSING trigger on auth.users
-- ============================================

-- Drop if exists (just in case)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  trigger_count INTEGER;
  function_security TEXT;
BEGIN
  -- Check if trigger exists
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger 
  WHERE tgname = 'on_auth_user_created'
    AND tgrelid = 'auth.users'::regclass;
    
  IF trigger_count > 0 THEN
    RAISE NOTICE '✅ Trigger "on_auth_user_created" is active on auth.users';
  ELSE
    RAISE WARNING '⚠️ Trigger not found on auth.users!';
  END IF;
  
  -- Check if function is SECURITY DEFINER
  SELECT prosecdef::text INTO function_security
  FROM pg_proc
  WHERE proname = 'handle_new_user'
    AND pronamespace = 'public'::regnamespace;
    
  IF function_security = 'true' THEN
    RAISE NOTICE '✅ Function handle_new_user is SECURITY DEFINER';
  ELSE
    RAISE WARNING '⚠️ Function handle_new_user is NOT SECURITY DEFINER';
  END IF;
END $$;

-- ============================================
-- NOTES
-- ============================================
-- This migration:
-- 1. Changes handle_new_user() to SECURITY DEFINER (bypasses RLS)
-- 2. Creates the MISSING trigger on auth.users table
-- 3. Grants proper permissions
-- 4. Works with email confirmation enabled
