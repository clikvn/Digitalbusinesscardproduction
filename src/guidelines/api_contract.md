# API Contract

## Architecture

**Direct Supabase client calls with Row Level Security (RLS)**

**No Edge Functions:**
- Direct database queries via Supabase client
- RLS policies for security
- Database functions (e.g., `initialize_user_data()`)

---

## API Modules

**Location:** `/lib/api.ts`

---

## Supabase Client

**Location:** `/lib/supabase-client.ts`

**Configuration:**
- Auth: persistSession, autoRefreshToken enabled
- Headers: x-application-name set

---

## Query Patterns

### TanStack Query Keys

**Format:** `['resource', ...identifiers]`

**Examples:**
```typescript
['analytics', userId]
['businessCard', userCode]
['shareGroups', userId]
```

---

## RPC Functions

### initialize_user_data()

**Purpose:** Creates initial user records on signup

**Returns:** `user_code` (6-character string)

**Creates:**
- user_code_ownership
- business_cards (empty template)
- user_share_groups (4 default groups)
- user_share_settings (default visibility)

---

## Error Handling

**Standard pattern:**
```typescript
try {
  const { data, error } = await supabase.from('table').select();
  if (error) throw error;
  return data;
} catch (error) {
  console.error('[Module] Operation failed:', error);
  throw error;
}
```

---

_Last Updated: Dec 7, 2024_