-- ============================================
-- FIX initialize_user_data() TO ACCEPT USER_ID PARAMETER
-- ============================================
-- PROBLEM: App has userId from signup but RPC relies on auth.uid() which might be NULL due to session timing
-- SOLUTION: Accept p_user_id as parameter so app can pass the userId directly

DROP FUNCTION IF EXISTS public.initialize_user_data();
DROP FUNCTION IF EXISTS public.initialize_user_data(uuid);

CREATE OR REPLACE FUNCTION public.initialize_user_data(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
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
  -- Validate user_id parameter
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid parameter',
      'message', 'user_id cannot be null'
    );
  END IF;
  
  -- Check if user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User does not exist',
      'message', 'User not found in auth.users'
    );
  END IF;
  
  -- Check if already initialized (idempotent)
  IF EXISTS (SELECT 1 FROM user_code_ownership WHERE user_id = p_user_id) THEN
    SELECT user_code INTO v_user_code FROM user_code_ownership WHERE user_id = p_user_id;
    RETURN jsonb_build_object(
      'success', true,
      'user_code', v_user_code,
      'message', 'User already initialized'
    );
  END IF;

  -- Generate unique codes
  v_user_code := generate_unique_user_code();
  v_group_id_public := p_user_id::text || '_public';
  v_group_id_private := p_user_id::text || '_private';
  v_group_id_business := p_user_id::text || '_business';
  v_group_id_personal := p_user_id::text || '_personal';
  
  v_share_code_public := upper(substr(md5(random()::text || p_user_id::text || 'pub'), 1, 6));
  v_share_code_private := upper(substr(md5(random()::text || p_user_id::text || 'prv'), 1, 6));
  v_share_code_business := upper(substr(md5(random()::text || p_user_id::text || 'biz'), 1, 6));
  v_share_code_personal := upper(substr(md5(random()::text || p_user_id::text || 'per'), 1, 6));

  -- 1. Create user_code_ownership
  INSERT INTO user_code_ownership (user_id, user_code)
  VALUES (p_user_id, v_user_code)
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
    p_user_id, 
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
    (v_group_id_public, p_user_id, v_user_code, 'Public', 'Anyone with your public link', v_share_code_public, 'Users', 'blue', true, 1),
    (v_group_id_private, p_user_id, v_user_code, 'Private', 'Trusted contacts only', v_share_code_private, 'Shield', 'purple', true, 2),
    (v_group_id_business, p_user_id, v_user_code, 'Business', 'Professional contacts', v_share_code_business, 'Briefcase', 'green', true, 3),
    (v_group_id_personal, p_user_id, v_user_code, 'Personal', 'Close friends & family', v_share_code_personal, 'Heart', 'pink', true, 4)
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
    (p_user_id, v_user_code, v_share_code_public, v_group_id_public, 
      '["personal.name","personal.title","personal.profileImage","contact.phone","contact.email"]'::jsonb),
    (p_user_id, v_user_code, v_share_code_private, v_group_id_private, 
      '["personal.name","personal.title","personal.bio","personal.businessName","personal.profileImage","contact.phone","contact.email","contact.address","profile.about"]'::jsonb),
    (p_user_id, v_user_code, v_share_code_business, v_group_id_business, 
      '["personal.name","personal.title","personal.businessName","personal.profileImage","contact.phone","contact.email","profile.about","profile.experience"]'::jsonb),
    (p_user_id, v_user_code, v_share_code_personal, v_group_id_personal, 
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
    'message', 'Failed to initialize user data: ' || SQLERRM
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.initialize_user_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_user_data(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.initialize_user_data(uuid) TO service_role;

-- Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname = 'initialize_user_data'
      AND p.pronargs = 1  -- Expects 1 parameter (p_user_id)
  ) THEN
    RAISE NOTICE '✅ initialize_user_data(p_user_id UUID) created successfully';
  ELSE
    RAISE WARNING '⚠️ Function creation failed!';
  END IF;
END $$;
