# Libraries

## Production Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| react | ^18.x | UI framework |
| react-dom | ^18.x | React DOM renderer |
| typescript | ^5.x | Type-safe JavaScript |
| vite | Latest | Build tool with HMR |
| @vitejs/plugin-react | Latest | Vite React plugin |
| react-router-dom | Latest | Client-side routing |
| @tanstack/react-query | ^5.x | Server state management caching |
| react-hook-form | 7.55.0 | Form state with validation |
| tailwindcss | ^4.0 | Utility-first CSS framework |
| lucide-react | Latest | Icon library (tree-shakable) |
| recharts | ^2.x | Data visualization charts |
| @supabase/supabase-js | Latest | Supabase PostgreSQL client |
| date-fns | Latest | Date formatting utilities |
| react-i18next | Latest | React bindings for i18next |
| i18next | Latest | Internationalization framework |
| i18next-browser-languagedetector | Latest | Language detection for browsers |
| react-country-flag | Latest | Country flag icons (SVG/emoji) for language switcher |

---

## Shadcn UI Components

**Status:** Copied into `/components/ui/` (not an npm package)

**Components:**
- Button, Card, Dialog, Sheet, Tabs
- Form, Input, Label, Textarea, Select
- Dropdown, Popover, Tooltip, Alert
- Table, Accordion, Checkbox, Switch
- Sidebar, Carousel, Chart

---

## Version-Specific Imports

**Required syntax for specific libraries:**

| Library | Import Syntax |
|---------|---------------|
| react-hook-form | `import { useForm } from 'react-hook-form@7.55.0'` |
| sonner | `import { toast } from 'sonner@2.0.3'` |

---

## Removed Libraries

| Library | Removed Date | Reason |
|---------|--------------|--------|
| react-helmet-async | Dec 5, 2024 | DOM conflicts with Figma Make |

---

## Not Supported in Figma Make

| Library | Alternative |
|---------|-------------|
| konva / react-konva | Use native canvas |
| react-resizable | Use re-resizable |

---

## Recommended for Future Features

| Feature | Library |
|---------|---------|
| Carousels | react-slick |
| Masonry grids | react-responsive-masonry |
| Drag & drop | react-dnd |
| Animation | motion/react (formerly Framer Motion) |
| Popovers | popper.js |

---

_Last Updated: Dec 2024_