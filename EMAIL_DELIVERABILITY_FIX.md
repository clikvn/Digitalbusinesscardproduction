# Email Deliverability Fix Guide - Prevent Emails Going to Spam

## Problem
Supabase confirmation emails are going to junk/spam folders even though SMTP is configured.

## Root Causes

1. **Missing Email Authentication Records** (SPF, DKIM, DMARC)
2. **Poor "From" Address Configuration**
3. **Email Content Triggers Spam Filters**
4. **Domain Reputation Issues**
5. **Missing Unsubscribe Links**

---

## Solution Steps

### 1. Configure Email Authentication Records (CRITICAL)

Email authentication is the #1 reason emails go to spam. You MUST set up SPF, DKIM, and DMARC records.

#### A. SPF Record (Sender Policy Framework)

**Purpose**: Tells email providers which servers are allowed to send emails from your domain.

**How to Add**:
1. Go to your domain DNS settings (wherever you manage DNS - Cloudflare, GoDaddy, etc.)
2. Add a TXT record:
   ```
   Type: TXT
   Name: @ (or your domain name)
   Value: v=spf1 include:_spf.supabase.co ~all
   ```
3. If using custom SMTP (Resend, SendGrid, etc.), add their SPF include:
   ```
   v=spf1 include:_spf.supabase.co include:spf.resend.com ~all
   ```

#### B. DKIM Record (DomainKeys Identified Mail)

**Purpose**: Cryptographically signs emails to prove they came from your domain.

**How to Get DKIM from Supabase**:
1. Go to **Supabase Dashboard > Authentication > Settings**
2. Scroll to **SMTP Settings** section
3. Look for **DKIM Public Key** or **DKIM Settings**
4. Copy the DKIM public key (usually looks like: `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3...`)

**How to Add**:
1. Go to your domain DNS settings
2. Add a TXT record:
   ```
   Type: TXT
   Name: supabase._domainkey (or whatever Supabase tells you)
   Value: [paste the DKIM public key from Supabase]
   ```

**If Using Custom SMTP**:
- Resend: Go to Resend dashboard > Domains > Your Domain > DNS Records
- SendGrid: Go to SendGrid dashboard > Settings > Sender Authentication > Domain Authentication
- Mailgun: Go to Mailgun dashboard > Sending > Domains > DNS Records

#### C. DMARC Record (Domain-based Message Authentication)

**Purpose**: Tells email providers what to do with emails that fail SPF/DKIM checks.

**How to Add**:
1. Go to your domain DNS settings
2. Add a TXT record:
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; ruf=mailto:dmarc@yourdomain.com; pct=100
   ```
3. Replace `dmarc@yourdomain.com` with your actual email
4. Start with `p=quarantine` (moves to spam), then change to `p=reject` after testing

**DMARC Policy Options**:
- `p=none` - Monitor only (start here)
- `p=quarantine` - Send to spam if fails
- `p=reject` - Reject completely (use after testing)

---

### 2. Configure Proper "From" Address in Supabase

**Critical**: Use a verified domain email address, NOT a generic email.

#### In Supabase Dashboard:

1. Go to **Authentication > Settings > SMTP Settings**
2. Set **"From" address** to: `noreply@yourdomain.com` or `hello@yourdomain.com`
   - ❌ **DON'T use**: `noreply@gmail.com` or generic emails
   - ✅ **DO use**: `noreply@yourdomain.com` (your actual domain)
3. Set **"From" name** to: `Your App Name` or `CLIK Digital Business Card`

#### Verify Domain in Supabase:

1. Go to **Authentication > Settings**
2. Look for **"Site URL"** - set to: `https://www.clik.id` (your production domain)
3. This helps with email reputation

---

### 3. Improve Email Templates Content

Spam filters check email content. Improve your templates:

#### A. Add Proper Email Structure

**Current Template (Basic)**:
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
```

**Improved Template (Better Deliverability)**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
    <h2 style="color: #333; margin-top: 0;">Confirm Your Email Address</h2>
    <p>Hello,</p>
    <p>Thank you for signing up! Please confirm your email address by clicking the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Confirm Email Address</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666; font-size: 12px;">{{ .ConfirmationURL }}</p>
    <p style="margin-top: 30px; font-size: 12px; color: #666;">
      If you didn't create an account, you can safely ignore this email.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="font-size: 12px; color: #999; text-align: center;">
      This email was sent by CLIK Digital Business Card<br>
      © 2024 CLIK JSC. All rights reserved.
    </p>
  </div>
</body>
</html>
```

#### B. Avoid Spam Trigger Words

**❌ Avoid**:
- "Free", "Click here", "Act now", "Limited time"
- ALL CAPS
- Excessive exclamation marks!!!
- "Click below" (use "Confirm your email" instead)

**✅ Use**:
- Professional language
- Clear call-to-action
- Proper grammar and spelling
- Your brand name

#### C. Add Text Version

Supabase allows both HTML and plain text versions. Add a plain text version:

**Plain Text Template**:
```
Confirm Your Email Address

Hello,

Thank you for signing up! Please confirm your email address by visiting this link:

{{ .ConfirmationURL }}

If you didn't create an account, you can safely ignore this email.

---
This email was sent by CLIK Digital Business Card
© 2024 CLIK JSC. All rights reserved.
```

---

### 4. Verify DNS Records Are Working

Use these tools to verify your DNS records are set up correctly:

1. **SPF Check**: https://mxtoolbox.com/spf.aspx
   - Enter your domain
   - Should show: `v=spf1 include:_spf.supabase.co ~all`

2. **DKIM Check**: https://mxtoolbox.com/dkim.aspx
   - Enter your domain
   - Should show your DKIM record

3. **DMARC Check**: https://mxtoolbox.com/dmarc.aspx
   - Enter your domain
   - Should show your DMARC policy

4. **All-in-One Check**: https://www.mail-tester.com/
   - Send a test email to the address they provide
   - Get a score (aim for 8+/10)
   - See detailed feedback on what to fix

---

### 5. Warm Up Your Domain (If New Domain)

If you're using a new domain or just set up email:

1. **Start Small**: Send 10-20 emails per day for first week
2. **Gradually Increase**: Increase by 20% each week
3. **Monitor**: Check spam rates and adjust
4. **Use Reputable SMTP**: Resend, SendGrid, Mailgun have better reputation than free services

---

### 6. Additional Supabase Settings

#### A. Enable Rate Limiting
- Go to **Authentication > Settings**
- Enable rate limiting to prevent abuse
- This improves sender reputation

#### B. Set Site URL
- Go to **Authentication > Settings**
- Set **Site URL** to: `https://www.clik.id`
- This is used in email links and improves reputation

#### C. Configure Custom SMTP (If Not Already)

If using custom SMTP provider (Resend, SendGrid, etc.):

1. Go to **Authentication > Settings > SMTP Settings**
2. Enable **"Use custom SMTP"**
3. Enter your SMTP credentials:
   - **Host**: (from your SMTP provider)
   - **Port**: Usually 587 or 465
   - **Username**: Your SMTP username
   - **Password**: Your SMTP password
   - **Sender email**: `noreply@yourdomain.com`
   - **Sender name**: `CLIK Digital Business Card`

---

### 7. Test Email Deliverability

#### A. Use Mail-Tester
1. Go to https://www.mail-tester.com/
2. Get a test email address
3. Sign up with that email in your app
4. Check the score (aim for 8+/10)

#### B. Test with Different Providers
- Send test emails to Gmail, Outlook, Yahoo
- Check if they arrive in inbox or spam
- Adjust based on results

#### C. Check Supabase Logs
1. Go to **Supabase Dashboard > Authentication > Logs**
2. Check email delivery status
3. Look for bounce or spam reports

---

### 8. Monitor and Maintain

#### A. Monitor Bounce Rates
- High bounce rates hurt reputation
- Remove invalid emails from your database
- Use double opt-in to verify emails

#### B. Monitor Spam Complaints
- If users mark emails as spam, investigate
- Make unsubscribe easy
- Only send emails users expect

#### C. Keep DNS Records Updated
- If you change SMTP providers, update SPF records
- Keep DKIM keys current
- Review DMARC reports regularly

---

## Quick Checklist

- [ ] SPF record added to DNS
- [ ] DKIM record added to DNS
- [ ] DMARC record added to DNS
- [ ] "From" address uses your domain (not Gmail/generic)
- [ ] Site URL set in Supabase settings
- [ ] Email templates improved (HTML + text version)
- [ ] Tested with mail-tester.com (score 8+/10)
- [ ] Tested with Gmail, Outlook, Yahoo
- [ ] Custom SMTP configured (if using)
- [ ] DNS records verified with mxtoolbox.com

---

## Common Issues and Solutions

### Issue: "SPF: Softfail"
**Solution**: Change SPF record from `~all` to `-all` (after testing)

### Issue: "DKIM: Not found"
**Solution**: Make sure DKIM record is added correctly in DNS

### Issue: "DMARC: Not found"
**Solution**: Add DMARC record to DNS

### Issue: "From address not verified"
**Solution**: Use email address from your verified domain

### Issue: "High spam score"
**Solution**: 
- Remove spam trigger words
- Add proper HTML structure
- Add text version
- Use professional language

---

## Resources

- **Mail-Tester**: https://www.mail-tester.com/ (Test email deliverability)
- **MXToolbox**: https://mxtoolbox.com/ (Check DNS records)
- **SPF Record Generator**: https://www.spf-record.com/
- **DMARC Analyzer**: https://www.dmarcanalyzer.com/
- **Supabase Email Docs**: https://supabase.com/docs/guides/auth/auth-email-templates

---

## Next Steps

1. **Immediate**: Add SPF, DKIM, DMARC records to DNS
2. **Today**: Update "From" address in Supabase to use your domain
3. **This Week**: Improve email templates with better HTML structure
4. **Ongoing**: Monitor deliverability and adjust as needed

After implementing these changes, wait 24-48 hours for DNS propagation, then test again. Most issues are resolved by proper email authentication (SPF/DKIM/DMARC).
