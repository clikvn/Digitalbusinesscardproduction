-- ============================================
-- FIX initialize_user_data() FUNCTION SIGNATURE
-- ============================================
-- PROBLEM: Function in database has p_user_id parameter, but app calls it with NO parameters
-- SOLUTION: Update function to have NO parameters and get user_id from auth.uid()

DROP FUNCTION IF EXISTS public.initialize_user_data(uuid);
DROP FUNCTION IF EXISTS public.initialize_user_data();

CREATE OR REPLACE FUNCTION public.initialize_user_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
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
  -- Get current authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authenticated',
      'message', 'User must be logged in to initialize data'
    );
  END IF;
  
  -- Check if user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User does not exist',
      'message', 'User not found in auth.users'
    );
  END IF;
  
  -- Check if already initialized (idempotent)
  IF EXISTS (SELECT 1 FROM user_code_ownership WHERE user_id = v_user_id) THEN
    SELECT user_code INTO v_user_code FROM user_code_ownership WHERE user_id = v_user_id;
    RETURN jsonb_build_object(
      'success', true,
      'user_code', v_user_code,
      'message', 'User already initialized'
    );
  END IF;

  -- Generate unique codes
  v_user_code := generate_unique_user_code();
  v_group_id_public := v_user_id::text || '_public';
  v_group_id_private := v_user_id::text || '_private';
  v_group_id_business := v_user_id::text || '_business';
  v_group_id_personal := v_user_id::text || '_personal';
  
  v_share_code_public := upper(substr(md5(random()::text || v_user_id::text || 'pub'), 1, 6));
  v_share_code_private := upper(substr(md5(random()::text || v_user_id::text || 'prv'), 1, 6));
  v_share_code_business := upper(substr(md5(random()::text || v_user_id::text || 'biz'), 1, 6));
  v_share_code_personal := upper(substr(md5(random()::text || v_user_id::text || 'per'), 1, 6));

  -- 1. Create user_code_ownership
  INSERT INTO user_code_ownership (user_id, user_code)
  VALUES (v_user_id, v_user_code)
  ON CONFLICT (user_id) DO NOTHING;

  -- 2. Create business_cards with all required JSONB fields
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
    v_user_id, 
    v_user_code,
    '{"name":"","title":"","businessName":"","bio":"","profileImage":null}'::jsonb,
    '{"phone":"","email":"","address":""}'::jsonb,
    '{"about":"","serviceAreas":"","specialties":"","experience":"","languages":"","certifications":""}'::jsonb,
    '{"whatsapp":"","telegram":"","messenger":"","zalo":"","kakao":"","discord":"","wechat":""}'::jsonb,
    '{"facebook":"","linkedin":"","twitter":"","youtube":"","tiktok":""}'::jsonb,
    '[]'::jsonb,
    '{}'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Create default share groups
  INSERT INTO user_share_groups (
    id, 
    user_id, 
    user_code, 
    label, 
    description, 
    share_code, 
    icon, 
    color, 
    is_default, 
    display_order
  )
  VALUES
    (v_group_id_public, v_user_id, v_user_code, 'Public', 'Anyone with your public link', v_share_code_public, 'Users', 'blue', true, 1),
    (v_group_id_private, v_user_id, v_user_code, 'Private', 'Trusted contacts only', v_share_code_private, 'Shield', 'purple', true, 2),
    (v_group_id_business, v_user_id, v_user_code, 'Business', 'Professional contacts', v_share_code_business, 'Briefcase', 'green', true, 3),
    (v_group_id_personal, v_user_id, v_user_code, 'Personal', 'Close friends & family', v_share_code_personal, 'Heart', 'pink', true, 4)
  ON CONFLICT (id) DO NOTHING;

  -- 4. Create share settings with share_code
  INSERT INTO user_share_settings (
    user_id, 
    user_code, 
    share_code,
    group_id, 
    visible_fields
  )
  VALUES
    (v_user_id, v_user_code, v_share_code_public, v_group_id_public, 
      '["personal.name","personal.title","personal.profileImage","contact.phone","contact.email"]'::jsonb),
    (v_user_id, v_user_code, v_share_code_private, v_group_id_private, 
      '["personal.name","personal.title","personal.bio","personal.businessName","personal.profileImage","contact.phone","contact.email","contact.address","profile.about"]'::jsonb),
    (v_user_id, v_user_code, v_share_code_business, v_group_id_business, 
      '["personal.name","personal.title","personal.businessName","personal.profileImage","contact.phone","contact.email","profile.about","profile.experience"]'::jsonb),
    (v_user_id, v_user_code, v_share_code_personal, v_group_id_personal, 
      '[]'::jsonb)
  ON CONFLICT (user_code, group_id) DO NOTHING;

  -- Return success with user_code
  RETURN jsonb_build_object(
    'success', true,
    'user_code', v_user_code,
    'message', 'User initialized successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Return detailed error for debugging
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE,
    'message', 'Failed to initialize user data'
  );
END;
$$;

-- Grant permissions to all necessary roles
GRANT EXECUTE ON FUNCTION public.initialize_user_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_user_data() TO anon;
GRANT EXECUTE ON FUNCTION public.initialize_user_data() TO service_role;

-- Verify the function was created correctly
DO $$
DECLARE
  func_exists BOOLEAN;
  func_signature TEXT;
BEGIN
  -- Check if function exists
  SELECT EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname = 'initialize_user_data'
      AND p.pronargs = 0  -- No parameters!
  ) INTO func_exists;
  
  IF func_exists THEN
    RAISE NOTICE '✅ initialize_user_data() created successfully with NO parameters';
  ELSE
    RAISE WARNING '⚠️ Function not found or has wrong signature!';
  END IF;
END $$;
