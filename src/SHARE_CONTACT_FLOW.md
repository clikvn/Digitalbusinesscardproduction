# Share Contact Flow - Contact Code Generation

## Overview

This document clarifies **how contact codes are generated** and **who can create them**.

---

## ✅ **Confirmed: Contact Codes Are Owner-Only**

### **Key Points:**

1. ✅ **Contact codes are NOT auto-generated for everyone**
2. ✅ **Contact codes are ONLY created by the OWNER**
3. ✅ **Contact codes are bound to specific contacts created by the owner**
4. ✅ **Visitors do NOT get contact codes automatically**

---

## How It Works

### **1. Owner Creates Share Contact**

**Action:** Owner explicitly creates a tracked share for a specific person

**UI Flow:**
1. Owner goes to "Share Contact" tab in CMS
2. Clicks "Add new contact" button
3. Fills in contact form:
   - Name (required)
   - Email (optional)
   - Phone (optional)
   - Company (optional)
   - Share group (e.g., "work", "public")

**API Call:**
```typescript
const result = await api.shareContacts.create('myclik', {
  name: 'John Doe',
  email: 'john@example.com',
  company: 'ACME Corp',
  shareCode: 'work'
});

// System generates unique contact_code
// Returns: { 
//   id: 'uuid',
//   contactCode: 'a1b2c3d4',  ← AUTO-GENERATED (8 chars)
//   url: '/myclik/work/a1b2c3d4' 
// }
```

**Database Insert:**
```sql
INSERT INTO share_contacts (
  user_id,
  user_code,
  contact_name,
  contact_email,
  contact_company,
  share_code,
  contact_code  ← SYSTEM GENERATES THIS
) VALUES (
  'owner-uuid',
  'myclik',
  'John Doe',
  'john@example.com',
  'ACME Corp',
  'work',
  'a1b2c3d4'  ← Random 8-character code
);
```

---

### **2. Owner Shares Custom URL**

**What Owner Gets:**
- Unique URL: `/myclik/work/a1b2c3d4`
- QR code for this URL
- Share options: Email, SMS, Copy link, etc.

**What Owner Does:**
- Shares this specific URL with John Doe ONLY
- John's visits will be tracked individually
- John's analytics will show under "Engaged Contacts"

---

### **3. John Visits URL**

**What Happens:**
```
John visits: /myclik/work/a1b2c3d4
              ↓       ↓        ↓
           user   group   contact_code
```

**Analytics Tracking:**
1. **Session Created:**
```sql
INSERT INTO analytics_sessions (
  session_id,
  user_code,
  share_code,
  contact_id  ← 'a1b2c3d4' (John's contact code)
) VALUES (
  'session_xyz',
  'myclik',
  'work',
  'a1b2c3d4'
);
```

2. **Dual Counting (Daily Aggregation):**
```sql
-- Contact stats (John's individual engagement)
INSERT INTO analytics_daily_contact_stats (
  user_code: 'myclik',
  share_code: 'work',
  contact_code: 'a1b2c3d4',  ← John's code
  total_sessions: 1
);

-- Group stats (ALL work group visits, including John)
INSERT INTO analytics_daily_group_stats (
  user_code: 'myclik',
  share_code: 'work',
  total_sessions: 1  ← Includes John
);
```

---

### **4. Anonymous Visitor Visits**

**What Happens:**
```
Visitor visits: /myclik/work
                 ↓       ↓
              user   group   (NO contact_code)
```

**Analytics Tracking:**
```sql
-- Session WITHOUT contact_id
INSERT INTO analytics_sessions (
  session_id: 'session_abc',
  user_code: 'myclik',
  share_code: 'work',
  contact_id: NULL  ← No contact code
);
```

**Result:**
- ✅ Counted in group stats (`analytics_daily_group_stats`)
- ❌ NOT counted in contact stats (`analytics_daily_contact_stats`)
- Anonymous visitor does NOT get a contact code

---

## URL Patterns Summary

| URL Pattern | Who Gets It | Tracking Level | contact_code Generated? |
|-------------|-------------|----------------|------------------------|
| `/myclik` | Public | User-level | ❌ No |
| `/myclik/work` | Anyone with group link | Group-level | ❌ No |
| `/myclik/work/a1b2c3d4` | Specific person (John) | Individual + Group | ✅ Yes (by owner) |

---

## Contact Code Generation Details

### **Current Implementation** (`/lib/api.ts`)

```typescript
// Line 552-596
api.shareContacts.create = async (userCode, contactData) => {
  // ✅ Owner must be authenticated
  const user = await getCurrentUser();
  
  // ✅ Owner must own this user_code
  const isOwner = await verifyOrClaimOwnership(userCode, user.id);
  if (!isOwner) throw new Error('Forbidden');
  
  // ✅ System generates 8-character random code
  const contactCode = crypto.randomUUID().substring(0, 8);
  // Example: 'a1b2c3d4', '7f8e9d2c', 'b4c5d6e7'
  
  // ✅ Insert into database
  await supabase.from('share_contacts').insert({
    user_id: user.id,
    user_code: userCode,
    contact_name: contactData.name,
    contact_email: contactData.email || null,
    contact_phone: contactData.phone || null,
    contact_company: contactData.company || null,
    share_code: contactData.shareCode || 'public',
    contact_code: contactCode  ← AUTO-GENERATED
  });
  
  return {
    id: data.id,
    contactCode: contactCode,
    url: `/${userCode}/${data.share_code}/${contactCode}`
  };
};
```

### **Key Security:**

1. ✅ **Authentication Required:** Must be logged in
2. ✅ **Authorization Check:** Must own the user_code
3. ✅ **Unique Codes:** Each contact gets a unique 8-char code
4. ✅ **Owner-Only:** Only the owner can create share contacts

---

## Current UI Status

### ✅ **Working:**
- ShareStep1: Display contacts list
- ShareStep1: Select contact to share
- ShareStep1: Filter by group
- ShareStep2: Generate QR code
- ShareStep2: Share via Email, SMS, Copy URL

### ❌ **Not Implemented:**
- **Add Contact Dialog:** The "Add new contact" button just logs to console
- **Contact Form:** No UI to input contact details (name, email, etc.)
- **Custom Contact Codes:** No option to specify custom code (always random)

**Location:** `/components/cms/ShareManager.tsx` line 47-50
```typescript
const handleAddContact = () => {
  // TODO: Implement add contact dialog
  console.log('Add contact clicked');
};
```

---

## Migration Applied

### **Fix: Missing share_code Column**

**Migration:** `000_3_add_share_code_to_contacts.sql`

**What it does:**
- Checks if `share_code` column exists in `share_contacts` table
- Adds column if missing with default value 'public'
- Adds indexes for performance
- Safe to run multiple times

**How to apply:**
```bash
supabase db push
```

**Verify:**
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'share_contacts'
  AND column_name = 'share_code';
-- Should return: share_code | text | 'public'::text
```

---

## Summary

### ✅ **Confirmed Behavior:**

| Scenario | contact_code Generated? | Who Creates It? |
|----------|------------------------|-----------------|
| Owner creates share contact | ✅ YES | Owner (via API) |
| Visitor accesses group URL | ❌ NO | - |
| Visitor accesses contact URL | ❌ NO (uses existing) | - |
| Auto-generation for everyone | ❌ NO | - |

### **Contact Code Flow:**

```
1. Owner → "Add Contact" → Fill form → Submit
                                         ↓
2. API: api.shareContacts.create() → Generate random 8-char code
                                         ↓
3. Database: INSERT share_contacts with contact_code
                                         ↓
4. Return URL: /usercode/groupcode/contactcode
                                         ↓
5. Owner shares URL with specific person
                                         ↓
6. Person visits URL → Tracked individually
```

### **Key Takeaway:**

🔒 **Contact codes are OWNER-CREATED and PERSON-SPECIFIC**
- Not auto-generated for random visitors
- Not accessible without owner creating them
- Bound to specific contacts in database
- Enables individual engagement tracking

---

**Related Files:**
- `/lib/api.ts` - API implementation
- `/components/cms/ShareManager.tsx` - UI (TODO: Add Contact dialog)
- `/components/cms/ShareStep1.tsx` - Contact selection
- `/components/cms/ShareStep2.tsx` - Share options
- `/supabase/migrations/000_base_schema.sql` - share_contacts table
- `/supabase/migrations/000_3_add_share_code_to_contacts.sql` - Fix migration

**Last Updated:** 2025-01-28
