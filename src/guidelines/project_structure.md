# Project Structure & Naming Conventions

## 1. Directory Tree Rules (Figma Make - Flat Structure)

**Note:** Figma Make environment does NOT use `src/` directory. All code is at root level.

```text
/
├── App.tsx                              # Root Router Configuration
├── vite-env.d.ts                        # Vite TypeScript definitions
├── components/
│   ├── ui/                              # Shadcn UI components (NO business logic)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── layout/                          # Layout wrappers
│   │   └── NavigationMenu.tsx
│   ├── cms/                             # CMS/Studio features (Business logic)
│   │   ├── BusinessCardStudio.tsx
│   │   ├── ShareManager.tsx
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── forms/                       # CMS form components
│   │   └── ...
│   ├── contact/                         # Contact screen features
│   ├── home/                            # Home screen features
│   ├── portfolio/                       # Portfolio features
│   ├── profile/                         # Profile features
│   ├── common/                          # Shared reusable components
│   │   ├── MarkdownText.tsx
│   │   ├── ScrollPage.tsx
│   │   └── ...
│   ├── routes/                          # Route layout wrappers
│   │   ├── PublicLayout.tsx
│   │   └── CMSLayout.tsx
│   ├── screens/                         # Screen/Page components
│   │   ├── AuthScreen.tsx
│   │   ├── ContactScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── PortfolioScreen.tsx
│   └── figma/                           # Figma Make utilities
│       └── ImageWithFallback.tsx
├── hooks/                               # Custom React hooks (flat structure)
│   ├── useAnalytics.ts
│   ├── useBusinessCard.ts
│   ├── useContacts.ts
│   └── ...
├── lib/                                 # Core configuration & utilities
│   ├── supabase-client.ts               # Supabase client instance
│   ├── api.ts                           # API layer (Supabase calls)
│   ├── query-client.ts                  # TanStack Query config
│   ├── transformers.ts                  # Data transformers
│   └── videoUtils.ts
├── schemas/                             # Validation schemas (Zod)
│   └── business-card-schema.ts
├── types/                               # TypeScript type definitions
│   ├── database.ts
│   ├── business-card.ts
│   ├── analytics.ts
│   └── contacts.ts
├── utils/                               # Utility functions
│   ├── analytics.ts
│   ├── analytics-batcher.ts
│   ├── storage.ts
│   ├── supabase/
│   └── ...
├── styles/                              # Global styles
│   └── globals.css                      # Tailwind + custom CSS
├── imports/                             # Figma imported assets (SVGs/images)
│   ├── svg-*.ts                         # Imported SVG paths
│   └── *.tsx                            # Figma component imports
├── guidelines/                          # Project documentation
│   ├── Guidelines.md
│   ├── project_structure.md
│   ├── tech_stack.md
│   └── ...
├── supabase/                            # Supabase backend
│   ├── migrations/                      # SQL migrations
│   ├── functions/                       # Edge Functions (minimal use)
│   └── config.toml
└── *.md                                 # Root documentation files
```

---

## 2. Component Organization Strategy

### 2.1 Feature-Based Grouping

| Directory | Purpose | Business Logic Allowed? |
|-----------|---------|-------------------------|
| `components/ui/` | Shadcn UI atoms (Button, Card) | ❌ NO - Pure UI only |
| `components/layout/` | Layout wrappers (NavigationMenu) | ✅ Minimal (navigation state) |
| `components/common/` | Shared molecules (MarkdownText) | ✅ Minimal (rendering logic) |
| `components/cms/` | CMS/Studio features | ✅ YES - Full business logic |
| `components/contact/` | Contact screen components | ✅ YES - Full business logic |
| `components/home/` | Home screen components | ✅ YES - Full business logic |
| `components/portfolio/` | Portfolio features | ✅ YES - Full business logic |
| `components/profile/` | Profile features | ✅ YES - Full business logic |
| `components/routes/` | Route layout wrappers | ✅ YES - Routing logic |
| `components/screens/` | Screen/Page components | ✅ YES - Full page logic |
| `components/figma/` | Figma Make utilities | ⚠️ Protected - Do not modify |

### 2.2 Expansion Rules

**When adding new features:**

| Scenario | Action | Example |
|----------|--------|---------|
| New screen/feature | Create new feature dir | `components/settings/` |
| New shared component | Add to `components/common/` | `components/common/LoadingSpinner.tsx` |
| New UI primitive | Add to `components/ui/` | `components/ui/badge.tsx` |
| New CMS feature | Add to `components/cms/` | `components/cms/BulkImport.tsx` |

**Rule:** Prefer feature-based grouping over type-based grouping.

- ✅ **Good:** `components/cms/AnalyticsDashboard.tsx`
- ❌ **Bad:** `components/dashboards/AnalyticsDashboard.tsx`

---

## 3. Hooks Organization

### 3.1 Current Structure (Flat)

**All hooks in `/hooks/` directory without subdirectories.**

| Hook | Purpose | Type |
|------|---------|------|
| `useAnalytics.ts` | Analytics data fetching | Data/API |
| `useBusinessCard.ts` | Business card CRUD | Data/API |
| `useContacts.ts` | Contacts data | Data/API |
| `useFieldVisibility.ts` | Field visibility state | UI State |
| `useNameFontSize.ts` | Dynamic font sizing | UI Logic |
| `usePublicBusinessCard.ts` | Public card fetching | Data/API |
| `useSettings.ts` | Settings CRUD | Data/API |

### 3.2 Future Organization (If hooks grow beyond 15)

**Optional subdirectories (not currently implemented):**

```text
hooks/
├── data/                    # Data fetching hooks (React Query)
│   ├── useAnalytics.ts
│   ├── useBusinessCard.ts
│   └── useContacts.ts
└── ui/                      # UI state hooks
    ├── useNameFontSize.ts
    └── useFieldVisibility.ts
```

**Rule:** Keep flat until 15+ hooks, then organize by concern.

---

## 4. Lib Directory Rules

### 4.1 Current Files

| File | Purpose | Singleton? |
|------|---------|-----------|
| `supabase-client.ts` | Supabase client instance | ✅ YES - Single instance |
| `api.ts` | Supabase API calls (direct RLS) | ❌ NO - Functions only |
| `query-client.ts` | TanStack Query config | ✅ YES - Single instance |
| `transformers.ts` | Data transformers | ❌ NO - Pure functions |
| `videoUtils.ts` | Video URL helpers | ❌ NO - Pure functions |

### 4.2 Placement Rules

| Type | Location | Example |
|------|----------|---------|
| Singletons (clients/config) | `/lib/` | `supabase-client.ts` |
| API functions | `/lib/api.ts` | All Supabase calls |
| Data transformers | `/lib/transformers.ts` | Transform DB to UI types |
| General utils | `/utils/` | Feature-specific helpers |
| Validation schemas | `/schemas/` | Zod schemas |

**Critical:** NEVER instantiate Supabase client in components. Always import from `/lib/supabase-client.ts`.

---

## 5. Utils Directory Rules

### 5.1 Organization

**Flat structure with feature-based files:**

| File | Purpose | Co-location Alternative |
|------|---------|------------------------|
| `analytics.ts` | Analytics helpers | Could be `/lib/analytics.ts` |
| `analytics-batcher.ts` | Analytics batching | Related to analytics.ts |
| `storage.ts` | LocalStorage helpers | General utility |
| `business-card-storage.ts` | Business card storage | Could be in hooks/ |
| `clipboard-utils.ts` | Copy to clipboard | General utility |
| `supabase/info.tsx` | Supabase info component | ⚠️ Should be component |

### 5.2 Colocation Strategy

**When to co-locate vs /utils/:**

| Scenario | Location | Rationale |
|----------|----------|-----------|
| Used by 1 component only | Co-locate with component | Easier to find/maintain |
| Used by 2-3 components in same feature | Feature directory | Shared within feature |
| Used across multiple features | `/utils/` | True utility |
| General helpers (date, string) | `/utils/` | Reusable utilities |

---

## 6. Naming Conventions

| Type | Case | Example | Location |
|------|------|---------|----------|
| **Directories (features)** | kebab-case | `cms/`, `contact/` | `/components/` |
| **React Components** | PascalCase | `BusinessCardStudio.tsx` | `/components/**` |
| **Screens** | PascalCase + "Screen" | `AuthScreen.tsx` | `/components/screens/` |
| **Hooks** | camelCase + "use" prefix | `useAnalytics.ts` | `/hooks/` |
| **Utils** | camelCase | `formatCurrency.ts` | `/utils/` |
| **Types** | PascalCase | `BusinessCard` | `/types/` |
| **Type files** | kebab-case | `business-card.ts` | `/types/` |
| **Constants** | SCREAMING_SNAKE_CASE | `MAX_FILE_SIZE` | In relevant file |

---

## 7. Import Path Guidelines

### 7.1 Absolute Paths (Relative from root)

**All imports use relative paths from file location:**

```typescript
// From /App.tsx
import { PublicLayout } from "./components/routes/PublicLayout";
import { queryClient } from "./lib/query-client";
import { supabase } from "./lib/supabase-client";

// From /components/cms/ShareManager.tsx
import { Button } from "../ui/button";
import { useBusinessCard } from "../../hooks/useBusinessCard";
import { supabase } from "../../lib/supabase-client";
```

### 7.2 Import Order Convention

```typescript
// 1. External libraries
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// 2. Internal components
import { Button } from "../ui/button";
import { Card } from "../ui/card";

// 3. Hooks
import { useBusinessCard } from "../../hooks/useBusinessCard";

// 4. Utils/Lib
import { supabase } from "../../lib/supabase-client";
import { formatDate } from "../../utils/date-utils";

// 5. Types
import type { BusinessCard } from "../../types/business-card";
```

---

## 8. Strict Placement Rules

### 8.1 Component Rules

| Rule | Example |
|------|---------|
| ❌ NO business logic in `components/ui/` | UI components must be pure/dumb |
| ✅ Data fetching ONLY via hooks | Use `useBusinessCard()`, not direct Supabase calls |
| ✅ Supabase client from `/lib/` only | Import from `/lib/supabase-client.ts` |
| ✅ Route components act as controllers | Fetch data in routes/screens, pass to features |

### 8.2 File Responsibility

| File Type | Responsibility | What NOT to do |
|-----------|---------------|----------------|
| **Routes** (`/components/routes/`) | URL parsing, layout, data orchestration | ❌ Form validation, UI state |
| **Screens** (`/components/screens/`) | Screen logic, data fetching via hooks | ❌ Direct Supabase calls |
| **Features** (cms/contact/etc) | Feature-specific business logic | ❌ Route navigation logic |
| **Hooks** | Data fetching, state management | ❌ UI rendering |
| **Utils** | Pure functions, no side effects | ❌ React hooks, components |

---

## 9. Protected Files/Directories

**DO NOT modify without explicit user request:**

| Path | Reason |
|------|--------|
| `/components/figma/ImageWithFallback.tsx` | Figma Make system component |
| `/imports/*` | Figma-imported assets (managed by Figma Make) |
| `/styles/globals.css` | Global design system (modify only on request) |

---

## 10. Root-Level Files

### 10.1 Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite build configuration |
| `tsconfig.json` | TypeScript configuration |
| `tailwind.config.js` | Tailwind CSS v4 configuration |

### 10.2 Documentation Files

**Many `.md` files at root** - Should be organized but currently at root:

- Analytics documentation (ANALYTICS_*.md)
- Migration guides (MIGRATION_*.md)
- Feature summaries (IMPLEMENTATION_STATUS.md, etc.)

**Optional future cleanup:**
```text
docs/
├── analytics/
├── migrations/
└── features/
```

---

_Last Updated: Dec 7, 2024_
