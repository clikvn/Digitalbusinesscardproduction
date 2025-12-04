# Verification Guide - Share Settings Fix

## Quick Test Steps

### 1. Test Share Settings Save

1. **Login to CMS**
   - Go to your app and login
   - Navigate to Settings or Share Manager

2. **Modify Visibility Settings**
   - Change visibility settings for any group (Public, Private, etc.)
   - Click Save or wait for auto-save

3. **Expected Result**
   - ✅ Settings should save without errors
   - ✅ No "null value in column 'group_id'" error in console
   - ✅ Settings persist after page refresh

4. **If Error Occurs**
   - Check browser console for specific error
   - Check Network tab for API request details
   - Verify the request payload has `group_id` field (NOT `share_code`)

---

## Database Verification (Supabase Dashboard)

### Check Table Schema

1. Go to Supabase Dashboard > Database > Tables
2. Select `user_share_settings` table
3. Verify columns:
   ```
   ✓ id (UUID)
   ✓ user_id (UUID)
   ✓ user_code (TEXT)
   ✓ group_id (TEXT) ← Must exist and be NOT NULL, references user_share_groups.id
   ✓ visible_fields (JSONB)
   ✓ created_at (TIMESTAMPTZ)
   ✓ updated_at (TIMESTAMPTZ)
   ```

### Check Constraints

In SQL Editor, run:
```sql
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'user_share_settings';
```

Expected output should include:
```
idx_user_share_settings_group | UNIQUE (user_code, group_id)
```

### Check Data

```sql
SELECT 
  user_code,
  group_id,
  visible_fields
FROM user_share_settings
LIMIT 10;
```

Verify:
- ✓ All rows have `group_id` populated (no NULL values)
- ✓ `group_id` matches IDs from `user_share_groups` table (e.g., 'public', 'private')

---

## Debug Common Issues

### Issue: "group_id is null"

**Check 1:** Verify customGroups is passed to save function
```typescript
// In the calling code, ensure both arguments are provided:
await api.settings.save(userCode, settings, customGroups); // ✓ Both provided
await api.settings.save(userCode, settings); // ✗ Missing customGroups
```

**Check 2:** Verify customGroups have shareCode
```typescript
console.log('customGroups:', customGroups);
// Each group should have: { id, label, shareCode, ... }
```

**Fix:** Ensure all group objects have valid `shareCode` values

### Issue: "Conflict on upsert"

**Check:** Verify the constraint matches
```sql
-- Should be (user_code, group_id), NOT (user_id, share_code)
SELECT constraint_name 
FROM information_schema.constraint_column_usage 
WHERE table_name = 'user_share_settings';
```

---

## Expected API Behavior

### Before Fix (BROKEN)
```typescript
// API tried to insert with wrong column name:
{
  user_id: "...",
  user_code: "ABC123",
  share_code: "PUBLIC",     // ✗ Wrong - database has group_id, not share_code
  visible_fields: [...]
}
// Result: Error - null value in column "group_id" violates not-null constraint
```

### After Fix (WORKING)
```typescript
// API now correctly inserts:
{
  user_id: "...",
  user_code: "ABC123",
  group_id: "public",       // ✓ Correct - matches database schema
  visible_fields: [...]
}
// Result: Success
```

---

## Migration State Check

Run this to verify your database has the correct schema:

```sql
-- Check if migration ran successfully
SELECT 
  EXISTS(
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_share_settings' 
      AND column_name = 'group_id'
  ) as has_group_id_column,
  
  EXISTS(
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE table_name = 'user_share_settings' 
      AND constraint_name = 'idx_user_share_settings_group'
  ) as has_correct_constraint;
```

Expected result:
```
has_group_id_column | has_correct_constraint
true                  | true
```

---

## Contact for Support

If issues persist:
1. Check `/ERROR_FIXES.md` for detailed technical explanation
2. Review `/lib/api.ts` lines 403-435 for the fix implementation
3. Verify `/supabase/migrations/000_2_add_share_code_to_settings.sql` was applied