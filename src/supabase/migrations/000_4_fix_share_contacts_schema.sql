-- ============================================
-- MIGRATION 000_4: Fix share_contacts Schema
-- ============================================
-- Purpose: Add all missing columns to existing share_contacts table
-- This ensures the table matches the base schema definition
-- ============================================

-- First, check what columns exist
DO $$
DECLARE
  has_user_id BOOLEAN;
  has_user_code BOOLEAN;
  has_share_code BOOLEAN;
  has_contact_code BOOLEAN;
  has_contact_name BOOLEAN;
  has_contact_email BOOLEAN;
  has_contact_phone BOOLEAN;
  has_contact_company BOOLEAN;
  has_notes BOOLEAN;
  has_created_at BOOLEAN;
  has_updated_at BOOLEAN;
BEGIN
  -- Check each column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'share_contacts' AND column_name = 'user_id'
  ) INTO has_user_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'share_contacts' AND column_name = 'user_code'
  ) INTO has_user_code;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'share_contacts' AND column_name = 'share_code'
  ) INTO has_share_code;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'share_contacts' AND column_name = 'contact_code'
  ) INTO has_contact_code;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'share_contacts' AND column_name = 'contact_name'
  ) INTO has_contact_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'share_contacts' AND column_name = 'contact_email'
  ) INTO has_contact_email;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'share_contacts' AND column_name = 'contact_phone'
  ) INTO has_contact_phone;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'share_contacts' AND column_name = 'contact_company'
  ) INTO has_contact_company;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'share_contacts' AND column_name = 'notes'
  ) INTO has_notes;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'share_contacts' AND column_name = 'created_at'
  ) INTO has_created_at;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'share_contacts' AND column_name = 'updated_at'
  ) INTO has_updated_at;
  
  -- Add missing columns
  IF NOT has_user_id THEN
    -- Get the current user's ID if possible, otherwise allow NULL temporarily
    ALTER TABLE public.share_contacts ADD COLUMN user_id UUID;
    RAISE NOTICE 'Added user_id column';
  END IF;
  
  IF NOT has_user_code THEN
    ALTER TABLE public.share_contacts ADD COLUMN user_code TEXT;
    RAISE NOTICE 'Added user_code column';
  END IF;
  
  IF NOT has_share_code THEN
    ALTER TABLE public.share_contacts ADD COLUMN share_code TEXT DEFAULT 'public';
    RAISE NOTICE 'Added share_code column';
  END IF;
  
  IF NOT has_contact_code THEN
    ALTER TABLE public.share_contacts ADD COLUMN contact_code TEXT;
    RAISE NOTICE 'Added contact_code column';
  END IF;
  
  IF NOT has_contact_name THEN
    ALTER TABLE public.share_contacts ADD COLUMN contact_name TEXT;
    RAISE NOTICE 'Added contact_name column';
  END IF;
  
  IF NOT has_contact_email THEN
    ALTER TABLE public.share_contacts ADD COLUMN contact_email TEXT;
    RAISE NOTICE 'Added contact_email column';
  END IF;
  
  IF NOT has_contact_phone THEN
    ALTER TABLE public.share_contacts ADD COLUMN contact_phone TEXT;
    RAISE NOTICE 'Added contact_phone column';
  END IF;
  
  IF NOT has_contact_company THEN
    ALTER TABLE public.share_contacts ADD COLUMN contact_company TEXT;
    RAISE NOTICE 'Added contact_company column';
  END IF;
  
  IF NOT has_notes THEN
    ALTER TABLE public.share_contacts ADD COLUMN notes TEXT;
    RAISE NOTICE 'Added notes column';
  END IF;
  
  IF NOT has_created_at THEN
    ALTER TABLE public.share_contacts ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added created_at column';
  END IF;
  
  IF NOT has_updated_at THEN
    ALTER TABLE public.share_contacts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column';
  END IF;
END $$;

-- Now add constraints and foreign keys (only if columns were added)
DO $$
BEGIN
  -- Add NOT NULL constraints (only if there's data)
  BEGIN
    -- Set default values for existing rows if any
    UPDATE share_contacts SET share_code = 'public' WHERE share_code IS NULL;
    UPDATE share_contacts SET created_at = NOW() WHERE created_at IS NULL;
    UPDATE share_contacts SET updated_at = NOW() WHERE updated_at IS NULL;
    
    -- Add NOT NULL constraints only if column can be made NOT NULL
    -- We'll keep user_id, user_code, contact_code, contact_name as nullable for now
    -- since existing data might not have these values
    
    -- Add foreign key for user_id if column exists and has valid data
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'share_contacts' AND column_name = 'user_id'
    ) THEN
      -- Only add FK if all user_ids are valid or NULL
      IF NOT EXISTS (
        SELECT 1 FROM share_contacts 
        WHERE user_id IS NOT NULL 
        AND user_id NOT IN (SELECT id FROM auth.users)
      ) THEN
        -- Drop constraint if exists
        ALTER TABLE share_contacts DROP CONSTRAINT IF EXISTS share_contacts_user_id_fkey;
        
        -- Add foreign key (will only work if all user_ids are valid)
        BEGIN
          ALTER TABLE share_contacts 
            ADD CONSTRAINT share_contacts_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
          RAISE NOTICE 'Added foreign key constraint on user_id';
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Skipped foreign key constraint on user_id (invalid data exists)';
        END;
      END IF;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipped adding constraints due to existing data';
  END;
END $$;

-- Add unique constraint on contact_code
DO $$
BEGIN
  -- Only add if contact_code column exists and has no duplicates
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'share_contacts' AND column_name = 'contact_code'
  ) THEN
    -- Drop constraint if exists
    ALTER TABLE share_contacts DROP CONSTRAINT IF EXISTS share_contacts_contact_code_key;
    ALTER TABLE share_contacts DROP CONSTRAINT IF EXISTS share_contacts_user_id_unique;
    
    -- Add unique constraint only if no duplicates
    BEGIN
      ALTER TABLE share_contacts 
        ADD CONSTRAINT share_contacts_contact_code_key UNIQUE (contact_code);
      RAISE NOTICE 'Added unique constraint on contact_code';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped unique constraint on contact_code (duplicates exist)';
    END;
    
    -- Add composite unique constraint
    BEGIN
      ALTER TABLE share_contacts 
        ADD CONSTRAINT share_contacts_user_id_unique UNIQUE (user_id, contact_code);
      RAISE NOTICE 'Added composite unique constraint on (user_id, contact_code)';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped composite unique constraint (duplicates or NULLs exist)';
    END;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_share_contacts_user_id ON share_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_share_contacts_user_code ON share_contacts(user_code);
CREATE INDEX IF NOT EXISTS idx_share_contacts_share_code ON share_contacts(user_id, share_code);
CREATE INDEX IF NOT EXISTS idx_share_contacts_contact_code ON share_contacts(user_code, contact_code);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_share_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_share_contacts_updated_at ON share_contacts;
CREATE TRIGGER update_share_contacts_updated_at
  BEFORE UPDATE ON share_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_share_contacts_updated_at();

-- Add comments
COMMENT ON TABLE share_contacts IS 'Individual tracked shares for analytics - created by owner for specific contacts';
COMMENT ON COLUMN share_contacts.user_id IS 'Owner user ID (who created this share contact)';
COMMENT ON COLUMN share_contacts.user_code IS 'Owner user code (e.g., "myclik")';
COMMENT ON COLUMN share_contacts.share_code IS 'Which share group this contact belongs to (e.g., "work", "public")';
COMMENT ON COLUMN share_contacts.contact_code IS 'Unique 8-character code for URL tracking (e.g., "a1b2c3d4")';
COMMENT ON COLUMN share_contacts.contact_name IS 'Name of the person this share is for';

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify all columns were added:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'share_contacts'
-- ORDER BY ordinal_position;
