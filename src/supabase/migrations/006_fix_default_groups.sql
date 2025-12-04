-- ============================================
-- FIX DEFAULT GROUPS
-- ============================================
-- PROBLEM: All 4 groups (public, private, business, personal) have is_default=true
-- SOLUTION: Only public group should have is_default=true
-- This prevents confusion and allows proper deletion of non-default groups

-- Step 1: Update existing records - set is_default=false for all except Public
-- IMPORTANT: Match by label, not id (IDs are UUID-based like "uuid_public")
UPDATE user_share_groups
SET is_default = false
WHERE label IN ('Private', 'Business', 'Personal');

-- Step 2: Ensure Public group has is_default=true
UPDATE user_share_groups
SET is_default = true
WHERE label = 'Public';

-- Step 3: Update the initialize_default_groups function
CREATE OR REPLACE FUNCTION initialize_default_groups(
  p_user_id UUID,
  p_user_code TEXT
)
RETURNS void AS $$
DECLARE
  v_public_id TEXT := p_user_id::text || '_public';
  v_private_id TEXT := p_user_id::text || '_private';
  v_business_id TEXT := p_user_id::text || '_business';
  v_personal_id TEXT := p_user_id::text || '_personal';
  v_default_fields JSONB := get_default_visible_fields();
BEGIN
  -- Insert default groups
  -- IMPORTANT: Only public group has is_default=true
  INSERT INTO user_share_groups (id, user_id, user_code, label, description, share_code, icon, color, is_default, display_order)
  VALUES
    (v_public_id, p_user_id, p_user_code, 'Public', 'Anyone with your public link can see this information', generate_share_code(), 'Users', 'blue', true, 1),
    (v_private_id, p_user_id, p_user_code, 'Private', 'Only trusted contacts with your private link can access', generate_share_code(), 'Shield', 'purple', false, 2),
    (v_business_id, p_user_id, p_user_code, 'Business', 'Professional contacts with your business link', generate_share_code(), 'Briefcase', 'green', false, 3),
    (v_personal_id, p_user_id, p_user_code, 'Personal', 'Close personal contacts with your personal link', generate_share_code(), 'Heart', 'pink', false, 4)
  ON CONFLICT (id) DO NOTHING;

  -- Insert settings
  INSERT INTO user_share_settings (user_id, user_code, group_id, visible_fields)
  VALUES
    (p_user_id, p_user_code, v_public_id, v_default_fields),
    (p_user_id, p_user_code, v_private_id, v_default_fields),
    (p_user_id, p_user_code, v_business_id, v_default_fields),
    (p_user_id, p_user_code, v_personal_id, v_default_fields)
  ON CONFLICT (user_code, group_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Update prevent deletion function to protect groups by label
-- This allows it to work with UUID-based IDs
CREATE OR REPLACE FUNCTION prevent_public_group_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.label = 'Public' OR OLD.is_default = true THEN
    RAISE EXCEPTION 'Cannot delete default group - it is mandatory';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;