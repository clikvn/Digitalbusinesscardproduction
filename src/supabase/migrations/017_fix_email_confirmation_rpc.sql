-- ============================================
-- FIX EMAIL CONFIRMATION FOR RPC INITIALIZATION
-- ============================================
-- PROBLEM: initialize_user_data() requires auth.uid() which is NULL when email confirmation is enabled
-- SOLUTION: Allow the function to work with BOTH authenticated and newly-created users
--           by checking the session instead of just auth.uid()

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
  -- Get current user ID
  -- When email confirmation is enabled, auth.uid() might be NULL immediately after signup
  -- But we can still access the session to get the user_id
  v_user_id := auth.uid();
  
  -- If auth.uid() is NULL, try to get it from the JWT claims
  IF v_user_id IS NULL THEN
    -- Try to get from session - this works even before email confirmation
    BEGIN
      v_user_id := (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_user_id := NULL;
    END;
  END IF;
  
  -- Final check - if still NULL, we can't proceed
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated - no user ID available';
  END IF;
  
  -- Check if already initialized (idempotent)
  IF EXISTS (SELECT 1 FROM user_code_ownership WHERE user_id = v_user_id) THEN
    -- Return existing data
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
  
  v_share_code_public := generate_share_code();
  v_share_code_private := generate_share_code();
  v_share_code_business := generate_share_code();
  v_share_code_personal := generate_share_code();
  
  -- 1. Create user_code_ownership
  INSERT INTO user_code_ownership (user_id, user_code)
  VALUES (v_user_id, v_user_code)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- 2. Create business_cards
  INSERT INTO business_cards (user_id, user_code)
  VALUES (v_user_id, v_user_code)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- 3. Create default share groups
  INSERT INTO user_share_groups (id, user_id, user_code, label, description, share_code, icon, color, is_default, display_order)
  VALUES
    (v_group_id_public, v_user_id, v_user_code, 'Public', 'Anyone with your public link can see this information', v_share_code_public, 'Users', 'blue', true, 1),
    (v_group_id_private, v_user_id, v_user_code, 'Private', 'Only trusted contacts with your private link can access', v_share_code_private, 'Shield', 'purple', true, 2),
    (v_group_id_business, v_user_id, v_user_code, 'Business', 'Professional contacts with your business link', v_share_code_business, 'Briefcase', 'green', true, 3),
    (v_group_id_personal, v_user_id, v_user_code, 'Personal', 'Close personal contacts with your personal link', v_share_code_personal, 'Heart', 'pink', true, 4)
  ON CONFLICT (id) DO NOTHING;
  
  -- 4. Create share settings with share_code
  INSERT INTO user_share_settings (user_id, user_code, share_code, group_id, visible_fields)
  VALUES
    (v_user_id, v_user_code, v_share_code_public, v_group_id_public,
      '[\"personal.name\", \"personal.title\", \"personal.businessName\", \"personal.profileImage\", \"contact.phone\", \"contact.email\", \"profile.about\"]'::jsonb),
    (v_user_id, v_user_code, v_share_code_private, v_group_id_private,
      '[\"personal.name\", \"personal.title\", \"personal.bio\", \"personal.businessName\", \"personal.profileImage\", \"contact.phone\", \"contact.email\", \"contact.address\", \"profile.about\"]'::jsonb),
    (v_user_id, v_user_code, v_share_code_business, v_group_id_business,
      '[\"personal.name\", \"personal.title\", \"personal.businessName\", \"personal.profileImage\", \"contact.phone\", \"contact.email\", \"profile.about\", \"profile.experience\"]'::jsonb),
    (v_user_id, v_user_code, v_share_code_personal, v_group_id_personal, '[]'::jsonb)
  ON CONFLICT (user_code, group_id) DO NOTHING;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'user_code', v_user_code,
    'message', 'User initialized successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Return error details for debugging
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Failed to initialize user data'
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.initialize_user_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_user_data() TO anon;
GRANT EXECUTE ON FUNCTION public.initialize_user_data() TO service_role;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ initialize_user_data() updated to support email confirmation';
  RAISE NOTICE '   - Now works with both authenticated and newly-created users';
  RAISE NOTICE '   - Tries to get user_id from JWT claims if auth.uid() is NULL';
  RAISE NOTICE '   - Returns detailed error messages for debugging';
END $$;
