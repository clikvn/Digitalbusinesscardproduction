# Technical Notes

## General Notes

This file contains quick technical notes and reminders for the project.

---

## Recent Changes

**Dec 7, 2024:**
- Completed guidelines documentation cleanup
- Removed 25+ root-level .md files and consolidated into /guidelines/
- Updated project_structure.md to match actual Figma Make flat structure

**Dec 5, 2024:**
- Portfolio analytics tracking completed
- Analytics filter bar height standardized to 40px
- Removed react-helmet-async due to DOM conflicts

---

## Important Reminders

### Analytics
- "New Shares" = unique people (visitor_id, 90-day persistence)
- "Engaged Contacts" = unique sessions (session_id, 30-min timeout)
- Portfolio interactions tracked via exact click_target strings
- Batch events every 5 seconds before inserting

### Database
- No Edge Functions - use direct Supabase client calls
- RLS policies enforce all security
- initialize_user_data() RPC is critical for registration

### UI
- Don't override font-size, font-weight, line-height with Tailwind
- Use design tokens from globals.css
- Mobile-first approach (max-w-[500px] for business card)

### Code
- Named exports only (no default exports)
- TanStack Query for server state
- useMemo for expensive calculations
- useCallback for event handlers

---

## Common Issues

### Registration fails with "null value in share_code"
**Fix:** Migration 016_fix_initialize_user_data_rpc.sql fixed this issue
**Root Cause:** initialize_user_data() RPC was missing share_code column in INSERT statements
**Solution:** The fix added share_code to both the main INSERT and the EXCEPTION retry INSERT

### Analytics double-counting
**Fix:** Implemented dual tracking (visitor_id + session_id)
**Visitor ID:** 90-day localStorage persistence (unique people)
**Session ID:** 30-minute sessionStorage timeout (unique visits)

### Share code shows "public" instead of actual code
**Fix:** Use database query to resolve share_code from user_share_groups table
**Note:** Never hardcode "public" - always get actual share_code value

### Video embedding - YouTube/Vimeo URLs
**Issue:** HTML5 `<video>` tag doesn't work with YouTube/Vimeo URLs
**Reason:** YouTube/Vimeo URLs are web pages, not direct video files
**Solution:** Use `<iframe>` with embed URLs for YouTube/Vimeo, `<video>` for direct files (mp4, webm, ogg)

### Social media meta tags not updating
**Issue:** react-helmet-async updates don't show in social media previews
**Reason:** Social bots don't execute JavaScript - they only read static HTML
**Solution:** Meta tags must be in base HTML or use server-side rendering

---

## Deployment Notes

### Environment Variables Required
```env
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Critical Migrations (Must Run in Order)
1. **016_fix_initialize_user_data_rpc.sql** (REQUIRED for registration)
2. **025_add_visitor_id_tracking.sql** (Dual tracking system)
3. **029_fix_realtime_views_query_from_events.sql** (Analytics views)

### Deprecated Migrations (Do Not Run)
- ❌ 008-014 (trigger-based migrations) - Disabled in migration 015
- ❌ Migration 015 disabled all triggers in favor of RPC approach

---

## TODO / Future Enhancements

- QR code generation for share groups
- Password protection for private groups
- Export analytics (CSV/PDF)
- Custom domains
- Email reports
- Flowise AI integration (OpenAI kit removed, ready for Flowise)

---

_Last Updated: Dec 7, 2024_