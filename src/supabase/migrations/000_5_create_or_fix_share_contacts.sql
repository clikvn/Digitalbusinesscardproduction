-- ============================================
-- MIGRATION 000_5: Create or Fix share_contacts Table
-- ============================================
-- Purpose: Ensure share_contacts table exists with correct schema
-- If table doesn't exist, create it. If it exists, fix missing columns.
-- ============================================

-- Step 1: Check if table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'share_contacts'
  ) THEN
    -- Table doesn't exist, create it with full schema
    CREATE TABLE public.share_contacts (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      user_code TEXT,
      
      -- Contact Info
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      contact_company TEXT,
      notes TEXT,
      
      -- Share Group Assignment
      share_code TEXT DEFAULT 'public',
      
      -- Unique Contact Code for URL tracking
      contact_code TEXT,
      
      -- Metadata
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    RAISE NOTICE 'Created share_contacts table';
  ELSE
    RAISE NOTICE 'share_contacts table already exists, will check columns';
  END IF;
END $$;

-- Step 2: Add missing columns one by one (only if table exists)
DO $$
BEGIN
  -- Add user_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'share_contacts' 
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.share_contacts ADD COLUMN user_id UUID;
    RAISE NOTICE 'Added user_id column';
  END IF;
  
  -- Add user_code if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'share_contacts' 
      AND column_name = 'user_code'
  ) THEN
    ALTER TABLE public.share_contacts ADD COLUMN user_code TEXT;
    RAISE NOTICE 'Added user_code column';
  END IF;
  
  -- Add contact_name if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'share_contacts' 
      AND column_name = 'contact_name'
  ) THEN
    ALTER TABLE public.share_contacts ADD COLUMN contact_name TEXT;
    RAISE NOTICE 'Added contact_name column';
  END IF;
  
  -- Add contact_email if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'share_contacts' 
      AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE public.share_contacts ADD COLUMN contact_email TEXT;
    RAISE NOTICE 'Added contact_email column';
  END IF;
  
  -- Add contact_phone if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'share_contacts' 
      AND column_name = 'contact_phone'
  ) THEN
    ALTER TABLE public.share_contacts ADD COLUMN contact_phone TEXT;
    RAISE NOTICE 'Added contact_phone column';
  END IF;
  
  -- Add contact_company if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'share_contacts' 
      AND column_name = 'contact_company'
  ) THEN
    ALTER TABLE public.share_contacts ADD COLUMN contact_company TEXT;
    RAISE NOTICE 'Added contact_company column';
  END IF;
  
  -- Add notes if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'share_contacts' 
      AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.share_contacts ADD COLUMN notes TEXT;
    RAISE NOTICE 'Added notes column';
  END IF;
  
  -- Add share_code if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'share_contacts' 
      AND column_name = 'share_code'
  ) THEN
    ALTER TABLE public.share_contacts ADD COLUMN share_code TEXT DEFAULT 'public';
    RAISE NOTICE 'Added share_code column';
  END IF;
  
  -- Add contact_code if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'share_contacts' 
      AND column_name = 'contact_code'
  ) THEN
    ALTER TABLE public.share_contacts ADD COLUMN contact_code TEXT;
    RAISE NOTICE 'Added contact_code column';
  END IF;
  
  -- Add created_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'share_contacts' 
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.share_contacts ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added created_at column';
  END IF;
  
  -- Add updated_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'share_contacts' 
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.share_contacts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column';
  END IF;
END $$;

-- Step 3: Set defaults for existing rows
UPDATE share_contacts SET share_code = 'public' WHERE share_code IS NULL;
UPDATE share_contacts SET created_at = NOW() WHERE created_at IS NULL;
UPDATE share_contacts SET updated_at = NOW() WHERE updated_at IS NULL;

-- Step 4: Add foreign key constraint (safely)
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE share_contacts DROP CONSTRAINT IF EXISTS share_contacts_user_id_fkey;
  
  -- Add foreign key only if all user_ids are valid
  IF NOT EXISTS (
    SELECT 1 FROM share_contacts 
    WHERE user_id IS NOT NULL 
      AND user_id NOT IN (SELECT id FROM auth.users)
  ) THEN
    ALTER TABLE share_contacts 
      ADD CONSTRAINT share_contacts_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint on user_id';
  ELSE
    RAISE NOTICE 'Skipped foreign key constraint (invalid user_ids exist)';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
END $$;

-- Step 5: Add unique constraints (safely)
DO $$
BEGIN
  -- Drop existing constraints if they exist
  ALTER TABLE share_contacts DROP CONSTRAINT IF EXISTS share_contacts_contact_code_key;
  ALTER TABLE share_contacts DROP CONSTRAINT IF EXISTS share_contacts_user_id_unique;
  
  -- Add unique constraint on contact_code
  IF NOT EXISTS (
    SELECT contact_code, COUNT(*) 
    FROM share_contacts 
    WHERE contact_code IS NOT NULL
    GROUP BY contact_code 
    HAVING COUNT(*) > 1
  ) THEN
    ALTER TABLE share_contacts 
      ADD CONSTRAINT share_contacts_contact_code_key 
      UNIQUE (contact_code);
    RAISE NOTICE 'Added unique constraint on contact_code';
  ELSE
    RAISE NOTICE 'Skipped unique constraint on contact_code (duplicates exist)';
  END IF;
  
  -- Add composite unique constraint
  IF NOT EXISTS (
    SELECT user_id, contact_code, COUNT(*) 
    FROM share_contacts 
    WHERE user_id IS NOT NULL AND contact_code IS NOT NULL
    GROUP BY user_id, contact_code 
    HAVING COUNT(*) > 1
  ) THEN
    ALTER TABLE share_contacts 
      ADD CONSTRAINT share_contacts_user_id_unique 
      UNIQUE (user_id, contact_code);
    RAISE NOTICE 'Added composite unique constraint on (user_id, contact_code)';
  ELSE
    RAISE NOTICE 'Skipped composite unique constraint (duplicates exist)';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add unique constraints: %', SQLERRM;
END $$;

-- Step 6: Add indexes
CREATE INDEX IF NOT EXISTS idx_share_contacts_user_id 
  ON share_contacts(user_id);
  
CREATE INDEX IF NOT EXISTS idx_share_contacts_user_code 
  ON share_contacts(user_code);
  
CREATE INDEX IF NOT EXISTS idx_share_contacts_share_code 
  ON share_contacts(user_id, share_code);
  
CREATE INDEX IF NOT EXISTS idx_share_contacts_contact_code 
  ON share_contacts(user_code, contact_code);

-- Step 7: Enable RLS
ALTER TABLE share_contacts ENABLE ROW LEVEL SECURITY;

-- Step 8: Drop existing policies
DROP POLICY IF EXISTS "Users can read their own share contacts" ON share_contacts;
DROP POLICY IF EXISTS "Users can insert their own share contacts" ON share_contacts;
DROP POLICY IF EXISTS "Users can update their own share contacts" ON share_contacts;
DROP POLICY IF EXISTS "Users can delete their own share contacts" ON share_contacts;

-- Step 9: Create RLS policies
CREATE POLICY "Users can read their own share contacts"
  ON share_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own share contacts"
  ON share_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own share contacts"
  ON share_contacts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own share contacts"
  ON share_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Step 10: Add updated_at trigger
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

-- Step 11: Add comments
COMMENT ON TABLE share_contacts IS 'Individual tracked shares for analytics - owner creates these for specific contacts';
COMMENT ON COLUMN share_contacts.user_id IS 'Owner user ID (who created this share contact)';
COMMENT ON COLUMN share_contacts.user_code IS 'Owner user code (e.g., "myclik")';
COMMENT ON COLUMN share_contacts.contact_name IS 'Name of the person this share is for';
COMMENT ON COLUMN share_contacts.contact_email IS 'Email of the person (optional)';
COMMENT ON COLUMN share_contacts.contact_phone IS 'Phone of the person (optional)';
COMMENT ON COLUMN share_contacts.contact_company IS 'Company of the person (optional)';
COMMENT ON COLUMN share_contacts.notes IS 'Owner notes about this contact (optional)';
COMMENT ON COLUMN share_contacts.share_code IS 'Which share group this contact belongs to (e.g., "work", "public")';
COMMENT ON COLUMN share_contacts.contact_code IS 'Unique 8-character code for URL tracking (e.g., "a1b2c3d4")';
COMMENT ON COLUMN share_contacts.created_at IS 'When this share contact was created';
COMMENT ON COLUMN share_contacts.updated_at IS 'When this share contact was last updated';

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify the table schema:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'share_contacts'
-- ORDER BY ordinal_position;
