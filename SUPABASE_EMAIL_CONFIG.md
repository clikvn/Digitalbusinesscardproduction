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

## Testing

To test if emails are working:
1. Check **Supabase Dashboard > Authentication > Logs** for email delivery status
2. Try signing up a new user and check if confirmation email arrives
3. Try password reset and check if reset email arrives
4. Verify the links in emails point to correct URLs
