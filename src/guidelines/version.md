# Version Control

## Current Version

**1.0.0**

---

## Semantic Versioning Rules

**Format:** `MAJOR.MINOR.PATCH`

**Rules:**
- **MAJOR**: Breaking changes (API format, schema renames/deletions, architecture)
- **MINOR**: Non-breaking additions (new endpoints, tables, UI components)
- **PATCH**: Bug fixes, minor updates (typos, small refactors, styling)

---

## Recent Changes

### Dec 9, 2024 - Email Verification Attempt & Revert (REVERTED)
- **Attempted Implementation:**
  - Created VerifyEmailScreen component for email confirmation waiting page
  - Created AuthCallbackScreen component to handle email verification callback
  - Created ProtectedCMSRoute component to guard CMS routes
  - Modified signup flow to defer user data initialization until after email confirmation
  - Updated App.tsx with /auth/verify-email and /auth/callback routes
- **Issue:** Supabase free tier has email confirmation limitations
- **Resolution:** REVERTED all changes back to immediate signup flow (no email verification)
- **Status:** Codebase restored to pre-email-verification state
- **Note:** Email verification can be reconsidered for production with proper email infrastructure

### Dec 8, 2024 - AI Portrait Generation Feature (MEDIUM)
- Added AI portrait generation feature in HomeForm
- 4 style templates: Professional, Casual, Fashion, Fun
- Template selection UI: Full-screen mobile-friendly dialog
- Selection indicators: blue border, blue text, checkmark icon
- Template options: Simple (color bg) vs Place (environment bg) for Pro/Casual/Fashion
- UI fix: Added `items-center` to flexbox container for centered template text on mobile
- UI refinement: Removed background color change on selection (text color only)

### Dec 7, 2024 - Documentation Cleanup
- Consolidated 25+ root .md files into `/guidelines/` directory
- Updated `project_structure.md` to match Figma Make flat structure (no src/)
- Fixed path references in `Guidelines.md` and `coding_standards.md`
- Enhanced `notes.md` with troubleshooting guide

### Dec 5, 2024 - Portfolio Analytics Completion
- Implemented portfolio item click tracking
- Added "Play Video", "Open Image", "Open Virtual Tour" metrics
- Fixed analytics filter bar height to 40px
- Removed react-helmet-async (DOM conflict issue)

### Nov 2024 - Analytics System
- Dual tracking system (visitor_id + session_id)
- Real-time analytics dashboard
- Share group filtering
- Date range filtering (7/30/90 days, custom)

### Oct 2024 - Share Groups
- Multiple share groups (Public, Private, Business, Personal)
- Field visibility settings per group
- Share code generation

### Sept 2024 - Initial Release
- Digital business card platform
- CMS dashboard
- Supabase backend with RLS
- TanStack Query state management

---

## Breaking Changes Log

### v1.0.0 - Initial Release

**Changes:**
- Initial project setup
- Supabase backend with RLS
- TanStack Query state management
- Analytics tracking system

---

## Major Dependency Updates

| Dependency | Version | Date | Notes |
|------------|---------|------|-------|
| React | 18.x | - | Initial |
| TypeScript | 5.x | - | Initial |
| TanStack Query | 5.x | - | Initial |
| Tailwind CSS | 4.0 | - | Initial |
| Supabase | Latest | - | Initial |

---

_Last Updated: Dec 9, 2024_