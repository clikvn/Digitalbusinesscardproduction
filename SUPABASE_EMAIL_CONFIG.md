# Supabase Email Configuration Guide

## How Supabase Email Templates Work

Supabase automatically uses the URLs we provide in our code. The email templates use the `{{ .ConfirmationURL }}` variable which is automatically populated by Supabase based on the URLs we pass.

## Current Configuration

### 1. Signup Confirmation Email

**Code Location**: `src/lib/api.ts` - `auth.signup()`

```typescript
const redirectUrl = `${window.location.origin}/auth/callback`;
await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: redirectUrl,  // This becomes {{ .ConfirmationURL }} in email
  },
});
```

**Email Template** (in Supabase Dashboard):
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
```

**Result**: When user clicks the link, they go to: `http://localhost:3000/auth/callback` (or production URL)

---

### 2. Password Reset Email

**Code Location**: `src/lib/api.ts` - `auth.forgotPassword()`

```typescript
const redirectUrl = `${window.location.origin}/auth/reset-password`;
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: redirectUrl,        // This becomes {{ .ConfirmationURL }} in email
  emailRedirectTo: redirectUrl,   // Some Supabase versions need this too
});
```

**Email Template** (in Supabase Dashboard):
```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

**Result**: When user clicks the link, they go to: `http://localhost:3000/auth/reset-password` (or production URL)

---

## How It Works

1. **We provide the URL** in our code (via `emailRedirectTo` or `redirectTo`)
2. **Supabase automatically** replaces `{{ .ConfirmationURL }}` in the email template with our URL
3. **No manual configuration needed** - Supabase handles the URL replacement automatically

## Required Supabase Dashboard Configuration

### 1. Email Templates
- Go to: **Supabase Dashboard > Authentication > Email Templates**
- Make sure templates use `{{ .ConfirmationURL }}` (default templates already do this)
- **Confirm signup** template should have: `<a href="{{ .ConfirmationURL }}">Confirm your mail</a>`
- **Reset password** template should have: `<a href="{{ .ConfirmationURL }}">Reset Password</a>`

### 2. Redirect URL Whitelist
- Go to: **Supabase Dashboard > Authentication > URL Configuration > Redirect URLs**
- Add these URLs (both local and production):
  - `http://localhost:3000/auth/callback` (for signup confirmation)
  - `http://localhost:3000/auth/reset-password` (for password reset)
  - `https://www.clik.id/auth/callback` (production signup confirmation)
  - `https://www.clik.id/auth/reset-password` (production password reset)
  - Or use wildcard: `http://localhost:3000/*` and `https://www.clik.id/*`

### 3. Email Confirmation Settings
- Go to: **Supabase Dashboard > Authentication > Settings**
- Enable: **"Confirm email"** checkbox
- This ensures users must verify email before accessing the app

## Verification Checklist

- [ ] Email templates use `{{ .ConfirmationURL }}` variable
- [ ] Redirect URLs are whitelisted in Supabase Dashboard
- [ ] "Confirm email" is enabled in Authentication Settings
- [ ] Test signup confirmation email works
- [ ] Test password reset email works

## Important Notes

1. **Supabase auto-detects**: Supabase automatically uses the URLs we provide - no manual template editing needed for URLs
2. **URL must be whitelisted**: The redirect URL MUST be in the whitelist, otherwise Supabase will reject it
3. **Template variables**: Supabase provides these variables:
   - `{{ .ConfirmationURL }}` - The redirect URL we provide
   - `{{ .Token }}` - The confirmation token (usually in URL hash)
   - `{{ .TokenHash }}` - Hashed token
   - `{{ .SiteURL }}` - Site URL from settings
   - `{{ .Email }}` - User's email address

## Troubleshooting: Password Reset Redirect URL Issue

### Problem
Sometimes password reset emails have incorrect redirect URLs:
- ❌ Wrong: `redirect_to=https://www.clik.id/` (missing `/auth/reset-password` path)
- ✅ Correct: `redirect_to=https://www.clik.id/auth/reset-password`

### Root Cause
If the redirect URL is **not whitelisted** in Supabase Dashboard, Supabase will:
1. Reject the redirect URL we provide in code (`https://www.clik.id/auth/reset-password`)
2. Fall back to the **Site URL** from dashboard settings (which is just the base URL without path: `https://www.clik.id`)
3. Result: Email links redirect to home page instead of reset password page

**Visual Explanation:**
```
Scenario 1: Redirect URL NOT whitelisted ❌
Code sends: https://www.clik.id/auth/reset-password
Supabase: "Not whitelisted, I'll use Site URL instead"
Email link: redirect_to=https://www.clik.id/  ← WRONG (missing path)

Scenario 2: Redirect URL IS whitelisted ✅
Code sends: https://www.clik.id/auth/reset-password
Supabase: "Whitelisted, I'll use this URL"
Email link: redirect_to=https://www.clik.id/auth/reset-password  ← CORRECT
```

### Solution

#### Step 1: Whitelist the Redirect URL
1. Go to **Supabase Dashboard > Authentication > URL Configuration > Redirect URLs**
2. **Add the exact redirect URL** (with full path):
   - `https://www.clik.vn/auth/reset-password` (production with www)
   - `https://clik.vn/auth/reset-password` (production without www - **REQUIRED if users can access via both domains**)
   - `http://localhost:3000/auth/reset-password` (local development)
3. **Or use wildcard** (recommended):
   - `https://www.clik.vn/*`
   - `https://clik.vn/*` (if users can access via both www and non-www)
   - `http://localhost:3000/*`

**⚠️ CRITICAL: Domain Mismatch Issue (www vs non-www)**
- **Problem:** If your site is accessible via both `https://www.clik.vn` AND `https://clik.vn` (with/without www)
- **Issue:** Code uses `window.location.origin` which could be either domain depending on how user accessed the site
- **Solution 1 (Recommended):** Whitelist BOTH domains in Supabase:
  - `https://www.clik.vn/auth/reset-password`
  - `https://clik.vn/auth/reset-password`
- **Solution 2:** The code now normalizes to www version automatically, but you should still whitelist both for safety
- **Best Practice:** Set `VITE_APP_SITE_URL=https://www.clik.vn` in environment variables to force consistent domain

#### Step 2: Verify Site URL Setting
1. Go to **Supabase Dashboard > Authentication > Settings**
2. Set **Site URL** to: `https://www.clik.id` (⚠️ **NO trailing slash** - remove the `/` at the end)
3. **CRITICAL:** If Site URL has a trailing slash (`https://www.clik.id/`), remove it!
   - Wrong: `https://www.clik.id/` ❌
   - Correct: `https://www.clik.id` ✅
4. **What "fallback" means:**
   - If your redirect URL (`https://www.clik.id/auth/reset-password`) is **NOT whitelisted**, Supabase will reject it
   - When rejected, Supabase falls back to using the **Site URL** (`https://www.clik.id`) instead
   - This causes the problem: `redirect_to=https://www.clik.id/` (missing the `/auth/reset-password` path)
   - **If redirect URLs ARE whitelisted**, Supabase will use your redirect URL from code (with the path), NOT the Site URL
5. **You should still set Site URL correctly** because:
   - It's used in email templates that reference `{{ .SiteURL }}` variable
   - It serves as a safety net if redirect URL whitelisting fails
   - It's a best practice for Supabase configuration
6. **Bottom line:** Site URL should be set (without trailing slash), but whitelisting redirect URLs is the main fix

#### Step 3: Verify Email Template
1. Go to **Supabase Dashboard > Authentication > Email Templates**
2. Open **"Reset Password"** template
3. **CRITICAL:** Ensure the link uses the correct template variable:
   - **Try using:** `<a href="{{ .RedirectTo }}">Reset Password</a>` (for password reset, this might work better)
   - **Or use:** `<a href="{{ .ConfirmationURL }}">Reset Password</a>` (standard variable)
   - **IMPORTANT:** Some Supabase versions require `{{ .RedirectTo }}` for password reset emails
   - **DO NOT use:** `{{ .SiteURL }}` - this will always use Site URL instead of your redirect URL
4. Do NOT hardcode URLs in the template - always use template variables
5. The template variable will be automatically populated with your `redirectTo` URL from code
6. **If using `{{ .RedirectTo }}`:** Make sure it's the full URL, not just the path

### Verification

#### Method 1: Check the Actual Email (Recommended)
1. **Request a password reset email** from your application
2. **Check your email inbox** for the password reset email
3. **Right-click on the "Reset your password" link** in the email
4. **Select "Copy link address"** (or "Copy link location" depending on your email client)
5. **Paste the link** somewhere to inspect it
6. **Look for the `redirect_to` parameter** in the URL

**Example of what you should see:**
```
✅ CORRECT:
https://tqpgffxiewfvrwkacqry.supabase.co/auth/v1/verify?token=...&type=recovery&redirect_to=https://www.clik.id/auth/reset-password

❌ WRONG (missing path):
https://tqpgffxiewfvrwkacqry.supabase.co/auth/v1/verify?token=...&type=recovery&redirect_to=https://www.clik.id/
```

#### Method 2: Check Supabase Dashboard Logs
1. Go to **Supabase Dashboard > Authentication > Logs**
2. Look for recent password reset email events
3. You can see if emails were sent successfully
4. **Note:** You cannot see the actual email content or links in the dashboard - you must check the actual email

#### Method 3: Use Browser Developer Tools
1. **Request password reset** from your application
2. **Open browser DevTools** (F12) > **Console** tab
3. **Look for `[forgotPassword]` logs** - these show the redirect URL being sent
4. The logs will show: `[forgotPassword] Sent to Supabase: { redirectTo: "https://www.clik.id/auth/reset-password" }`

#### Method 4: Test the Link
1. **Click the reset password link** in the email
2. **Check the URL** in your browser's address bar after clicking
3. **If working correctly:** You should be redirected to `https://www.clik.id/auth/reset-password` with tokens
4. **If wrong:** You'll be redirected to `https://www.clik.id/` (home page) instead

### Code Implementation
The code in `src/lib/api.ts` sets the correct redirect URL:
```typescript
const redirectUrl = `${baseUrl}/auth/reset-password`;
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: redirectUrl,  // Only 'redirectTo' is used, not 'emailRedirectTo'
});
```

**Important:** `resetPasswordForEmail` only accepts `redirectTo` parameter. Using `emailRedirectTo` (which is for `signUp`) can cause Supabase to ignore the redirect URL.

### Still Not Working? Double-Check These:

1. **Check Browser Console First (CRITICAL)**
   - Open browser DevTools (F12) > Console tab
   - Request a password reset
   - Look for `[forgotPassword]` logs
   - **Copy the exact URL** shown in: `[forgotPassword] ⚠️ VERIFY THIS EXACT URL IS IN SUPABASE WHITELIST:`
   - This is the EXACT URL being sent to Supabase - it MUST match your whitelist entry exactly

2. **Site URL Trailing Slash Issue (COMMON PROBLEM)**
   - Go to **Authentication > Settings > Site URL**
   - **Remove the trailing slash** if present
   - Wrong: `https://www.clik.id/` ❌
   - Correct: `https://www.clik.id` ✅
   - A trailing slash in Site URL can cause Supabase to ignore your redirect URL

3. **Exact URL Match (Case-Sensitive) - MOST IMPORTANT**
   - **Get the exact URL from browser console** (see step 1)
   - Whitelist entry must match EXACTLY (character for character)
   - Common mistakes:
     - Extra spaces before/after URL
     - Trailing slash: `https://www.clik.id/auth/reset-password/` ❌
     - Missing path: `https://www.clik.id` ❌
     - Case mismatch: `https://www.CLIK.id/auth/reset-password` ❌
   - Correct format: `https://www.clik.id/auth/reset-password` ✅

4. **Try Removing and Re-Adding Whitelist Entry**
   - Go to **Authentication > URL Configuration > Redirect URLs**
   - **Delete** the `https://www.clik.id/auth/reset-password` entry
   - **Wait 30 seconds**
   - **Add it back** exactly: `https://www.clik.id/auth/reset-password` (copy from console log)
   - This clears any caching issues

5. **Use Wildcard Instead (Recommended)**
   - Instead of exact URL, use: `https://www.clik.id/*`
   - This covers all paths under your domain
   - More reliable and easier to maintain
   - Make sure wildcard entry is: `https://www.clik.id/*` (with asterisk, no trailing slash before asterisk)
   - **Note:** Wildcard should work, but if exact URL doesn't work, wildcard might also fail

6. **Verify No Duplicate Entries**
   - Check if you have BOTH `https://www.clik.id/*` AND `https://www.clik.id/auth/reset-password`
   - Having both should be fine, but try removing the exact match and keep only the wildcard
   - Or vice versa - try keeping only the exact match

3. **Check Browser Console**
   - Open browser DevTools (F12) > Console tab
   - Request password reset
   - Look for `[forgotPassword]` logs
   - Verify the redirect URL being sent matches what's whitelisted

4. **Verify in Supabase Dashboard**
   - Go to **Authentication > URL Configuration > Redirect URLs**
   - Scroll through the list - make sure your URL is there
   - If using wildcard, ensure `https://www.clik.id/*` is listed
   - Try removing and re-adding the URL (sometimes helps with caching)

5. **Check Email Template**
   - Go to **Authentication > Email Templates > Reset Password**
   - Ensure link uses: `<a href="{{ .ConfirmationURL }}">`
   - Do NOT hardcode URLs in template

6. **Wait for Propagation**
   - Supabase changes can take a few minutes to propagate
   - Wait 2-3 minutes after adding to whitelist before testing

7. **Test with Different Email**
   - Sometimes cached emails use old redirect URLs
   - Try requesting reset for a different email address

## Testing

To test if emails are working:
1. Check **Supabase Dashboard > Authentication > Logs** for email delivery status
2. Try signing up a new user and check if confirmation email arrives
3. Try password reset and check if reset email arrives
4. Verify the links in emails point to correct URLs
