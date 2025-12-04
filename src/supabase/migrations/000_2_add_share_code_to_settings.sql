-- ============================================
-- Migration: Add share_code column to user_share_settings
-- ============================================
-- This migration adds the share_code column if it doesn't exist
-- This replaces the old group_id foreign key system

DO $$
BEGIN
  -- Check if share_code column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_share_settings' 
      AND column_name = 'share_code'
  ) THEN
    -- Add share_code column
    ALTER TABLE user_share_settings 
    ADD COLUMN share_code TEXT;
    
    RAISE NOTICE 'Added share_code column to user_share_settings';
    
    -- Migrate data from group_id to share_code if group_id exists
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'user_share_settings' 
        AND column_name = 'group_id'
    ) THEN
      -- Update share_code from related group
      UPDATE user_share_settings uss
      SET share_code = usg.share_code
      FROM user_share_groups usg
      WHERE uss.group_id = usg.id;
      
      RAISE NOTICE 'Migrated group_id to share_code';
    END IF;
    
    -- For rows without share_code, set to 'public' as default
    UPDATE user_share_settings 
    SET share_code = 'public'
    WHERE share_code IS NULL;
    
    -- Make column NOT NULL
    ALTER TABLE user_share_settings 
    ALTER COLUMN share_code SET NOT NULL;
    
    RAISE NOTICE 'Set share_code as NOT NULL';
    
    -- Add unique constraint
    ALTER TABLE user_share_settings 
    DROP CONSTRAINT IF EXISTS user_share_settings_user_share_code_unique;
    
    ALTER TABLE user_share_settings 
    ADD CONSTRAINT user_share_settings_user_share_code_unique 
    UNIQUE (user_id, share_code);
    
    RAISE NOTICE 'Added unique constraint on (user_id, share_code)';
    
  ELSE
    RAISE NOTICE 'share_code column already exists, skipping';
  END IF;
END $$;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_user_share_settings_share_code 
ON user_share_settings(user_id, share_code);

-- Add comment
COMMENT ON COLUMN user_share_settings.share_code IS 'Share code linking to user_share_groups';
