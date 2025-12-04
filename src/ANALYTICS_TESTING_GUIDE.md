# 🧪 Analytics Testing Guide

## 🎯 Goal: Test Visitor ID vs Session ID Tracking

You want to verify:
- ✅ **New Shares** = Unique PEOPLE (visitor_id)
- ✅ **Engaged Contacts** = Unique VISITS (session_id)

---

## ⏱️ **SESSION TIMEOUT: Now 1 Minute (for testing)**

I've changed the session timeout from **30 minutes → 1 minute** for easy testing.

**File**: `/utils/analytics.ts` line ~65
```javascript
const SESSION_TIMEOUT = 1 * 60 * 1000; // 1 minute for testing
```

**When you're done testing**, change it back:
```javascript
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes for production
```

---

## 🧪 **Test Scenarios**

### **Test 1: Same Person, Multiple Sessions** ✅

**Goal**: Same visitor_id, different session_id

**Steps**:
1. Open your DBC in **normal browser** (not incognito)
2. Check analytics dashboard:
   - New Shares: **1** (first person)
   - Engaged Contacts: **1** (first visit)
3. **Wait 2 minutes** ⏰ (session expires after 1 min)
4. **Refresh the page** or close/reopen tab
5. Check analytics dashboard:
   - New Shares: **1** ✅ (still same person)
   - Engaged Contacts: **2** ✅ (second visit!)

**Debug in Console**:
```javascript
// Check visitor_id (should be SAME)
localStorage.getItem('clikVisitor_YOUR_USER_CODE')

// Check session_id (should be DIFFERENT after timeout)
sessionStorage.getItem('clikSession_YOUR_USER_CODE_YOUR_SHARE_CODE')
```

---

### **Test 2: Page Refresh (Within 1 Min)** ✅

**Goal**: Same session_id = NO double-count

**Steps**:
1. Open your DBC
2. Check analytics:
   - Engaged Contacts: **1**
3. **Immediately refresh page** (within 1 min)
4. Check analytics:
   - Engaged Contacts: **1** ✅ (still same visit, no double-count)

---

### **Test 3: Incognito Mode** ✅

**Goal**: Understand incognito behavior

**Steps**:
1. Open DBC in **incognito window**
2. Check analytics:
   - New Shares: **+1** (new person - incognito has NO localStorage)
   - Engaged Contacts: **+1** (new visit)

**Why both increment?**
- Incognito = Isolated storage
- No previous visitor_id exists
- Creates NEW visitor_id + NEW session_id

**Note**: This is EXPECTED behavior. Each incognito window = new person.

---

### **Test 4: Multiple Browser Tabs (Normal Mode)** ✅

**Goal**: Same visitor_id, different session_id per tab

**Steps**:
1. Open DBC in **Tab 1**
2. Open DBC in **Tab 2** (new tab, same browser)
3. Check analytics:
   - New Shares: **1** ✅ (same person - shared localStorage)
   - Engaged Contacts: **2** ✅ (two tabs = two sessions - separate sessionStorage)

**Why?**
- `localStorage` is shared across tabs → Same visitor_id
- `sessionStorage` is per-tab → Different session_id

---

## 🔍 **Manual Testing Tools**

### **Option A: Browser Console Commands**

Open DevTools Console and run these:

```javascript
// ===================================
// CHECK CURRENT IDs
// ===================================

// Check visitor_id (localStorage - 90 day)
console.log('Visitor ID:', localStorage.getItem('clikVisitor_YOUR_USER_CODE'));

// Check session_id (sessionStorage - 1 min)
console.log('Session ID:', sessionStorage.getItem('clikSession_YOUR_USER_CODE_YOUR_SHARE_CODE'));

// ===================================
// FORCE NEW SESSION (Keep Visitor)
// ===================================

// Clear ONLY session (keeps visitor_id)
sessionStorage.removeItem('clikSession_YOUR_USER_CODE_YOUR_SHARE_CODE');
// Now refresh page → Same visitor, NEW session ✅

// ===================================
// FORCE NEW VISITOR (Reset Everything)
// ===================================

// Clear BOTH visitor and session
localStorage.removeItem('clikVisitor_YOUR_USER_CODE');
sessionStorage.removeItem('clikSession_YOUR_USER_CODE_YOUR_SHARE_CODE');
// Now refresh page → NEW visitor, NEW session ✅

// ===================================
// CHECK EXPIRY TIMES
// ===================================

// See when visitor_id was created
const visitor = JSON.parse(localStorage.getItem('clikVisitor_YOUR_USER_CODE'));
console.log('Visitor created:', new Date(visitor.createdAt));
console.log('Visitor expires:', new Date(visitor.createdAt + 90*24*60*60*1000));

// See when session was last active
const session = JSON.parse(sessionStorage.getItem('clikSession_YOUR_USER_CODE_YOUR_SHARE_CODE'));
console.log('Session last seen:', new Date(session.lastSeen));
console.log('Session expires:', new Date(session.lastSeen + 1*60*1000)); // 1 min timeout
```

---

### **Option B: Easy Testing Workflow**

**Test Same Person, Multiple Visits:**

```bash
# Visit 1
1. Open DBC → Check dashboard (New Shares: 1, Engaged: 1)
2. In console: sessionStorage.clear()
3. Refresh page → Check dashboard (New Shares: 1, Engaged: 2) ✅

# Visit 2
4. In console: sessionStorage.clear()
5. Refresh page → Check dashboard (New Shares: 1, Engaged: 3) ✅
```

**Test New Person:**

```bash
# New Person
1. In console: localStorage.clear() + sessionStorage.clear()
2. Refresh page → Check dashboard (New Shares: +1, Engaged: +1) ✅
```

---

## 📊 **Expected Results Summary**

| Action | New Shares (visitor_id) | Engaged Contacts (session_id) |
|--------|-------------------------|-------------------------------|
| First visit (normal browser) | 1 | 1 |
| Refresh page (within 1 min) | 1 | 1 (same session) |
| Wait 2 min + refresh | 1 | 2 (new session) |
| Clear sessionStorage + refresh | 1 | +1 (new session) |
| Clear localStorage + refresh | +1 | +1 (new person) |
| Open incognito window | +1 | +1 (isolated storage) |
| Open new tab (same browser) | 1 | +1 (separate sessionStorage) |

---

## 🐛 **Debugging**

**Not seeing metrics update?**

1. **Check browser console** for analytics batch messages:
   ```
   ✅ [Analytics] Batch successful
   ❌ [Analytics] Batch failed
   ```

2. **Run migrations** (if you haven't):
   - `/supabase/migrations/025_add_visitor_id_tracking.sql`
   - `/supabase/migrations/026_fix_analytics_foreign_keys.sql`
   - `/supabase/migrations/027_improve_batch_processing.sql`

3. **Check database**:
   ```sql
   -- See recent sessions with visitor_id
   SELECT 
     session_id,
     visitor_id,
     first_seen,
     last_seen
   FROM analytics_sessions
   ORDER BY first_seen DESC
   LIMIT 10;
   
   -- Count unique visitors vs sessions
   SELECT
     COUNT(DISTINCT visitor_id) as unique_people,
     COUNT(DISTINCT session_id) as unique_sessions
   FROM analytics_sessions;
   ```

4. **Clear cache**: Hard reload (Ctrl+Shift+R / Cmd+Shift+R)

---

## 🚀 **When Testing is Complete**

**Change session timeout back to 30 minutes:**

File: `/utils/analytics.ts` line ~65
```javascript
// Change from:
const SESSION_TIMEOUT = 1 * 60 * 1000; // 1 minute for testing

// To:
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes for production
```

---

## ✅ **Success Criteria**

You'll know it's working when:

- ✅ Refreshing page within 1 min = NO new Engaged Contact
- ✅ Waiting 2+ min then refresh = NEW Engaged Contact  
- ✅ Same person, multiple visits = Same New Shares, increasing Engaged Contacts
- ✅ Console shows: `✅ [Analytics] Batch successful`
- ✅ Dashboard metrics update in real-time

Happy testing! 🎉
