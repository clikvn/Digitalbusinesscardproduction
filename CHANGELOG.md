# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-09

### Added
- Initial release of Digital Business Card Production Platform
- CMS dashboard for managing business card content
- Supabase backend with Row Level Security (RLS)
- TanStack Query for server state management
- Analytics tracking system with dual tracking (visitor_id + session_id)
- Real-time analytics dashboard with share group filtering
- Date range filtering (7/30/90 days, custom)
- Share groups system (Public, Private, Business, Personal)
- Field visibility settings per share group
- Share code generation and QR code support
- Portfolio management with categories and drag-and-drop sorting
- Multiple media types support (Images, Video, Virtual Tour)
- Portfolio item click tracking
- Plan & quota system (Free, Premium, Admin)
- Usage logging and quota validation
- AI portrait generation feature with 4 style templates
- Template selection UI with full-screen mobile-friendly dialog
- Image positioning tools (Full-screen, Avatar, Face selection)
- Contact tracking via contactCode in URLs
- AI Assistant chat interface
- Conversation threads management
- Mobile-first responsive design
- Viewport height handling for mobile browsers

### Changed
- Consolidated 25+ root .md files into `/guidelines/` directory
- Updated project structure to match Figma Make flat structure
- Fixed path references in documentation files
- Enhanced troubleshooting guide in notes.md
- Removed react-helmet-async due to DOM conflict issues

### Fixed
- Analytics filter bar height set to 40px
- Template selection UI: Added `items-center` to flexbox container for centered template text on mobile
- UI refinement: Removed background color change on selection (text color only)

### Reverted
- Email verification feature (Dec 9, 2024)
  - Reverted due to Supabase free tier email confirmation limitations
  - Codebase restored to immediate signup flow (no email verification)
  - Can be reconsidered for production with proper email infrastructure

## [Unreleased]

### Changed
- Updated default myClik background image to use `src/assets/myClik.png` instead of the previous Figma asset
- Improved image loading in HomeBackgroundImage: Added image preloading and smooth fade-in transition to prevent progressive top-to-bottom loading effect
- Added menu button to homepage: Menu button now appears after the Share button in HomeNavBar for quick access to navigation menu
- Updated Menu button styling: Changed background from white to `bg-[#faf9f5]` and border to `border-[#e9e6dc]` to match the navigation sheet's background style
- Enabled AI Agent button for guest users: The AI Agent button in the navigation menu now works for guests, allowing them to ask questions about the owner via the chat widget
- Updated Edit Assistant button: Changed navigation from 'assistant' section to 'personal-ai' section to open the Personal AI page for logged-in users
- Removed duplicate AI Agent button: Removed redundant AI Agent button from authenticated section since the main navigation already provides access for all users
- Improved chat widget initialization: Chat widget now properly loads and initializes when visiting owner pages, automatically re-initializes when navigating between different owners, and is disabled on CMS/auth routes

### Fixed
- Fixed ugly progressive image loading in HomeBackgroundImage: Image now preloads completely before displaying with smooth fade-in animation

### Added
- CHANGELOG.md file for tracking all changes
- Dockerfile for Google Cloud Run deployment
- nginx.conf for serving static files in production
- .dockerignore for optimized Docker builds
- cloudbuild.yaml for Google Cloud Build CI/CD
- DEPLOYMENT.md with comprehensive deployment guide
- Environment variable support for Supabase credentials (VITE_SUPABASE_PROJECT_ID, VITE_SUPABASE_ANON_KEY)
- Docker build and run scripts in package.json
- External AI script integration support (window.__openAIAssistant hook)
- Chat widget integration via `useChatWidget` React hook
- Chat widget configured with hardcoded server URL and tenant ID (business-card-only)

### Changed
- Updated supabase-client.ts to use environment variables (preferred) with fallback to info file for local development
- Updated application name from 'figma-make-interior-designer' to 'digital-business-card-production'
- Updated vite.config.ts to maintain Figma Make asset aliases for backward compatibility while adding @assets alias
- AI Agent buttons now trigger external script via `window.__openAIAssistant()` instead of internal chat component

### Removed
- AI Assistant chat component (AIAssistant.tsx)
- Conversation Threads component (ConversationThreads.tsx)
- Conversation storage utility (conversation-storage.ts)
- All AI chat UI and state management from PublicLayout, CMSLayout, CMSDashboard, BusinessCardStudio
- AI chat integration from PortfolioItemEditor and InlinePortfolioItemForm

### Fixed
- Fixed Supabase client initialization error: Replaced CommonJS `require()` with ES module `import` syntax in `supabase-client.ts` to work with Vite's ES module system
- Fixed react-markdown className error: Wrapped ReactMarkdown component in a div to apply className (newer versions don't accept className prop directly)
- **CRITICAL FIX**: Updated Dockerfile to accept environment variables as build arguments (Vite requires env vars at build time, not runtime)
- Updated cloudbuild.yaml to pass build arguments to Docker build step
- Removed incorrect runtime env vars from Cloud Run deploy step (env vars are baked into build)

---

## Version History Summary

### September 2024
- Initial project setup
- Digital business card platform foundation
- CMS dashboard implementation
- Supabase backend integration

### October 2024
- Share groups feature
- Field visibility settings
- Share code generation

### November 2024
- Analytics system implementation
- Real-time dashboard
- Dual tracking system

### December 2024
- Portfolio analytics completion
- Documentation cleanup
- AI portrait generation feature
- Email verification attempt (reverted)

---

## Dependencies

### Core
- React 18.3.1
- TypeScript 5.x
- Vite 6.3.5
- TanStack Query 5.x
- Tailwind CSS 4.0
- Supabase (Latest)

### UI Components
- Shadcn UI (copied into codebase)
- Radix UI primitives
- Lucide React icons
- Recharts 2.15.2

### Forms & Validation
- React Hook Form 7.55.0
- Zod

### Other
- React Router DOM
- React Markdown
- Sonner 2.0.3 (toast notifications)

---

_For detailed version information, see `src/guidelines/version.md`_

