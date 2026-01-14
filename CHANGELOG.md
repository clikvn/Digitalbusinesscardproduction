# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Copy Icon Size**: Updated copy icons to 24x24px (from 16x16px) for better visibility
  - Updated copy icons in phone number and email dialogs in ContactButtons component
  - Updated copy icon in email signature dialog in ShareStep2 component
- **Email Dialog Text**: Updated email provider selection text to be more action-oriented
  - Changed "Select Email Provider:" to "Send mail using website" for better user guidance
  - Changed "Open Email Client" to "Send email using client app" for clearer action description
  - Updated translations in both English and Vietnamese locales
- **Email Dialog Layout**: Reordered email dialog sections for better user flow
  - Moved "Send email using client app" section above "Send mail using website" section
  - Client app option now appears first, followed by webmail provider options

### Fixed
- **Desktop Email Button Handling**: Improved email interaction on desktop devices with provider selection
  - On mobile platforms: Email button opens email client via `mailto:` link (existing behavior)
  - On desktop platforms: Email button opens dialog with email provider options
  - Users can choose between Gmail and Outlook with actual Flaticon brand logos
  - Gmail icon: Created by Freepik - Flaticon (https://www.flaticon.com/free-icons/gmail)
  - Outlook icon: Created by Pixel perfect - Flaticon (https://www.flaticon.com/free-icons/outlook)
  - Each provider button opens the webmail compose page with recipient email pre-filled
  - Removed auto-detection - users select their own email provider instead
  - Additional options: "Open Email Client" (for installed apps) and "Copy Email" (to clipboard)
  - Provider buttons display authentic Flaticon logos for better recognition
  - Dialog shows recipient email address clearly at the top
  - Added translation keys for email provider selection in English and Vietnamese
- **Desktop Phone Number Handling**: Improved phone number interaction on desktop devices
  - On mobile platforms (Android, iOS, etc.): Phone button opens dialer app via `tel:` link (existing behavior)
  - On desktop platforms (Windows, Mac, Linux): Phone button opens dialog showing phone number with copy button
  - Improved device detection to check actual platform capability rather than screen size
  - Detection focuses on whether platform supports `tel:` protocol (mobile platforms) vs desktop platforms
  - Desktop users can now easily copy phone numbers to clipboard
  - Dialog includes phone number display and copy button with toast notification
  - Added translation keys for phone number dialog in English and Vietnamese
- **Facebook URL Format Support**: Enhanced Facebook URL detection to support multiple URL formats
  - Updated `extractFacebookUsername` to handle `profile.php?id=...` format (e.g., `https://www.facebook.com/profile.php?id=100054995627099`)
  - Now supports both username format (`https://facebook.com/vuphamtrantuan`) and numeric ID format (`https://www.facebook.com/profile.php?id=100054995627099`)
  - Updated `socialChannelUrlPatterns.facebook` to automatically detect numeric IDs and generate correct `profile.php?id=` URLs
  - Updated transformer to use same logic for consistent URL generation
  - Supports both `www.facebook.com` and `facebook.com` domains
  - Users can now paste any Facebook URL format and it will be correctly parsed and stored
- **Analytics Page Blank Screen for New Users**: Fixed "ReferenceError: t is not defined" error that caused blank screen on analytics page
  - `PageStatsBlock` component was using `t()` translation function without access to `useTranslation` hook
  - Added `t` as a required prop to `PageStatsBlock` component and passed it from parent `AnalyticsDashboard`
  - Added null safety checks for profile data in `getAllScreenElements` useMemo to prevent crashes when profile is loading
  - Added early return in `AnalyticsDashboard` to show loading state when profile is not yet loaded
  - Added optional chaining (`?.`) throughout profile property access to prevent crashes on new accounts
  - Analytics page now properly shows loading state and handles new users without profile data gracefully
- **Email Confirmation Link Misrouting**: Fixed critical bug where email confirmation links were incorrectly routed to password reset page
  - Token detection logic in App.tsx was too broad, matching `access_token` for both password reset AND email confirmation
  - Email confirmation links have `type=signup` (or no type), while password reset links have `type=recovery`
  - Updated App.tsx to only redirect to `/auth/reset-password` when `type=recovery` is explicitly present
  - Updated PasswordResetScreen to detect and redirect email confirmation links to `/auth/callback` instead
  - Email confirmation links now correctly go to `/auth/callback` and process properly
  - Prevents users from seeing password reset form when clicking email confirmation links
- **Password Reset Email Redirect**: Fixed issue where password reset email links redirected to home page instead of password reset page
  - Improved password reset token detection in App.tsx to catch all token formats (hash and query params)
  - Added check to skip session clearing on password reset page (user needs session to reset password)
  - Enhanced PasswordResetScreen to better handle tokens from email links
  - Added early return in App.tsx redirect logic to prevent other redirects from interfering
  - Password reset links now properly redirect to `/auth/reset-password` page with tokens preserved
  - Users can now successfully reset their password when clicking email links
  - Standardized reset email `redirect_to` by supporting `VITE_APP_SITE_URL` (prevents clik.id vs www.clik.id mismatches)
- **Signup with Existing Email**: Fixed issue where users could register with an existing email and be redirected to verification page
  - Created RPC function `check_email_exists()` to check if email exists in auth.users BEFORE signup
  - Added pre-signup email check to prevent duplicate registrations (runs before Supabase signUp call)
  - Added check for existing user in `user_code_ownership` table after signup as additional safety
  - Check happens BEFORE signup attempt to prevent any processing of existing emails
  - Improved error detection to catch all variations of "user already registered" errors from Supabase
  - Added detection for error codes and status codes (422, 400) that indicate existing email
  - Users attempting to sign up with existing email now see proper error message immediately
  - Form automatically switches to login form when email already exists
  - Form fields are cleared when showing "email already registered" error
  - Prevents redirect to register success page when email already exists in database
  - **Note**: Requires running migration `049_check_email_exists.sql` in Supabase Dashboard
- **CRITICAL SECURITY FIX: Unauthorized Access Prevention**: Fixed critical security vulnerability where users could access other users' studio/CMS by manipulating URLs
  - Added user code ownership verification in `CMSLayout` before allowing access to studio/CMS features
  - System now checks if logged-in user actually owns the user code they're trying to access
  - Unauthorized access attempts are logged and users are redirected to their own studio or home page
  - Prevents copy-paste URL attacks like accessing `/123/studio` when user doesn't own user code "123"
  - Added translation keys for unauthorized access error messages in English and Vietnamese
  - This was a critical security vulnerability that could allow users to access and modify other users' data
- **Register Success Page Redirect**: Fixed issue where register success page was not showing after registration
  - Improved email confirmation detection logic in signup flow to reliably check `email_confirmed_at` field
  - Added better logging to debug email confirmation requirements
  - Ensured proper navigation timing with setTimeout to prevent race conditions
  - Now correctly redirects to `/auth/register-success` page when email confirmation is required
  - Enhanced login flow to also redirect unverified users to register-success page with consistent navigation pattern
  - Users attempting to login with unconfirmed email are now properly redirected to register-success page with verification instructions
  - Fixed issue where Supabase throws "Email not confirmed" error (400 Bad Request) before email verification check
  - Added error handling to catch AuthApiError for unconfirmed emails and redirect to register-success page
  - Both error handling paths (direct check and catch block) now properly handle email confirmation errors

### Added
- **Email Verification Enforcement**: Strict email verification requirement before accessing main features
  - Created `RegisterSuccessScreen` component that displays after registration with success message and email verification guidance
  - Users are redirected to register success page after signup when email confirmation is required
  - Added email verification check in login flow to prevent unverified users from logging in
  - Added email verification check in `CMSLayout` to prevent unverified users from accessing CMS/studio features
  - Unverified users are automatically signed out and redirected to register success page with clear instructions
  - Added translation keys for register success page in both English and Vietnamese
  - Users must verify their email before they can access any main features of the application
- **Auto-Login Prevention**: Removed all auto-login functionality to prevent bypassing email verification
  - Added global session check in `App.tsx` that clears unverified sessions on app start
  - Modified `PublicLayout` to check email verification in both initial auth check and `onAuthStateChange` listener
  - Enhanced `CMSLayout` with immediate unverified session clearing on mount to prevent race conditions
  - All persisted sessions are now validated for email verification before allowing access
  - Users must explicitly log in through the authentication screen - no automatic session restoration

### Changed
- **Language Switcher with Flag Icons**: Updated LanguageSwitcher component to display country flag icons
  - Installed `react-country-flag` library for proper flag icon rendering
  - Button now shows the SVG flag icon (US for English, VN for Vietnamese) corresponding to the currently selected language instead of Globe icon
  - Dropdown menu items now display SVG flag icons alongside language labels
  - Provides better visual feedback for language selection with high-quality flag icons
- **Share Contact UX Improvements**: Enhanced Share Contact interface for better usability
  - Made entire contact container clickable to trigger share feature (no longer need to click small share icon)
  - Moved group filter functionality to filter icon in search bar (matches My Business page pattern)
  - Added Popover-based filter menu with checkboxes for group selection
  - Added filter badge display showing selected group with remove option
  - Added clear filters button (X icon) when search query or group filter is active
  - Group cards in horizontal scroll area are now for display/group sharing only (no longer filter on click)
  - Contact edit functionality remains accessible by clicking on the contact info area (stops propagation to prevent share)
  - Improved visual feedback with primary color highlighting on filter icon when filter is active
- **Navigation Menu Layout**: Moved language selection to the left of Plan Badge in NavigationMenu
  - Language switcher now appears before the Plan Badge in the top-left corner of the navigation menu

### Added
- **Comprehensive Multi-Language Translation**: Completed translation implementation across the entire application
  - Updated `AuthScreen` component with full Vietnamese translations for all authentication flows (login, signup, password reset, email confirmation)
  - Updated `PasswordResetScreen` component with Vietnamese translations
  - Updated `ContactButtons` component (Phone, Email, AI Agent buttons) with translations
  - Updated `BusinessCardStudio` component with translations for all card titles and descriptions
  - Updated `CMSDashboard` component with translations for menu items and messages
  - Updated `PublicLayout` and `CMSLayout` components with translations for error messages and notifications
  - Expanded translation files (`en.json`, `vi.json`) with comprehensive keys for:
    - Studio card descriptions
    - Error messages (password validation, reset link errors, etc.)
    - Common UI elements (Phone, Email, User)
    - Additional authentication flows
  - All user-facing text (except data loaded from database) is now translatable between English and Vietnamese
  - Language preference persists across sessions via localStorage
- **Multi-Language Support (i18n)**: Added internationalization support with English and Vietnamese languages
  - Installed `react-i18next`, `i18next`, and `i18next-browser-languagedetector` packages
  - Created i18n configuration in `src/lib/i18n.ts` with automatic language detection from browser/localStorage
  - Created translation files: `src/locales/en.json` (English) and `src/locales/vi.json` (Vietnamese)
  - Created `LanguageSwitcher` component for switching between languages
  - Language preference is stored in localStorage and persists across sessions
  - Updated `AccountErrorPage` component to use translations
  - Updated `PublicLayout` to use translations for error messages
  - Integrated i18n into `main.tsx` to initialize on app startup
  - Initial translations include: common terms, navigation labels, error messages, and auth labels
- **Automatic URL Extraction for Social Media Inputs**: Added automatic username/ID extraction from URLs in contact editing forms
  - When users paste full URLs (e.g., "https://zalo.me/0902452024") into social media or messaging app fields, the system automatically extracts just the username/ID (e.g., "0902452024")
  - Supports both full URLs and plain usernames/IDs - if no URL pattern is detected, the value is used as-is
  - Works for all messaging apps (Zalo, Messenger, Telegram, WhatsApp, KakaoTalk, Discord, WeChat) and social channels (Facebook, LinkedIn, Twitter/X, YouTube, TikTok)
  - Handles various URL formats including protocols, www prefixes, and different domain patterns
  - Created `social-url-parser.ts` utility with extraction functions for each platform
  - Applied to ContactForm component for seamless user experience
- **Clickable Preview Links in Contact Form**: Made preview links below each social media input field clickable
  - Preview links are now clickable anchor tags that open in a new tab
  - Links are only clickable when a username/ID is entered (placeholder text remains non-clickable)
  - Users can click the preview link to verify if they pasted the correct username/ID
  - Links use blue color with underline and hover effect for better UX
  - Applied to all messaging apps and social channels in ContactForm
- **AI Agent Assistant Disabled**: Disabled AI Agent Assistant section in Contact Form with "Coming soon" message
  - Section is now disabled (opacity reduced, cursor-not-allowed)
  - Shows "Coming soon" text instead of description
  - FieldVisibilityPopover is disabled (pointer-events-none) to prevent interaction
  - Prevents users from clicking on the feature until it's ready

### Fixed
- **Portfolio Page iframeRef Error**: Fixed ReferenceError where `iframeRef` was not defined in PortfolioItemDisplay component
  - Added missing `iframeRef` definition using `useRef<HTMLIFrameElement>(null)`
  - Fixes error when viewing portfolio items with embedded videos (YouTube/Vimeo)
  - Prevents page crashes on portfolio page when videos are displayed
- **Login Button Navigation**: Fixed login button navigating to wrong URL (e.g., `/srqajrvs/auth` instead of `/auth`)
  - Changed `onLogin` handler in PublicLayout from `buildCMSUrl(getUserCode())` to `/auth`
  - Login button now correctly navigates to `/auth` route instead of user-specific auth route
  - Fixes issue where login button showed URLs like `https://clik.id/srqajrvs/auth` instead of proper auth page
- **Deactivated Employee Profile Access**: Blocked public access to deactivated employee profiles
  - Added check in `api.card.get` to verify if user is a deactivated employee before returning profile data
  - Uses `check_employee_status` RPC function to check employee status
  - Deactivated employee profiles now throw `EMPLOYEE_DEACTIVATED` error and are inaccessible to anyone (including public links)
  - Prevents deactivated employees' profiles from being viewed even if someone has their profile link
  - Default page (`/myclik`) is excluded from employee status check and returns null if no card data (hook handles it with defaultBusinessCardData)
  - Login protection already in place: deactivated employees are signed out immediately after login attempt in AuthScreen and CMSLayout
- **Error Messages for Invalid User Codes and Deactivated Accounts**: Added proper error handling and user feedback
  - Modified `api.card.get` to throw specific errors: `USER_CODE_NOT_FOUND` for invalid user codes and `EMPLOYEE_DEACTIVATED` for deactivated employees
  - Updated `usePublicBusinessCard` to propagate these errors instead of returning empty data
  - Created `AccountErrorPage` component to display beautiful error pages for invalid user codes and deactivated accounts
  - Updated `PublicLayout` to show error page instead of toast messages when account is not available or deactivated
  - Error page displays centered message in a beautiful container with icon
  - Added "Back to Welcome Page" button on error page that navigates to default page (/myclik)
  - Users now see clear error pages instead of being redirected to default profile
  - Error messages: "This account is not available. The user code you entered does not exist." and "This account has been deactivated and is no longer available."
- **Forgot Password / Password Reset**: Implemented password recovery functionality
  - "Forgot password?" link on login screen
  - Password reset email sent via Resend SMTP
  - New `PasswordResetScreen` component handles reset token exchange
  - Added `/auth/reset-password` route for password reset flow
  - Users can reset password via email link without deleting account
  - Password reset redirects to login with success message
  - API functions: `api.auth.forgotPassword()` and `api.auth.resetPassword()`
- **Email Confirmation for New Registrations**: Implemented email confirmation flow for new user signups
  - Users receive a confirmation email after registration with a verification link
  - New `AuthCallbackScreen` component handles email confirmation token exchange
  - Added `/auth/callback` route to process email confirmation redirects
  - Signup flow now detects when email confirmation is required and shows "Check Your Email" UI
  - After email verification, users are redirected to login page with success message
  - User data initialization happens after email confirmation (not during initial signup)
  - Existing users are not affected - only applies to new registrations
  - **Supabase Dashboard Configuration Required**:
    - Enable "Confirm email" in Authentication > Settings
    - Add `https://www.clik.id/auth/callback` to Authentication > URL Configuration > Redirect URLs
    - Add `http://localhost:3000/auth/callback` for local development

### Fixed
- **Edit Permissions Dialog Mobile Responsiveness**: Fixed height issues on iPhone SE and iPhone 12
  - Dialog uses `100dvh` (dynamic viewport height) for proper mobile fit
  - Restructured component with single scrollable content area and fixed footer
  - Reduced padding, spacing, and text sizes on mobile screens
  - Footer buttons are always visible at bottom with proper sizing
  - Summary, options, and field groups all scroll together within available space
- **Complete Logout and Cache Clearing**: Fixed issue where users had to logout twice to see login menu
  - Now clears ALL React Query cache on logout to prevent auto-login from cached data
  - Clears all Supabase session storage from both localStorage and sessionStorage
  - Created `logout-utils.ts` utility function for consistent logout behavior
  - Ensures complete session removal - no auto-login after logout
  - Applied to all logout locations (PublicLayout, CMSLayout)
- **Logout 403 Error**: Fixed 403 Forbidden error when logging out
  - Changed `signOut()` to `signOut({ scope: 'local' })` to clear session locally without requiring server permission
  - Added error handling to gracefully handle any signOut failures
  - Local scope signOut clears the session without making a server request that might fail
  - Applied fix to all logout locations (PublicLayout, CMSLayout, AuthScreen)
- **Navigation Menu After Logout**: Fixed issue where navigation menu still showed authenticated features (Business Card Studio, Edit sections, etc.) after user logged out
  - Immediately updates `isAuthenticated` state to `false` and clears `userId` when logout is called
  - Removes all user-related queries from cache (user-plan, is-business-owner, is-employee, business-employees, etc.)
  - Closes menu immediately on logout to force re-render with updated state
  - Updated NavigationMenu to only fetch user plan when user is authenticated
  - Added useEffect to clear user plan cache when authentication status changes to false
  - Ensures guest users only see public navigation options (Home, Contact, Profile, Portfolio, Login)
- **Business Section Cache Issue**: Fixed cache issue where free plan users could see the Business Section in Studio page
  - Reduced staleTime for business owner/employee queries from 5 minutes to 10 seconds
  - Added `refetchOnMount: 'always'` to ensure fresh data on component mount
  - Added `refetchOnWindowFocus: true` to refetch when window regains focus
  - This prevents stale cache from showing Business section to users who don't have business plan
- **Promotion Code Validation**: Fixed promotion code validation error handling to properly check both `success` and `valid` response fields, and improved error messages to be more specific (code not found, expired, inactive, already used, etc.)
- **Promotion Code UI**: Added "Enter" button with arrow icon beside the promotion code input field for better UX and clearer call-to-action
- **Business Plan Upgrade**: Page now automatically reloads after successfully applying a business promotion code to show the "My Business" section in the Studio Page

### Changed
- **Premium Plan Badge**: Removed "Most Popular" tag from Premium plan in upgrade dialog
- **Business Logo Upload Container**: Updated the logo upload placeholder to 80x80px on the My Business page when no logo is uploaded
- **QR Code Logo**: QR code center logo now uses the logo from `qr_code_logo.svg` instead of profile image
  - Logo is always displayed in the center of the QR code
  - Maintains the same styling (white circular background with border and shadow)
- **VCF Save Feature Respects Share Config**: VCF file generation now respects share group visibility settings
  - Only visible fields (based on share config) are included in the downloaded VCF file
  - Hidden fields are excluded from the contact card
  - Applies to both public profile save and CMS share step save features
- **Mobile VCF Download Support**: Improved VCF file download experience on mobile devices
  - Uses Web Share API on mobile devices (iOS 13+, Android) for better compatibility
  - Falls back to data URL approach for iOS devices
  - Provides clear feedback messages about where to find the downloaded file
  - Works seamlessly across iOS, Android, and desktop browsers
- **Virtual Tour Opens in New Tab**: Virtual tour/showroom items now open in a new browser tab instead of iframe dialog
  - Provides full-screen viewing experience without iframe constraints
  - Better compatibility with virtual tour platforms (Matterport, etc.)
  - Maintains analytics tracking for virtual tour opens
- **Video Fallback to New Tab**: Video items that cannot play directly now open in a new browser tab when clicked
  - Detects video playback errors (embedded or direct video files)
  - Automatically opens video URL in new tab if playback fails
  - Provides better user experience when videos are blocked or incompatible
  - Works for both embedded videos (YouTube/Vimeo) and direct video files
- **Default Public Share Config**: New user registration now sets Public group to include all fields by default except Contact Information
  - Public group automatically selects all available fields (personal, social, profile, portfolio)
  - Contact Information fields (phone, email, address) are excluded by default for privacy
  - Users can still manually enable contact fields if desired
  - Applies to all new user registrations going forward
  - Migration script (045) available to update existing users' Public share config

- **Upgrade Plan Dialog with Promotion Codes**: Made plan badge clickable to open upgrade promotion dialog
  - Clicking the plan badge in NavigationMenu opens an upgrade dialog
  - Shows all available plans (Free, Premium, Business) with features and pricing
  - Highlights current plan and popular plan
  - **Promotion Code Input**: Replaced special offer section with promotion code input field
  - Users can enter promotion codes to upgrade to Business Plan
  - Real-time validation and application of promotion codes
  - **Promotions Database**: Created `promotions` table in Supabase
    - Stores promotion codes with plan name, expiration date, and usage limits
    - Tracks code usage per user to prevent duplicate applications
    - Includes RPC functions: `validate_promotion_code` and `apply_promotion_code`
  - Automatic plan upgrade when valid code is applied
  - Ready for payment/subscription system integration

- **Change Password Feature**: Added "Change Password" option in side menu bar
  - New menu item in NavigationMenu for authenticated users
  - ChangePasswordDialog component with password validation
  - Verifies current password before allowing change
  - Requires minimum 6 characters for new password
  - Includes show/hide password toggle for all fields
  - Uses Supabase auth.updateUser API for secure password updates

- **Analytics Fix for New Users**: Fixed blank page error when new users visit analytics page
  - Changed `.single()` to `.maybeSingle()` for `v_realtime_user_stats` query to handle empty results
  - Added null safety checks in `transformRealtimeDataToDashboard` function
  - Added default values for all analytics data structures when no data exists
  - New users will now see empty analytics dashboard instead of error page

- **VCF/vCard Standard Compliance**: Improved contact card download format for better mobile compatibility
  - Added required `N` (Name) property with proper structure (Last;First;;;)
  - Added `TYPE` parameters for EMAIL (INTERNET) and TEL (CELL) for better mobile recognition
  - Fixed line endings to use CRLF (`\r\n`) per vCard 3.0 specification
  - Added `REV` timestamp for card generation tracking
  - Escaped special characters in NOTE field (newlines, commas, semicolons)
  - Fixed bug in HomeProfileCard using literal `\n` instead of actual newlines
  - **Mobile Contact Import**: Fixed Save button to directly open contact import (no share dialog)
    - Removed Web Share API usage from Save button (that's for sharing, not saving)
    - Creates a blob URL link without `download` attribute to trigger native contact import
    - Mobile browsers will now directly prompt to add contact instead of showing share menu
    - Simplified implementation for more reliable contact import on iOS and Android

### Changed
- **Portfolio Category Item Styling**: Updated typography styles for portfolio category items
  - Reduced line-height from `28px` to `24px` (changed `leading-[28px]` to `leading-[24px]`)
  - Reduced font-size from `18px` to `16px` (changed `text-[18px]` to `text-[16px]`)
  - Reduced font-weight from `600` to `400` (changed `font-semibold` to `font-normal`)
- **Virtual Tour and Video Item Thumbnails**: Virtual Tour and Video items in studio/portfolio page now use thumbnail images instead of icons
  - Virtual Tour items now display thumbnail image with hand icon overlay to differentiate from video items
  - Video items now display iframe preview player for embedded videos (YouTube/Vimeo) - same as public portfolio page
  - Direct video files show thumbnail image with play button overlay
  - Matches the behavior of portfolio type items on the public portfolio page

### Fixed
- **Logo Auto-Save Issue**: Fixed logo being deleted when navigating to "My Business" page
  - Logo is now only saved when explicitly uploaded via the upload button
  - Auto-save mechanism now preserves existing `logo_url` from database instead of overwriting it with null
  - Applied fix to both `api.card.save` and `api.business.updateEmployeeCard` functions
  - Prevents logo deletion when redirecting quickly or when auto-save triggers during navigation

### Changed
- **Default Employee Permissions**: New employees now default to "Read Only" for both Company Name and Professional Title
  - When creating a new employee, both fields are automatically set to readonly
  - Business owners can still change permissions after creation if needed
- **Removed Hidden Permission Option**: Removed "Hidden" permission option from field permissions system
  - Field permissions now only support "Editable" and "Read Only" options
  - All fields are always visible to employees (cannot be hidden)
  - Simplified permission logic in hooks and UI components

### Changed
- **Navigation Menu Updates**: 
  - Renamed "Employees" navigation item to "My Business" across all navigation menus
  - Moved "My Business" to the top of navigation menus (appears first for business owners)
  - Updated in desktop navigation bar, mobile menu, and Business Card Studio overview page
- **My Business Page Layout**: 
  - Moved business name title to the very top of the My Business page
  - Removed building icon from business name display
  - Added Brand Logo upload feature at the top of the page
  - Logo displays above business name when uploaded
  - Logo can be changed by clicking on it (hover to reveal upload button)
  - Logo is stored in business card custom_fields and persists across sessions
- **Database Schema Update**:
  - Added `logo_url` column to `business_cards` table (migration 043)
  - Logo is now stored as a dedicated column similar to `avatar_url` and `background_image_url`
  - Updated TypeScript types, transformers, and API to support the new `logo_url` field
  - EmployeeManager now uses `logo_url` column instead of `custom_fields.brandLogo`
- **My Business Page Layout Update**:
  - Reorganized logo and business info into a two-column container
  - Left section: Brand logo (with upload functionality)
  - Right section: Business name (title), address, and bio
  - Container has white background, border, and shadow for visual separation
  - Improved spacing and typography for better readability

### Added
- **Business Owner Business Name Integration**: 
  - Business owner's business name is now displayed in the Employees page header
  - When creating a new employee, their business card is automatically populated with:
    - Business name from business owner's business card
    - Professional title from the employee's "Role/Title" field in the form
  - Ensures consistency across all employee business cards
- **Auto-Repopulation of Readonly Fields**: 
  - When business owner sets Company Name to "Read Only", it's automatically repopulated with business owner's current business name
  - When Professional Title is set to "Read Only", it's automatically repopulated with the employee's role from business_management table
  - Ensures that when fields are restricted, they contain the correct company information
  - Works for both single employee and bulk permission updates
- **Bulk Permission Updates**: Added options to apply field permissions to multiple employees
  - Checkbox option to "Apply to all employees in current filter" - applies to filtered employees only
  - Checkbox option to "Apply to all employees in business" - applies to all employees regardless of filters
  - Options are mutually exclusive (selecting one deselects the other)
  - Shows count of affected employees when bulk update is enabled
  - Updates permissions for all target employees simultaneously
  - Toast notification shows number of employees updated
  - Visual distinction: filtered option uses zinc styling, business-wide option uses amber styling for emphasis
  - Automatically refreshes employee list after permissions are updated to reflect changes in the database
- **Field Permission Enforcement**: Readonly fields are now disabled for employees
  - Company Name (`personal.businessName`) and Professional Title (`personal.title`) fields are disabled when set to readonly
  - Disabled fields show a lock icon and "This field is controlled by your business owner" message
  - Fields use muted background and cursor-not-allowed styling when readonly
  - Prevents employees from editing restricted fields in their business card forms

### Changed
- **Field Permissions System**: Restricted field permissions to company-related fields only
  - Business owners can now only control permissions for: Company Name (`personal.businessName`) and Professional Title (`personal.title`)
  - Employee personal information (avatar, social media, bio, contact details, profile, portfolio) is always controlled by the employee and cannot be restricted
  - Updated `FieldPermissionsEditor` to only display company fields
  - Updated permission hooks (`useFieldPermission`, `useAllFieldPermissions`) to always allow editing of non-company fields
  - Added API validation to filter out non-company fields when updating permissions

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

### Fixed
- **Business Card Initialization**: Fixed `initialize_user_data` function to populate `name` and `email` fields from signup form when creating business card. Previously these fields were left empty during user registration.
- **Employee Account Deactivation**: Added login validation to prevent deactivated employees from accessing the system. Deactivated employees are automatically signed out and shown a message to contact their business owner.
- **Employee Plan Assignment**: Fixed employee account creation to properly set plan to 'employee' instead of 'free'. Created `set_employee_plan` RPC function to ensure business owners can set employee plans correctly.

### Added
- **Employee Status Check on Login**: Implemented `check_employee_status` RPC function to validate if employee accounts are active during login and route protection. Deactivated employees cannot log in or access protected routes.

### Added
- Business Account Management feature
  - New `business_management` table for linking business owners to employees
  - New plan types: `business` (Business Plan) and `employee` (Employee Plan)
  - Field-level permissions (editable/readonly/hidden) for employee accounts
  - `api.business` namespace with full CRUD operations for employee management
  - `useBusinessManagement` React hook for business management functionality
  - `useFieldPermission` hook for checking field editability
  - `EmployeeManager` component for business owners to manage their team
  - `AddEmployeeForm` component for creating new employee accounts
  - `EmployeeCard` component for displaying employee information
  - `FieldPermissionsEditor` component for configuring field-level permissions
  - RLS policies for business owners to read/update employee business cards
  - Helper RPC functions: `is_business_owner`, `is_employee`, `get_business_employees`, `get_employee_business_owner`, `get_employee_field_permissions`, `can_employee_edit_field`

### Changed
- **Employee Manager UI Overhaul**: Redesigned employee list UI to match ShareStep1/ShareContact styling:
  - Added search bar for filtering employees by name, email, role, department, or code
  - Added horizontal scrollable status filter cards (All/Active/Inactive) with counts
  - New `EmployeeListItem` component with clean row-based layout (avatar with status dot, name, subtitle)
  - Employee details (email, role, department) now shown in dropdown menu
  - "Add New" card integrated into filter section for quick access
  - Improved visual consistency across the CMS dashboard
- **Employee Manager Filter Updates**: 
  - Changed "All Employees" filter label to "All" for consistency
  - Standardized all filter button widths to `w-[100px]` to match Share Contact page styling
  - Removed "New Agent" card from filter section
  - Removed dedicated "Add Employee" button (using header link instead for consistency)
- **Employee Manager Click Behavior**: 
  - Changed employee click behavior to open edit form instead of permissions editor
  - Created new `EditEmployeeForm` component for editing employee information (name, email, role, department, employee code)
  - Permissions editor now accessible via dropdown menu "Edit Permissions" option
  - Clicking on employee now opens edit dialog to update employee details
- **Fixed Employee Card Update**: 
  - Fixed `updateEmployeeCard` API function to bypass ownership check for business owners
  - Business owners can now update employee business cards directly via RLS policies
  - Function now gets employee user_id from business_cards table and updates using employee's user_id
  - Fixed EditEmployeeForm to properly structure BusinessCardData with `personal.name` and `contact.email` instead of top-level fields
  - Improved error handling to show actual errors when business card update fails
- **Employee Page UI Consistency**: 
  - Updated Employee Manager page to match Share Contact screen styling exactly
  - Changed header font from `font-['Inter',sans-serif]` to `font-['Inter:Medium',sans-serif]` and removed text size
  - Updated search bar height from `h-[48px]` to `h-[44px]` to match Share Contact
  - Changed search input font to `font-['Inter:Medium',sans-serif]` and height to `h-[39px]`
  - Updated filter card fonts to `font-['Inter:Semi_Bold',sans-serif]` for consistency
  - Changed employee avatar from `size-[44px] rounded-[8px]` to `size-[40px] rounded-[100px]` to match contact avatars
  - Updated employee name font to `font-['Inter:Medium',sans-serif]` and removed semibold
  - Changed subtitle font to `font-['Inter:Regular',sans-serif]` with `leading-[24px]` instead of `leading-[20px]`
  - Removed `mb-1` from filter card icon row and `text-lg` from count to match Share Contact
  - Updated container padding to match Share Contact (`px-[0px]`)
- **Employee Avatar Support**: 
  - Added `avatar_url` field to `get_business_employees` RPC function to fetch employee avatars from business_cards table
  - Updated `EmployeeWithDetails` TypeScript type to include `avatar_url` field
  - Employee avatars now display from each employee's business card profile image
- **Multi-Select Department Filter**: 
  - Added multi-select department filter dropdown to search bar filter button
  - Filter button shows a popover with checkboxes for all unique departments
  - Multiple departments can be selected simultaneously
  - Selected departments display as tags/badges below the search bar
  - Each tag has a remove button to individually remove department filters
  - Filter button highlights when departments are selected
  - Clear button clears both search query and all department filters
  - "Clear all" option in filter popover to remove all department selections
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

