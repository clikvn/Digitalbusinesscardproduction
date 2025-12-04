-- ============================================
-- MIGRATION 000_3: Add share_code to share_contacts
-- ============================================
-- Purpose: Add missing share_code column to existing share_contacts table
-- This column links a contact to a specific share group (e.g., "work", "public")
-- ============================================

-- Check if column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'share_contacts' 
      AND column_name = 'share_code'
  ) THEN
    -- Add share_code column
    ALTER TABLE public.share_contacts 
      ADD COLUMN share_code TEXT NOT NULL DEFAULT 'public';
    
    RAISE NOTICE 'Added share_code column to share_contacts table';
  ELSE
    RAISE NOTICE 'share_code column already exists in share_contacts table';
  END IF;
END $$;

-- Add index for share_code lookups
CREATE INDEX IF NOT EXISTS idx_share_contacts_share_code 
  ON share_contacts(user_id, share_code);

-- Add index for contact_code lookups (for analytics)
CREATE INDEX IF NOT EXISTS idx_share_contacts_contact_code 
  ON share_contacts(user_code, contact_code);

-- Add comment
COMMENT ON COLUMN share_contacts.share_code IS 'Which share group this contact belongs to (e.g., "work", "public", "friends")';

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify the column was added:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'share_contacts'
-- ORDER BY ordinal_position;
