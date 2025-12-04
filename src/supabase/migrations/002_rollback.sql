-- ============================================
-- ROLLBACK SCRIPT FOR SHARE CONFIGURATION
-- ============================================
-- Use this script to undo the 002_share_config_schema.sql migration
-- WARNING: This will delete all data in user_share_groups and user_share_settings
-- Make sure you have a backup before running this!

-- ============================================
-- SAFETY CHECK
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '⚠️  WARNING: This will delete share configuration data!';
  RAISE NOTICE 'Press Ctrl+C within 5 seconds to cancel...';
  PERFORM pg_sleep(5);
  RAISE NOTICE 'Proceeding with rollback...';
END $$;

-- ============================================
-- BEGIN ROLLBACK TRANSACTION
-- ============================================

BEGIN;

-- ============================================
-- 1. DROP VIEWS
-- ============================================

DROP VIEW IF EXISTS v_field_visibility_matrix CASCADE;
DROP VIEW IF EXISTS v_user_groups_summary CASCADE;

RAISE NOTICE 'Dropped views';

-- ============================================
-- 2. DROP TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_user_share_groups_updated_at ON user_share_groups;
DROP TRIGGER IF EXISTS update_user_share_settings_updated_at ON user_share_settings;
DROP TRIGGER IF EXISTS prevent_public_group_deletion_trigger ON user_share_groups;
DROP TRIGGER IF EXISTS auto_initialize_group_settings_trigger ON user_share_groups;

RAISE NOTICE 'Dropped triggers';

-- ============================================
-- 3. DROP FUNCTIONS
-- ============================================

DROP FUNCTION IF EXISTS generate_share_code();
DROP FUNCTION IF EXISTS get_default_visible_fields();
DROP FUNCTION IF EXISTS initialize_default_groups(UUID, TEXT);
DROP FUNCTION IF EXISTS prevent_public_group_deletion();
DROP FUNCTION IF EXISTS auto_initialize_group_settings();

RAISE NOTICE 'Dropped functions';

-- ============================================
-- 4. DROP POLICIES
-- ============================================

-- user_share_settings policies
DROP POLICY IF EXISTS "Anyone can view share settings" ON user_share_settings;
DROP POLICY IF EXISTS "Users can manage their own settings" ON user_share_settings;

-- user_share_groups policies
DROP POLICY IF EXISTS "Anyone can view share groups" ON user_share_groups;
DROP POLICY IF EXISTS "Users can insert their own groups" ON user_share_groups;
DROP POLICY IF EXISTS "Users can update their own groups" ON user_share_groups;
DROP POLICY IF EXISTS "Users can delete custom groups" ON user_share_groups;

RAISE NOTICE 'Dropped RLS policies';

-- ============================================
-- 5. DROP INDEXES
-- ============================================

-- user_share_settings indexes
DROP INDEX IF EXISTS idx_user_share_settings_visible_fields;
DROP INDEX IF EXISTS idx_user_share_settings_user_id;
DROP INDEX IF EXISTS idx_user_share_settings_user_code;
DROP INDEX IF EXISTS idx_user_share_settings_group;

-- user_share_groups indexes
DROP INDEX IF EXISTS idx_user_share_groups_display_order;
DROP INDEX IF EXISTS idx_user_share_groups_user_id;
DROP INDEX IF EXISTS idx_user_share_groups_user_code;
DROP INDEX IF EXISTS idx_user_share_groups_user_share_code;

RAISE NOTICE 'Dropped indexes';

-- ============================================
-- 6. DROP TABLES
-- ============================================

DROP TABLE IF EXISTS user_share_settings CASCADE;
DROP TABLE IF EXISTS user_share_groups CASCADE;

RAISE NOTICE 'Dropped tables';

-- ============================================
-- 7. REVOKE PERMISSIONS
-- ============================================

REVOKE ALL ON user_share_groups FROM authenticated;
REVOKE ALL ON user_share_groups FROM anon;
REVOKE ALL ON user_share_settings FROM authenticated;
REVOKE ALL ON user_share_settings FROM anon;

RAISE NOTICE 'Revoked permissions';

-- ============================================
-- COMMIT ROLLBACK
-- ============================================

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
  -- Check tables are gone
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name IN ('user_share_groups', 'user_share_settings')
  ) THEN
    RAISE EXCEPTION 'Tables still exist after rollback!';
  END IF;
  
  RAISE NOTICE '✅ Rollback completed successfully';
  RAISE NOTICE 'Tables removed: user_share_groups, user_share_settings';
  RAISE NOTICE 'You may need to restore data from backup if needed';
END $$;

-- ============================================
-- POST-ROLLBACK NOTES
-- ============================================

/*
ROLLBACK COMPLETED

What was removed:
- Tables: user_share_groups, user_share_settings
- Indexes: All indexes on above tables
- Policies: All RLS policies on above tables
- Triggers: Auto-update and validation triggers
- Functions: Share code generation and initialization functions
- Views: Summary and matrix views

Next steps:
1. If you need to restore data, run: \i backup_YYYYMMDD_HHMMSS.sql
2. Application code may need to be reverted to use old storage system
3. Check that share_settings and custom_groups tables still exist
4. Verify application still functions with old schema

Old Schema Tables (should still exist):
- share_settings (with custom_settings JSONB column)
- custom_groups (with group_name, visible_fields columns)

To verify old tables:
  SELECT table_name FROM information_schema.tables 
  WHERE table_name IN ('share_settings', 'custom_groups');
*/
