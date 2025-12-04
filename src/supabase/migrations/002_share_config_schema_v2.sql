-- ============================================
-- SHARE CONFIGURATION SCHEMA (SIMPLIFIED)
-- ============================================
-- Simplified version with better error handling
-- Safe to run multiple times

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: user_share_groups
-- ============================================

CREATE TABLE IF NOT EXISTS user_share_groups (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_code TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  share_code TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Users',
  color TEXT NOT NULL DEFAULT 'blue',
  is_default BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_share_code 
    CHECK (share_code ~ '^[A-Z0-9]{6}$'),
  
  CONSTRAINT no_reserved_share_codes 
    CHECK (share_code NOT IN ('STUDIO', 'AUTH', 'CONTACT', 'PROFILE', 'PORTFOLIO'))
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_share_groups_user_share_code 
  ON user_share_groups(user_code, share_code);

CREATE INDEX IF NOT EXISTS idx_user_share_groups_user_code 
  ON user_share_groups(user_code);

CREATE INDEX IF NOT EXISTS idx_user_share_groups_user_id 
  ON user_share_groups(user_id);

CREATE INDEX IF NOT EXISTS idx_user_share_groups_display_order 
  ON user_share_groups(user_code, display_order);

-- ============================================
-- TABLE: user_share_settings
-- ============================================

CREATE TABLE IF NOT EXISTS user_share_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_code TEXT NOT NULL,
  group_id TEXT NOT NULL REFERENCES user_share_groups(id) ON DELETE CASCADE,
  visible_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT visible_fields_is_array 
    CHECK (jsonb_typeof(visible_fields) = 'array')
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_share_settings_group 
  ON user_share_settings(user_code, group_id);

CREATE INDEX IF NOT EXISTS idx_user_share_settings_user_code 
  ON user_share_settings(user_code);

CREATE INDEX IF NOT EXISTS idx_user_share_settings_user_id 
  ON user_share_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_user_share_settings_visible_fields 
  ON user_share_settings USING GIN (visible_fields);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE user_share_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_share_settings ENABLE ROW LEVEL SECURITY;

-- user_share_groups policies
DROP POLICY IF EXISTS "Anyone can view share groups" ON user_share_groups;
CREATE POLICY "Anyone can view share groups"
  ON user_share_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own groups" ON user_share_groups;
CREATE POLICY "Users can insert their own groups"
  ON user_share_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own groups" ON user_share_groups;
CREATE POLICY "Users can update their own groups"
  ON user_share_groups FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete custom groups" ON user_share_groups;
CREATE POLICY "Users can delete custom groups"
  ON user_share_groups FOR DELETE
  USING (auth.uid() = user_id AND is_default = false);

-- user_share_settings policies
DROP POLICY IF EXISTS "Anyone can view share settings" ON user_share_settings;
CREATE POLICY "Anyone can view share settings"
  ON user_share_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own settings" ON user_share_settings;
CREATE POLICY "Users can manage their own settings"
  ON user_share_settings FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

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

CREATE OR REPLACE FUNCTION get_default_visible_fields()
RETURNS JSONB AS $$
BEGIN
  RETURN '["personal.name", "personal.title", "personal.businessName", "personal.profileImage", "contact.phone", "contact.email"]'::jsonb;
END;
$$ LANGUAGE plpgsql;

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
  -- Insert default groups
  INSERT INTO user_share_groups (id, user_id, user_code, label, description, share_code, icon, color, is_default, display_order)
  VALUES
    (v_public_id, p_user_id, p_user_code, 'Public', 'Anyone with your public link can see this information', generate_share_code(), 'Users', 'blue', true, 1),
    (v_private_id, p_user_id, p_user_code, 'Private', 'Only trusted contacts with your private link can access', generate_share_code(), 'Shield', 'purple', true, 2),
    (v_business_id, p_user_id, p_user_code, 'Business', 'Professional contacts with your business link', generate_share_code(), 'Briefcase', 'green', true, 3),
    (v_personal_id, p_user_id, p_user_code, 'Personal', 'Close personal contacts with your personal link', generate_share_code(), 'Heart', 'pink', true, 4)
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

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_public_group_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.id = 'public' THEN
    RAISE EXCEPTION 'Cannot delete public group - it is mandatory';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_initialize_group_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_share_settings (user_id, user_code, group_id, visible_fields)
  VALUES (NEW.user_id, NEW.user_code, NEW.id, get_default_visible_fields())
  ON CONFLICT (user_code, group_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_user_share_groups_updated_at ON user_share_groups;
CREATE TRIGGER update_user_share_groups_updated_at
  BEFORE UPDATE ON user_share_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_share_settings_updated_at ON user_share_settings;
CREATE TRIGGER update_user_share_settings_updated_at
  BEFORE UPDATE ON user_share_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS prevent_public_group_deletion_trigger ON user_share_groups;
CREATE TRIGGER prevent_public_group_deletion_trigger
  BEFORE DELETE ON user_share_groups
  FOR EACH ROW
  EXECUTE FUNCTION prevent_public_group_deletion();

DROP TRIGGER IF EXISTS auto_initialize_group_settings_trigger ON user_share_groups;
CREATE TRIGGER auto_initialize_group_settings_trigger
  AFTER INSERT ON user_share_groups
  FOR EACH ROW
  EXECUTE FUNCTION auto_initialize_group_settings();

-- ============================================
-- DATA MIGRATION (SAFE)
-- ============================================

DO $$
DECLARE
  v_user RECORD;
  v_initialized_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting data migration...';
  
  -- Initialize default groups for users from user_code_ownership
  FOR v_user IN 
    SELECT DISTINCT user_id, user_code 
    FROM user_code_ownership
    WHERE NOT EXISTS (
      SELECT 1 FROM user_share_groups 
      WHERE user_share_groups.user_code = user_code_ownership.user_code
    )
  LOOP
    BEGIN
      PERFORM initialize_default_groups(v_user.user_id, v_user.user_code);
      v_initialized_count := v_initialized_count + 1;
      
      IF v_initialized_count % 10 = 0 THEN
        RAISE NOTICE 'Initialized % users so far...', v_initialized_count;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Failed to initialize user_code: % - Error: %', v_user.user_code, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Data migration completed. Initialized % users.', v_initialized_count;
END $$;

-- ============================================
-- PERMISSIONS
-- ============================================

GRANT SELECT ON user_share_groups TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON user_share_groups TO authenticated;

GRANT SELECT ON user_share_settings TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON user_share_settings TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  v_groups_count INTEGER;
  v_settings_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_groups_count FROM user_share_groups;
  SELECT COUNT(*) INTO v_settings_count FROM user_share_settings;
  
  RAISE NOTICE '✅ Migration complete!';
  RAISE NOTICE 'Created % groups', v_groups_count;
  RAISE NOTICE 'Created % settings', v_settings_count;
  
  -- Test default groups exist
  IF EXISTS (
    SELECT 1 FROM user_share_groups WHERE id = 'public' AND is_default = true
  ) THEN
    RAISE NOTICE '✅ Public groups verified';
  ELSE
    RAISE WARNING '⚠️  No public groups found - users may need initialization';
  END IF;
END $$;
