# Open Graph Meta Tags Issue - Social Media Sharing

## The Problem

When sharing the app URL on social media (Facebook, WhatsApp, LinkedIn, Twitter), the preview shows old/incorrect information:

**Facebook Debug Results:**
```
og:title       Digital Business Card Prod
og:description Created with Figma
```

**Expected Results:**
```
og:title       CLIK DIGITAL BUSINESS CARD
og:description Digital business card platform by CLIK JSC
```

## Why This Happens

### Root Cause: Single Page Application (SPA) Limitation

1. **What We Did:** Added OG meta tags to `App.tsx` using `react-helmet-async`
   ```tsx
   <Helmet>
     <meta property="og:title" content="CLIK DIGITAL BUSINESS CARD" />
     <meta property="og:description" content="Digital business card platform by CLIK JSC" />
   </Helmet>
   ```

2. **The Problem:** These meta tags only appear **AFTER React executes JavaScript**

3. **What Social Media Bots See:**
   - Facebook/WhatsApp/LinkedIn bots fetch the URL
   - They get the **raw HTML file** (before React runs)
   - They **don't execute JavaScript** (for performance/security)
   - They only see meta tags in the **static HTML file**

4. **The Static HTML:** Figma Make serves a base `index.html` with default meta tags:
   ```html
   <!-- This is in Figma Make's base HTML file (not accessible in code) -->
   <meta property="og:title" content="Digital Business Card Prod" />
   <meta property="og:description" content="Created with Figma" />
   ```

### The Timeline

```
Social Media Bot Request → Figma Make Server → Static HTML (old meta tags)
                                                    ↓
                                            Bot reads meta tags
                                                    ↓
                                            Bot caches preview
                                                    ↓
                                            ❌ Shows old preview

Regular User Request → Figma Make Server → Static HTML → React loads → 
                                                          Helmet updates meta tags →
                                                          ✅ Browser shows new title
```

## Solutions

### Solution 1: Update Figma Make Platform Settings ⭐ RECOMMENDED

**Contact Figma Make support and ask:**
- How to update the default meta tags in the base HTML file
- If there's a settings panel for Open Graph meta tags
- If they support custom `index.html` configuration

**This is the cleanest solution** - update the source HTML file that Figma Make serves.

---

### Solution 2: Use Supabase Edge Function for Bot Detection 🛠️ TECHNICAL

**How It Works:**
1. Deploy the Edge Function at `/supabase/functions/og-meta-handler/`
2. Configure your domain to route through the Edge Function
3. Edge Function detects social media bots via User-Agent
4. Bots get pre-rendered HTML with correct OG tags
5. Regular users get normal React app

**Pros:**
- ✅ Full control over meta tags
- ✅ Works for all social media platforms
- ✅ Can customize per URL/route

**Cons:**
- ⚠️ Requires custom domain routing configuration
- ⚠️ Adds slight latency for bot requests
- ⚠️ More complex to maintain

**Implementation:**

The Edge Function is already created at `/supabase/functions/og-meta-handler/index.ts`

To deploy:
```bash
supabase functions deploy og-meta-handler
```

To test:
```bash
curl -H "User-Agent: facebookexternalhit/1.1" https://your-project.supabase.co/functions/v1/og-meta-handler
```

---

### Solution 3: Pre-render Static Pages 🏗️ ADVANCED

**Use a pre-rendering service:**
- Prerender.io
- Rendertron
- react-snap (build time)

These services pre-render your React app into static HTML at build time or on-demand.

**Pros:**
- ✅ Works for all bots and search engines
- ✅ Improves SEO
- ✅ Faster initial page load

**Cons:**
- ⚠️ Requires build process changes
- ⚠️ May not be supported by Figma Make platform
- ⚠️ Additional service/tooling needed

---

## Current Status

### ✅ What's Working
- Meta tags correctly added to React code
- Browser tab shows "CLIK DIGITAL BUSINESS CARD" for users
- Code is ready for SSR/pre-rendering

### ❌ What's Not Working
- Facebook scraper sees old meta tags from static HTML
- WhatsApp/LinkedIn/Twitter also see old meta tags
- Shared links show incorrect preview

### 🔧 Next Steps

1. **Immediate:** Contact Figma Make support about updating base HTML meta tags
2. **Alternative:** Deploy Supabase Edge Function solution if needed
3. **Long-term:** Consider migrating to platform with SSR support (Next.js, Remix, etc.)

---

## Testing Social Media Previews

After implementing a solution, test with these tools:

1. **Facebook/WhatsApp:**
   - https://developers.facebook.com/tools/debug/
   - Paste URL and click "Scrape Again"

2. **LinkedIn:**
   - https://www.linkedin.com/post-inspector/
   - Paste URL and click "Inspect"

3. **Twitter/X:**
   - https://cards-dev.twitter.com/validator
   - Paste URL and preview card

4. **General OG Tag Validator:**
   - https://www.opengraph.xyz/
   - https://metatags.io/

---

## Technical Notes

**Why react-helmet-async doesn't work for social bots:**
```javascript
// App.tsx - This runs AFTER page loads (client-side)
<Helmet>
  <meta property="og:title" content="CLIK DIGITAL BUSINESS CARD" />
</Helmet>

// What bots see (server-side static HTML):
<meta property="og:title" content="Digital Business Card Prod" />
```

**The execution timeline:**
```
1. Server sends HTML     → Bots read meta tags and STOP here ❌
2. Browser loads HTML    → Users see this
3. JavaScript executes   → Users see this
4. React renders         → Users see this
5. Helmet updates meta   → Users see this (but bots already left)
```

**Social media bots identified by User-Agent:**
- `facebookexternalhit` - Facebook/WhatsApp
- `Twitterbot` - Twitter/X
- `LinkedInBot` - LinkedIn
- `Slackbot` - Slack
- `TelegramBot` - Telegram
- `Discordbot` - Discord
- `WhatsApp` - WhatsApp direct

---

## References

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [React Helmet Async](https://github.com/staylor/react-helmet-async)
