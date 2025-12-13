# Component Map

## Route Structure

| Route Pattern | Component | Screen | Purpose |
|---------------|-----------|--------|---------|
| `/` | Navigate | - | Redirect to /myclik |
| `/auth` | AuthScreen | Auth | Login/signup |
| `/:userCode/auth` | AuthScreen | Auth | Login/signup for user |
| `/:userCode/studio` | CMSLayout | CMS | Business card editor |
| `/:userCode/studio/:section` | CMSLayout | CMS | Editor sections (edit/share/analytics) |
| `/:userCode` | PublicLayout | Home | Public business card |
| `/:userCode/contact` | PublicLayout | Contact | Contact form screen |
| `/:userCode/profile` | PublicLayout | Profile | Profile details screen |
| `/:userCode/portfolio` | PublicLayout | Portfolio | Portfolio gallery screen |
| `/:userCode/:groupCode` | PublicLayout | Home | Group-specific card |
| `/:userCode/:groupCode/:contactCode` | PublicLayout | Home | Contact-tracked card |

---

## Page Components (Routes)

### PublicLayout (`/components/routes/PublicLayout.tsx`)

**Purpose:** Wrapper for public-facing business card screens

**Props:** `screen: 'home' | 'contact' | 'profile' | 'portfolio'`

**Children Components:**

| Component | File | Purpose |
|-----------|------|---------|
| Share | `/components/contact/Share.tsx` | Home screen business card |
| ContactScreen | `/components/screens/ContactScreen.tsx` | Contact form |
| ProfileScreen | `/components/screens/ProfileScreen.tsx` | Full profile view |
| PortfolioScreen | `/components/screens/PortfolioScreen.tsx` | Portfolio gallery |
| AnalyticsWrapper | `/components/AnalyticsWrapper.tsx` | Session/visitor tracking |

**Features:**
- URL param parsing (userCode, groupCode, contactCode)
- Share group visibility filtering
- Analytics tracking integration
- Navigation between screens

---

### CMSLayout (`/components/routes/CMSLayout.tsx`)

**Purpose:** Wrapper for CMS/Studio editor

**Children Components:**

| Component | File | Purpose |
|-----------|------|---------|
| BusinessCardStudio | `/components/cms/BusinessCardStudio.tsx` | Main editor interface |
| CMSNavigationBar | `/components/cms/CMSNavigationBar.tsx` | Top navigation tabs |

**Sections:**
- `edit` - Edit business card content
- `share` - Manage share groups
- `analytics` - View analytics dashboard

---

## Screen Components

### AuthScreen (`/components/screens/AuthScreen.tsx`)

| Feature | Implementation |
|---------|----------------|
| Login | Email/password via Supabase Auth |
| Signup | Creates user + calls initialize_user_data() |
| UI | Shadcn UI forms |

---

### ContactScreen (`/components/screens/ContactScreen.tsx`)

| Feature | Implementation |
|---------|----------------|
| Contact form | Phone, email, address buttons |
| Click tracking | Analytics via trackClickEvent() |
| Share button | Share card with tracking |

---

### ProfileScreen (`/components/screens/ProfileScreen.tsx`)

| Feature | Implementation |
|---------|----------------|
| Profile display | About, service areas, specialties |
| Markdown | MarkdownText component |
| Visibility | Filtered by share group |

---

### PortfolioScreen (`/components/screens/PortfolioScreen.tsx`)

| Feature | Implementation |
|---------|----------------|
| Gallery | Grid layout of portfolio items |
| Media types | Image, video, virtual tour |
| Click tracking | Analytics for play/open actions |

---

## CMS Components

### BusinessCardStudio (`/components/cms/BusinessCardStudio.tsx`)

**Purpose:** Main CMS editor container

**Tabs:**

| Tab | Component | Purpose |
|-----|-----------|---------|
| Edit | Forms (PersonalInfoForm, ContactForm, etc.) | Edit card content |
| Share | ShareManager | Manage share groups |
| Analytics | AnalyticsDashboard | View analytics |
| Preview | PreviewTab | Live preview |

---

### ShareManager (`/components/cms/ShareManager.tsx`)

**Child Components:**

| Component | File | Purpose |
|-----------|------|---------|
| ShareConfiguration | ShareConfiguration.tsx | QR code, share links |
| GroupConfiguration | GroupConfiguration.tsx | Group CRUD operations |
| FieldVisibilitySettings | FieldVisibilitySettings.tsx | Per-group field visibility |
| UserCodeSettings | UserCodeSettings.tsx | Change user_code |

---

### AnalyticsDashboard (`/components/cms/AnalyticsDashboard.tsx`)

**Features:**

| Feature | Component | Purpose |
|---------|-----------|---------|
| Filter bar | ShareGroupFilter | Date range + group selector |
| Metrics cards | StatsCard | Total views, clicks, etc. |
| Line charts | Recharts | Time-series data |
| Click breakdown | ClickTargetTable | Click target analytics |

**Data Sources:**
- `useAnalytics()` hook
- TanStack Query caching
- Realtime via v_realtime_page_stats, v_realtime_click_targets

---

## Custom Image Components (No External Libraries)

### FullScreenImagePositioner (`/components/cms/FullScreenImagePositioner.tsx`)

**Purpose:** Drag-to-reposition + zoom for cover images

**Features:**

| Feature | Implementation | Range |
|---------|----------------|-------|
| Drag | Mouse/touch event handlers | Unrestricted X/Y |
| Zoom | CSS transform scale | 0.5x - 3.0x |
| Preview | Live update via position state | - |
| Controls | ZoomIn/ZoomOut buttons (Lucide icons) | - |

**Saves:** `{ x: number, y: number, scale: number }`

---

### AvatarImagePositioner (`/components/cms/AvatarImagePositioner.tsx`)

**Purpose:** Position image within circular avatar

**Features:**

| Feature | Implementation | Range |
|---------|----------------|-------|
| Drag | Mouse/touch event handlers | Unrestricted X/Y |
| Zoom | CSS transform scale | 0.5x - 3.0x |
| Preview | Circular mask (150px diameter) | - |
| Controls | ZoomIn/ZoomOut buttons | - |

**Saves:** `avatarPosition: { x: number, y: number, scale: number }`

---

### FaceSelectionImageUploader (`/components/cms/FaceSelectionImageUploader.tsx`)

**Purpose:** Face detection + oval crop area selection

**Features:**

| Feature | Implementation | Notes |
|---------|----------------|-------|
| Face detection | Browser Face Detection API (`window.FaceDetector`) | Falls back to default oval |
| Oval selection | Draggable oval with resize handles | 8 handles (N, S, E, W, NE, NW, SE, SW) |
| Aspect ratio | Configurable (portrait/landscape) | Optional constraint |
| Upload | Supabase Storage | Max 5MB |

**Saves:** `facePosition: { x: number, y: number, width: number, height: number }` (percentage-based)

**Dependencies:** NONE (native browser APIs only)

---

## Form Components (`/components/cms/forms/`)

| Component | File | Edits |
|-----------|------|-------|
| PersonalInfoForm | PersonalInfoForm.tsx | Name, title, company |
| ContactForm | ContactForm.tsx | Phone, email, address |
| ProfileForm | ProfileForm.tsx | About, service areas, specialties |
| HomeForm | HomeForm.tsx | Profile image, tagline, CTA, AI portrait generation |
| PortfolioForm | PortfolioForm.tsx | Portfolio items (CRUD) |

**Form Library:** React Hook Form 7.55.0

**Auto-save:** Debounced updates to Supabase

**AI Features:**
- **AI Portrait Generation** (HomeForm): 4 style templates (Professional, Casual, Fashion, Fun)
  - Simple mode: Plain color background
  - Place mode: Environment background
  - Triggered via "AI Restyle" button on background image preview

---

## Shared UI Components (`/components/ui/`)

**Shadcn UI Components:**

| Component | File | Usage |
|-----------|------|-------|
| Button | button.tsx | Primary/secondary/ghost variants |
| Card | card.tsx | Container with header/content/footer |
| Dialog | dialog.tsx | Modal dialogs |
| Sheet | sheet.tsx | Side panels |
| Tabs | tabs.tsx | Tab navigation |
| Form | form.tsx | Form wrapper (React Hook Form) |
| Input | input.tsx | Text inputs |
| Textarea | textarea.tsx | Multi-line text |
| Select | select.tsx | Dropdown select |
| Checkbox | checkbox.tsx | Checkboxes |
| Switch | switch.tsx | Toggle switches |
| Dropdown | dropdown-menu.tsx | Context menus |
| Popover | popover.tsx | Floating content |
| Tooltip | tooltip.tsx | Hover tooltips |
| Alert | alert.tsx | Alert messages |
| Table | table.tsx | Data tables |
| Accordion | accordion.tsx | Expandable sections |
| Sidebar | sidebar.tsx | Navigation sidebar |
| Carousel | carousel.tsx | Image carousels |
| Chart | chart.tsx | Recharts wrapper |

**Note:** Shadcn UI components are copied into codebase (not npm dependencies)

---

## Common Components (`/components/common/`)

| Component | File | Purpose |
|-----------|------|---------|
| MarkdownText | MarkdownText.tsx | Render markdown strings |
| ScrollPage | ScrollPage.tsx | Scrollable page wrapper |
| LoadingSpinner | LoadingSpinner.tsx | Loading state indicator |

---

## Analytics Components (`/components/`)

| Component | File | Purpose |
|-----------|------|---------|
| AnalyticsWrapper | AnalyticsWrapper.tsx | Track visitor sessions |

**Implementation:**
- Generates visitor_id (90-day localStorage)
- Generates session_id (30-min sessionStorage)
- Batches events every 5 seconds
- Inserts to analytics_sessions, analytics_page_views, analytics_clicks

---

## Portfolio Components (`/components/portfolio/`)

| Component | File | Purpose |
|-----------|------|---------|
| PortfolioItemDisplay | PortfolioItemDisplay.tsx | Display portfolio item with media |
| PortfolioGallery | PortfolioGallery.tsx | Grid layout for items |

**Media Types:**
- Image: Lightbox on click
- Video: Play button → trackClickEvent('portfolio.videoPlay')
- Virtual Tour: Link → trackClickEvent('portfolio.virtualTourOpen')

---

## Contact Components (`/components/contact/`)

| Component | File | Purpose |
|-----------|------|---------|
| Share | Share.tsx | Main business card (home screen) |
| Headline | Headline.tsx | Header with name/title |
| ContactButtons | ContactButtons.tsx | Phone/email/address buttons |

---

## Profile Components (`/components/profile/`)

| Component | File | Purpose |
|-----------|------|---------|
| ProfileHeader | ProfileHeader.tsx | Avatar + name/title |
| ProfileContent | ProfileContent.tsx | About/services/specialties |

---

_Last Updated: Dec 7, 2024_