-- ============================================
-- SHARE CONFIGURATION SCHEMA
-- ============================================
-- This migration creates proper tables for share configuration
-- Replaces localStorage-based solution with database tables
-- Created: 2024
--
-- Tables:
--   1. user_share_groups - Stores custom groups with share codes
--   2. user_share_settings - Stores field visibility settings per group
--
-- Features:
--   - RLS policies for security
--   - Indexes for performance
--   - Constraints for data integrity
--   - Auto-update timestamps
--   - Default group initialization trigger
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: user_share_groups
-- ============================================
-- Stores custom contact groups with unique share codes
-- Each group has visual customization (icon, color) and a share code for URLs

CREATE TABLE IF NOT EXISTS user_share_groups (
  -- Primary key
  id TEXT PRIMARY KEY, -- e.g., 'public', 'private', 'custom-123'
  
  -- Foreign keys
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_code TEXT NOT NULL,
  
  -- Group details
  label TEXT NOT NULL, -- Display name e.g., 'Public', 'VIP Clients'
  description TEXT, -- Optional description
  share_code TEXT NOT NULL, -- 6-character alphanumeric code for URLs
  
  -- Visual customization
  icon TEXT NOT NULL DEFAULT 'Users', -- Lucide icon name
  color TEXT NOT NULL DEFAULT 'blue', -- Tailwind color class prefix
  
  -- Metadata
  is_default BOOLEAN NOT NULL DEFAULT false, -- System default groups (public, private, etc.)
  display_order INTEGER NOT NULL DEFAULT 0, -- For sorting groups
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT user_share_groups_user_code_fkey 
    FOREIGN KEY (user_code) 
    REFERENCES user_code_ownership(user_code) 
    ON DELETE CASCADE,
  
  CONSTRAINT valid_share_code 
    CHECK (share_code ~ '^[A-Z0-9]{6}$'), -- Must be 6 alphanumeric uppercase
  
  CONSTRAINT no_reserved_share_codes 
    CHECK (share_code NOT IN ('STUDIO', 'AUTH', 'CONTACT', 'PROFILE', 'PORTFOLIO'))
);

-- Create unique index on share_code per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_share_groups_user_share_code 
  ON user_share_groups(user_code, share_code);

-- Create index on user_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_share_groups_user_code 
  ON user_share_groups(user_code);

-- Create index on user_id for ownership checks
CREATE INDEX IF NOT EXISTS idx_user_share_groups_user_id 
  ON user_share_groups(user_id);

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_user_share_groups_display_order 
  ON user_share_groups(user_code, display_order);

-- ============================================
-- TABLE: user_share_settings
-- ============================================
-- Stores field visibility settings for each group
-- Each row represents which fields are visible for a specific group

CREATE TABLE IF NOT EXISTS user_share_settings (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign keys
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_code TEXT NOT NULL,
  group_id TEXT NOT NULL, -- Links to user_share_groups.id
  
  -- Field visibility (array of field paths)
  visible_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: ["personal.name", "personal.title", "contact.phone", "contact.email"]
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT user_share_settings_user_code_fkey 
    FOREIGN KEY (user_code) 
    REFERENCES user_code_ownership(user_code) 
    ON DELETE CASCADE,
  
  CONSTRAINT user_share_settings_group_fkey 
    FOREIGN KEY (group_id) 
    REFERENCES user_share_groups(id) 
    ON DELETE CASCADE,
  
  CONSTRAINT visible_fields_is_array 
    CHECK (jsonb_typeof(visible_fields) = 'array')
);

-- Create unique index to ensure one settings row per group
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_share_settings_group 
  ON user_share_settings(user_code, group_id);

-- Create index on user_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_share_settings_user_code 
  ON user_share_settings(user_code);

-- Create index on user_id for ownership checks
CREATE INDEX IF NOT EXISTS idx_user_share_settings_user_id 
  ON user_share_settings(user_id);

-- Create GIN index on visible_fields for array operations
CREATE INDEX IF NOT EXISTS idx_user_share_settings_visible_fields 
  ON user_share_settings USING GIN (visible_fields);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on both tables
ALTER TABLE user_share_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_share_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES: user_share_groups
-- ============================================

-- Policy: Anyone can view groups (needed for public profile filtering)
DROP POLICY IF EXISTS "Anyone can view share groups" ON user_share_groups;
CREATE POLICY "Anyone can view share groups"
  ON user_share_groups
  FOR SELECT
  USING (true);

-- Policy: Users can insert their own groups
DROP POLICY IF EXISTS "Users can insert their own groups" ON user_share_groups;
CREATE POLICY "Users can insert their own groups"
  ON user_share_groups
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    user_code IN (
      SELECT user_code FROM user_code_ownership WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own groups
DROP POLICY IF EXISTS "Users can update their own groups" ON user_share_groups;
CREATE POLICY "Users can update their own groups"
  ON user_share_groups
  FOR UPDATE
  USING (
    auth.uid() = user_id AND
    user_code IN (
      SELECT user_code FROM user_code_ownership WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own custom groups (but not default groups)
DROP POLICY IF EXISTS "Users can delete custom groups" ON user_share_groups;
CREATE POLICY "Users can delete custom groups"
  ON user_share_groups
  FOR DELETE
  USING (
    auth.uid() = user_id AND
    is_default = false AND -- Cannot delete default groups
    user_code IN (
      SELECT user_code FROM user_code_ownership WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- POLICIES: user_share_settings
-- ============================================

-- Policy: Anyone can view settings (needed for public profile filtering)
DROP POLICY IF EXISTS "Anyone can view share settings" ON user_share_settings;
CREATE POLICY "Anyone can view share settings"
  ON user_share_settings
  FOR SELECT
  USING (true);

-- Policy: Users can manage their own settings
DROP POLICY IF EXISTS "Users can manage their own settings" ON user_share_settings;
CREATE POLICY "Users can manage their own settings"
  ON user_share_settings
  FOR ALL
  USING (
    auth.uid() = user_id AND
    user_code IN (
      SELECT user_code FROM user_code_ownership WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Generate random 6-character alphanumeric share code
CREATE OR REPLACE FUNCTION generate_share_code()
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

-- Function: Get default visible fields for new groups
CREATE OR REPLACE FUNCTION get_default_visible_fields()
RETURNS JSONB AS $$
BEGIN
  RETURN '["personal.name", "personal.title", "personal.businessName", "personal.profileImage", "contact.phone", "contact.email"]'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- Function: Initialize default groups for a new user
CREATE OR REPLACE FUNCTION initialize_default_groups(
  p_user_id UUID,
  p_user_code TEXT
)
RETURNS void AS $$
DECLARE
  v_public_id TEXT := 'public';
  v_private_id TEXT := 'private';
  v_business_id TEXT := 'business';
  v_personal_id TEXT := 'personal';
  v_default_fields JSONB := get_default_visible_fields();
BEGIN
  -- Insert default groups with unique share codes
  INSERT INTO user_share_groups (id, user_id, user_code, label, description, share_code, icon, color, is_default, display_order)
  VALUES
    (v_public_id, p_user_id, p_user_code, 'Public', 'Anyone with your public link can see this information', generate_share_code(), 'Users', 'blue', true, 1),
    (v_private_id, p_user_id, p_user_code, 'Private', 'Only trusted contacts with your private link can access', generate_share_code(), 'Shield', 'purple', true, 2),
    (v_business_id, p_user_id, p_user_code, 'Business', 'Professional contacts with your business link', generate_share_code(), 'Briefcase', 'green', true, 3),
    (v_personal_id, p_user_id, p_user_code, 'Personal', 'Close personal contacts with your personal link', generate_share_code(), 'Heart', 'pink', true, 4)
  ON CONFLICT (id) DO NOTHING;

  -- Insert default visibility settings for each group
  INSERT INTO user_share_settings (user_id, user_code, group_id, visible_fields)
  VALUES
    (p_user_id, p_user_code, v_public_id, v_default_fields),
    (p_user_id, p_user_code, v_private_id, v_default_fields),
    (p_user_id, p_user_code, v_business_id, v_default_fields),
    (p_user_id, p_user_code, v_personal_id, v_default_fields)
  ON CONFLICT (user_code, group_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Auto-update updated_at on user_share_groups
DROP TRIGGER IF EXISTS update_user_share_groups_updated_at ON user_share_groups;
CREATE TRIGGER update_user_share_groups_updated_at
  BEFORE UPDATE ON user_share_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at on user_share_settings
DROP TRIGGER IF EXISTS update_user_share_settings_updated_at ON user_share_settings;
CREATE TRIGGER update_user_share_settings_updated_at
  BEFORE UPDATE ON user_share_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Prevent deletion of public group
CREATE OR REPLACE FUNCTION prevent_public_group_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.id = 'public' THEN
    RAISE EXCEPTION 'Cannot delete public group - it is mandatory';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_public_group_deletion_trigger ON user_share_groups;
CREATE TRIGGER prevent_public_group_deletion_trigger
  BEFORE DELETE ON user_share_groups
  FOR EACH ROW
  EXECUTE FUNCTION prevent_public_group_deletion();

-- Trigger: Auto-initialize settings when new group is created
CREATE OR REPLACE FUNCTION auto_initialize_group_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default visibility settings for new group
  INSERT INTO user_share_settings (user_id, user_code, group_id, visible_fields)
  VALUES (NEW.user_id, NEW.user_code, NEW.id, get_default_visible_fields())
  ON CONFLICT (user_code, group_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_initialize_group_settings_trigger ON user_share_groups;
CREATE TRIGGER auto_initialize_group_settings_trigger
  AFTER INSERT ON user_share_groups
  FOR EACH ROW
  EXECUTE FUNCTION auto_initialize_group_settings();

-- ============================================
-- DATA MIGRATION
-- ============================================
-- Migrate existing data from old schema to new schema
-- This section is safe to run multiple times

DO $$
DECLARE
  v_user RECORD;
  v_custom_group RECORD;
  v_next_order INTEGER := 100;
  v_table_exists BOOLEAN;
BEGIN
  -- Migrate from share_settings.custom_settings to new tables
  FOR v_user IN 
    SELECT DISTINCT user_id, user_code 
    FROM share_settings 
    WHERE custom_settings IS NOT NULL
  LOOP
    -- Check if user already has groups in new table
    IF NOT EXISTS (
      SELECT 1 FROM user_share_groups 
      WHERE user_code = v_user.user_code
    ) THEN
      -- Initialize default groups for this user
      PERFORM initialize_default_groups(v_user.user_id, v_user.user_code);
      
      RAISE NOTICE 'Initialized default groups for user_code: %', v_user.user_code;
    END IF;
  END LOOP;
  
  -- Check if custom_groups table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'custom_groups'
  ) INTO v_table_exists;
  
  -- Migrate from custom_groups table if it exists
  IF v_table_exists THEN
    RAISE NOTICE 'Migrating data from custom_groups table...';
    
    FOR v_custom_group IN 
      SELECT 
        COALESCE(id::text, 'custom-' || uuid_generate_v4()::text) as group_id,
        user_id,
        user_code,
        COALESCE(group_name, 'Unnamed Group') as group_label,
        description as group_description,
        created_at as group_created_at
      FROM custom_groups
      WHERE NOT EXISTS (
        SELECT 1 FROM user_share_groups usg
        WHERE usg.user_code = custom_groups.user_code 
          AND usg.id = COALESCE(custom_groups.id::text, 'custom-' || uuid_generate_v4()::text)
      )
    LOOP
      -- Insert group with generated share code
      INSERT INTO user_share_groups (
        id, user_id, user_code, label, description, share_code, 
        icon, color, is_default, display_order, created_at
      )
      VALUES (
        v_custom_group.group_id,
        v_custom_group.user_id,
        v_custom_group.user_code,
        v_custom_group.group_label,
        v_custom_group.group_description,
        generate_share_code(),
        'Users', -- Default icon
        'slate', -- Default color
        false,
        v_next_order,
        COALESCE(v_custom_group.group_created_at, NOW())
      )
      ON CONFLICT (id) DO NOTHING;
      
      v_next_order := v_next_order + 1;
      
      RAISE NOTICE 'Migrated custom group: % for user: %', v_custom_group.group_label, v_custom_group.user_code;
    END LOOP;
  ELSE
    RAISE NOTICE 'custom_groups table does not exist, skipping migration';
  END IF;
  
  RAISE NOTICE 'Data migration completed';
END $$;

-- ============================================
-- HELPER VIEWS (Optional)
-- ============================================

-- View: User groups with settings count
CREATE OR REPLACE VIEW v_user_groups_summary AS
SELECT 
  g.id,
  g.user_code,
  g.label,
  g.description,
  g.share_code,
  g.icon,
  g.color,
  g.is_default,
  g.display_order,
  COALESCE(jsonb_array_length(s.visible_fields), 0) as visible_fields_count,
  g.created_at,
  g.updated_at
FROM user_share_groups g
LEFT JOIN user_share_settings s ON g.id = s.group_id AND g.user_code = s.user_code
ORDER BY g.user_code, g.display_order;

-- View: Field visibility matrix
CREATE OR REPLACE VIEW v_field_visibility_matrix AS
SELECT 
  s.user_code,
  s.group_id,
  g.label as group_label,
  jsonb_array_elements_text(s.visible_fields) as field_path
FROM user_share_settings s
JOIN user_share_groups g ON s.group_id = g.id AND s.user_code = g.user_code
ORDER BY s.user_code, g.display_order;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE user_share_groups IS 'Stores custom contact groups with unique share codes for URL-based access control';
COMMENT ON TABLE user_share_settings IS 'Stores field visibility settings for each group';

COMMENT ON COLUMN user_share_groups.share_code IS 'Unique 6-character alphanumeric code used in URLs (e.g., /usercode/ABC123)';
COMMENT ON COLUMN user_share_groups.is_default IS 'System default groups (public, private, business, personal) cannot be deleted';
COMMENT ON COLUMN user_share_groups.display_order IS 'Used for sorting groups in UI';

COMMENT ON COLUMN user_share_settings.visible_fields IS 'JSONB array of field paths (e.g., ["personal.name", "contact.phone"])';

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON user_share_groups TO authenticated;
GRANT INSERT, UPDATE, DELETE ON user_share_groups TO authenticated;

GRANT SELECT ON user_share_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON user_share_settings TO authenticated;

-- Grant SELECT to anon for public viewing
GRANT SELECT ON user_share_groups TO anon;
GRANT SELECT ON user_share_settings TO anon;

-- ============================================
-- VALIDATION QUERIES
-- ============================================

-- Test query: Check if default groups exist for a user
-- SELECT * FROM user_share_groups WHERE user_code = 'YOUR_USER_CODE' ORDER BY display_order;

-- Test query: Check field visibility for a group
-- SELECT visible_fields FROM user_share_settings WHERE user_code = 'YOUR_USER_CODE' AND group_id = 'public';

-- Test query: Find groups with specific share code
-- SELECT * FROM user_share_groups WHERE user_code = 'YOUR_USER_CODE' AND share_code = 'ABC123';

-- Test query: Get all visible fields for a user across all groups
-- SELECT * FROM v_field_visibility_matrix WHERE user_code = 'YOUR_USER_CODE';
