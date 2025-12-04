-- ============================================
-- Migration: Add share_code column to user_share_groups
-- ============================================
-- This migration adds the share_code column if it doesn't exist
-- This is needed because the table might exist from an earlier migration
-- without the share_code column

DO $$
BEGIN
  -- Check if share_code column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_share_groups' 
      AND column_name = 'share_code'
  ) THEN
    -- Add share_code column
    ALTER TABLE user_share_groups 
    ADD COLUMN share_code TEXT;
    
    RAISE NOTICE 'Added share_code column to user_share_groups';
    
    -- Update existing rows with temporary values
    -- We'll generate proper share codes in a later step
    UPDATE user_share_groups 
    SET share_code = UPPER(substring(gen_random_uuid()::text from 1 for 6))
    WHERE share_code IS NULL;
    
    -- Make column NOT NULL after populating
    ALTER TABLE user_share_groups 
    ALTER COLUMN share_code SET NOT NULL;
    
    RAISE NOTICE 'Populated share_code for existing groups';
    
    -- Add unique constraint
    -- First drop existing constraint if it exists
    ALTER TABLE user_share_groups 
    DROP CONSTRAINT IF EXISTS user_share_groups_user_share_code_unique;
    
    -- Add new constraint
    ALTER TABLE user_share_groups 
    ADD CONSTRAINT user_share_groups_user_share_code_unique 
    UNIQUE (user_id, share_code);
    
    RAISE NOTICE 'Added unique constraint on (user_id, share_code)';
    
  ELSE
    RAISE NOTICE 'share_code column already exists, skipping';
  END IF;
END $$;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_user_share_groups_share_code 
ON user_share_groups(user_id, share_code);

-- Add comment
COMMENT ON COLUMN user_share_groups.share_code IS 'Unique share code for URL-based group access (e.g., /usercode/ABC123)';
