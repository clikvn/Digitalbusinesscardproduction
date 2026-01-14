# Resend.com Email Authentication Setup Guide

## Overview
This guide will help you configure SPF, DKIM, and DMARC records for Resend.com to prevent emails from going to spam.

---

## Step 1: Add Your Domain to Resend

### 1.1 Login to Resend
1. Go to https://resend.com
2. Login to your account
3. Navigate to **Domains** in the left sidebar

### 1.2 Add Domain
1. Click **"Add Domain"** button
2. Enter your domain (e.g., `clik.id` or `www.clik.id`)
   - **Note**: Use your root domain (without www) for best results
3. Click **"Add Domain"**

### 1.3 Verify Domain Ownership
Resend will ask you to verify domain ownership. You'll need to add a TXT record to your DNS.

**TXT Record to Add**:
```
Type: TXT
Name: @ (or your domain name)
Value: [Resend will provide a unique verification code]
TTL: 3600 (or default)
```

**How to Add**:
1. Copy the verification code from Resend
2. Go to your DNS provider (Cloudflare, GoDaddy, Namecheap, etc.)
3. Add a TXT record with the verification code
4. Wait 5-10 minutes for DNS propagation
5. Click **"Verify"** in Resend dashboard

---

## Step 2: Configure SPF Record

### 2.1 Get SPF Record from Resend
After domain verification, Resend will show you DNS records to add.

**SPF Record** (Resend will provide this):
```
Type: TXT
Name: @ (or your domain name)
Value: v=spf1 include:resend.com ~all
TTL: 3600 (or default)
```

### 2.2 Add SPF Record to DNS

**If you DON'T have an existing SPF record**:
1. Go to your DNS provider
2. Add the TXT record exactly as Resend shows
3. Save and wait for propagation (5-10 minutes)

**If you ALREADY have an SPF record** (e.g., for Supabase):
You need to **modify** your existing SPF record to include Resend:

**Before** (Supabase only):
```
v=spf1 include:_spf.supabase.co ~all
```

**After** (Supabase + Resend):
```
v=spf1 include:_spf.supabase.co include:resend.com ~all
```

**Important**: You can only have ONE SPF record per domain. Combine all includes in a single record.

### 2.3 Verify SPF Record
1. Wait 5-10 minutes after adding
2. Go to https://mxtoolbox.com/spf.aspx
3. Enter your domain
4. Should show: `v=spf1 include:resend.com ~all` (or combined with Supabase)

---

## Step 3: Configure DKIM Record

### 3.1 Get DKIM Records from Resend
1. In Resend dashboard, go to **Domains**
2. Click on your domain
3. You'll see **"DNS Records"** section
4. Look for **DKIM** records (usually 3 CNAME records)

**Example DKIM Records** (Resend will provide unique values):
```
Type: CNAME
Name: resend._domainkey
Value: [unique-value].resend.com
TTL: 3600

Type: CNAME
Name: resend1._domainkey
Value: [unique-value].resend.com
TTL: 3600

Type: CNAME
Name: resend2._domainkey
Value: [unique-value].resend.com
TTL: 3600
```

### 3.2 Add DKIM Records to DNS
1. Copy each CNAME record from Resend
2. Go to your DNS provider
3. Add each CNAME record exactly as shown
4. Save all records
5. Wait 5-10 minutes for propagation

**Important**: 
- Add ALL DKIM records (usually 3)
- Use exact names and values from Resend
- These are CNAME records, not TXT records

### 3.3 Verify DKIM Records
1. Wait 5-10 minutes after adding
2. Go to https://mxtoolbox.com/dkim.aspx
3. Enter your domain
4. Should show your DKIM records

---

## Step 4: Configure DMARC Record

### 4.1 Create DMARC Record
DMARC is not provided by Resend - you need to create it yourself.

**DMARC TXT Record**:
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; ruf=mailto:dmarc@yourdomain.com; pct=100
TTL: 3600
```

**Replace**:
- `dmarc@yourdomain.com` with your actual email (e.g., `dmarc@clik.id`)
- Or use a monitoring service like `dmarc@dmarcanalyzer.com`

### 4.2 DMARC Policy Options

**Start with `p=quarantine`** (sends to spam if fails):
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; pct=100
```

**After testing, use `p=reject`** (rejects if fails):
```
v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com; pct=100
```

**For monitoring only** (start here if unsure):
```
v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com; pct=100
```

### 4.3 Add DMARC Record to DNS
1. Go to your DNS provider
2. Add TXT record:
   - **Name**: `_dmarc`
   - **Value**: Your DMARC policy (from above)
   - **TTL**: 3600
3. Save and wait 5-10 minutes

### 4.4 Verify DMARC Record
1. Wait 5-10 minutes after adding
2. Go to https://mxtoolbox.com/dmarc.aspx
3. Enter your domain
4. Should show your DMARC policy

---

## Step 5: Configure Resend in Supabase

### 5.1 Get Resend API Key
1. In Resend dashboard, go to **API Keys**
2. Click **"Create API Key"**
3. Name it (e.g., "Supabase SMTP")
4. Copy the API key (starts with `re_`)

### 5.2 Get Resend SMTP Credentials
1. In Resend dashboard, go to **SMTP**
2. You'll see SMTP settings:
   - **Host**: `smtp.resend.com`
   - **Port**: `587` (or `465` for SSL)
   - **Username**: `resend`
   - **Password**: Your API key (starts with `re_`)

### 5.3 Configure in Supabase
1. Go to **Supabase Dashboard > Authentication > Settings**
2. Scroll to **SMTP Settings**
3. Enable **"Use custom SMTP"**
4. Enter Resend credentials:
   - **Host**: `smtp.resend.com`
   - **Port**: `587`
   - **Username**: `resend`
   - **Password**: Your Resend API key
   - **Sender email**: `noreply@yourdomain.com` (use your verified domain)
   - **Sender name**: `CLIK Digital Business Card`
5. Click **"Save"**

### 5.4 Test SMTP Connection
1. In Supabase, click **"Send test email"**
2. Enter your email address
3. Check if test email arrives
4. If it fails, verify:
   - API key is correct
   - Domain is verified in Resend
   - DNS records are propagated

---

## Step 6: Verify All Records

### 6.1 Complete DNS Checklist

Verify all records are added correctly:

- [ ] Domain verification TXT record
- [ ] SPF record (includes `resend.com`)
- [ ] DKIM records (3 CNAME records)
- [ ] DMARC record (`_dmarc` TXT)

### 6.2 Use Verification Tools

**All-in-One Check**:
1. Go to https://www.mail-tester.com/
2. Get a test email address
3. Send a test email from Resend
4. Check your score (aim for 8+/10)

**Individual Checks**:
- SPF: https://mxtoolbox.com/spf.aspx
- DKIM: https://mxtoolbox.com/dkim.aspx
- DMARC: https://mxtoolbox.com/dmarc.aspx

### 6.3 Check in Resend Dashboard
1. Go to **Domains** in Resend
2. Click on your domain
3. Check **"DNS Status"** - should show all green checkmarks
4. If any are red, click to see what's missing

---

## Step 7: Common Issues and Solutions

### Issue: "SPF record not found"
**Solution**: 
- Make sure SPF record is added as TXT record
- Check record name is `@` or your domain name
- Wait 10-15 minutes for DNS propagation

### Issue: "DKIM verification failed"
**Solution**:
- Make sure all 3 DKIM CNAME records are added
- Check names are exactly as Resend shows (case-sensitive)
- Verify values are correct
- Wait for DNS propagation

### Issue: "Domain not verified"
**Solution**:
- Add the verification TXT record Resend provides
- Wait 5-10 minutes
- Click "Verify" again in Resend

### Issue: "Emails still going to spam"
**Solution**:
- Wait 24-48 hours for DNS propagation and reputation building
- Check mail-tester.com score
- Verify DMARC is set to `p=quarantine` or `p=reject`
- Make sure "From" address uses your verified domain

---

## Step 8: Final Configuration

### 8.1 Update Supabase Email Templates
Make sure Supabase email templates use your domain in links:

1. Go to **Supabase Dashboard > Authentication > Email Templates**
2. Update templates to use `{{ .SiteURL }}` variable
3. Ensure links point to your domain

### 8.2 Set Site URL in Supabase
1. Go to **Supabase Dashboard > Authentication > Settings**
2. Set **Site URL** to: `https://www.clik.id` (your production domain)
3. This improves email reputation

### 8.3 Monitor Email Deliverability
1. Check Resend dashboard for delivery stats
2. Monitor bounce rates
3. Check spam complaints
4. Review DMARC reports (sent to email in DMARC record)

---

## Quick Reference: DNS Records Summary

### For Resend Only:
```
# SPF
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all

# DKIM (3 records - Resend will provide exact values)
Type: CNAME
Name: resend._domainkey
Value: [from Resend]

Type: CNAME
Name: resend1._domainkey
Value: [from Resend]

Type: CNAME
Name: resend2._domainkey
Value: [from Resend]

# DMARC
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; pct=100
```

### For Resend + Supabase Combined:
```
# SPF (combined)
Type: TXT
Name: @
Value: v=spf1 include:_spf.supabase.co include:resend.com ~all

# DKIM (add Resend's 3 CNAME records + Supabase's DKIM if needed)
# DMARC (same as above)
```

---

## Next Steps

1. ✅ Add domain to Resend and verify
2. ✅ Add SPF record (combine with Supabase if needed)
3. ✅ Add DKIM records (3 CNAME records from Resend)
4. ✅ Add DMARC record
5. ✅ Configure Resend SMTP in Supabase
6. ✅ Test with mail-tester.com
7. ✅ Wait 24-48 hours for full propagation
8. ✅ Monitor deliverability

After completing these steps, your emails should have much better deliverability and land in inboxes instead of spam folders!

---

## Support Resources

- **Resend Documentation**: https://resend.com/docs
- **Resend Support**: support@resend.com
- **DNS Propagation Check**: https://www.whatsmydns.net/
- **Email Testing**: https://www.mail-tester.com/
