-- ============================================
-- FIX: Ensure user_plan table exists and initialize_user_data uses it correctly
-- ============================================
-- ERROR: relation "user_plan" does not exist
-- SOLUTION: Create user_plan table if missing and fix initialize_user_data

-- Create user_plan table if it doesn't exist (SINGULAR)
CREATE TABLE IF NOT EXISTS public.user_plan (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL DEFAULT 'free' CHECK (plan_name IN ('free', 'premium', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_plan ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "user_plan_select_own" ON public.user_plan;
DROP POLICY IF EXISTS "Users can view their own plan" ON public.user_plan;
DROP POLICY IF EXISTS "Enable read access for users" ON public.user_plan;

-- Create policy - users can only see their own plan
CREATE POLICY "user_plan_select_own" 
ON public.user_plan
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.user_plan TO authenticated;

-- Update initialize_user_data to use user_plan (SINGULAR)
CREATE OR REPLACE FUNCTION public.initialize_user_data(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_code TEXT;
BEGIN
  -- Generate unique user code
  new_user_code := generate_unique_user_code();
  
  -- Insert into user_code_ownership
  INSERT INTO user_code_ownership (user_code, user_id)
  VALUES (new_user_code, p_user_id);
  
  -- Insert into business_cards
  INSERT INTO business_cards (user_id, user_code, name, title, company_name)
  VALUES (
    p_user_id,
    new_user_code,
    COALESCE((SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = p_user_id), 'New User'),
    '',
    ''
  );
  
  -- Insert into user_plan (SINGULAR)
  INSERT INTO user_plan (user_id, plan_name)
  VALUES (p_user_id, 'free');
  
  -- Create default public share group
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
  ) VALUES (
    'public',
    p_user_id,
    new_user_code,
    'Public',
    'Share with anyone',
    substring(md5(random()::text) from 1 for 6),
    'Globe',
    'blue',
    true,
    0
  );
  
  -- Create default private share group  
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
  ) VALUES (
    'private',
    p_user_id,
    new_user_code,
    'Private',
    'Only visible to me',
    substring(md5(random()::text) from 1 for 6),
    'Lock',
    'gray',
    true,
    1
  );
  
  RETURN json_build_object(
    'success', true,
    'user_code', new_user_code
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to initialize user data: %', SQLERRM;
END;
$$;

-- Verify
DO $$
BEGIN
  RAISE NOTICE '✅ user_plan table created/verified (singular)';
  RAISE NOTICE '✅ initialize_user_data function updated to use user_plan (singular)';
  RAISE NOTICE '✅ RLS policy created: users can only see their own plan';
END $$;
