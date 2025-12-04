-- ============================================
-- FIX RLS POLICIES FOR SHARE TABLES
-- ============================================
-- Issue: INSERT policies have USING clause which is evaluated before row exists
-- Solution: Use only WITH CHECK for INSERT, separate USING for UPDATE

-- ============================================
-- user_share_groups RLS FIXES
-- ============================================

-- Fix INSERT policy - only use WITH CHECK (no USING clause)
DROP POLICY IF EXISTS "Users can insert their own groups" ON user_share_groups;
CREATE POLICY "Users can insert their own groups"
  ON user_share_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Fix UPDATE policy - use both USING and WITH CHECK
DROP POLICY IF EXISTS "Users can update their own groups" ON user_share_groups;
CREATE POLICY "Users can update their own groups"
  ON user_share_groups FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- user_share_settings RLS FIXES
-- ============================================

-- Replace "FOR ALL" with specific policies for each operation
DROP POLICY IF EXISTS "Users can manage their own settings" ON user_share_settings;

-- SELECT policy (anyone can read)
DROP POLICY IF EXISTS "Anyone can view share settings" ON user_share_settings;
CREATE POLICY "Anyone can view share settings"
  ON user_share_settings FOR SELECT
  USING (true);

-- INSERT policy (only check user_id on new row)
CREATE POLICY "Users can insert their own settings"
  ON user_share_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy (check both existing and new user_id)
CREATE POLICY "Users can update their own settings"
  ON user_share_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE policy (check existing user_id)
CREATE POLICY "Users can delete their own settings"
  ON user_share_settings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- VERIFICATION
-- ============================================

-- You can verify the policies are working by running:
-- SELECT * FROM pg_policies WHERE tablename IN ('user_share_groups', 'user_share_settings');
