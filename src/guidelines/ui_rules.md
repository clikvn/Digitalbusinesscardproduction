# UI Rules

## Design System

**Location:** `/styles/globals.css`

---

## Typography

**Font Families:**
- Sans: System UI stack (ui-sans-serif, Segoe UI, Roboto, etc.)
- Serif: Georgia, Cambria, Times New Roman
- Mono: SFMono, Menlo, Monaco, Consolas

**Font Sizes:**
- Defined in globals.css for each HTML element
- **DO NOT** use Tailwind font-size classes (text-xl, text-2xl) unless explicitly requested

**Font Weights:**
- Default weights set per element in globals.css
- **DO NOT** override with Tailwind (font-bold, font-semibold) unless requested

**Line Heights:**
- Set in globals.css
- **DO NOT** override with Tailwind (leading-tight, leading-loose) unless requested

---

## Colors

**Design Tokens:**
- Use CSS variables from globals.css
- Examples: `bg-background`, `text-foreground`, `border-border`

**Color Palette:**
- Primary: Blue (buttons, links)
- Secondary: Grays (text, borders)
- Destructive: Red (errors, delete actions)
- Muted: Light gray (secondary text)

**Share Group Colors:**
- Public: Blue
- Private: Purple
- Business: Green
- Personal: Pink

---

## Spacing

**Base Unit:** `--spacing: 0.25rem` (4px)

**Tailwind Scale:**
- p-1: 4px
- p-2: 8px
- p-3: 12px
- p-4: 16px
- gap-2: 8px
- gap-4: 16px

**Consistent Spacing:**
- Card padding: p-4 (16px)
- Section gaps: gap-4 (16px)
- Element gaps: gap-2 (8px)

---

## Layout

**Mobile-First:**
- Design for mobile (320px+)
- Responsive breakpoints: sm, md, lg, xl

**Max Width:**
- Business card: max-w-\[500px\]
- Dashboard: max-w-7xl

**Flexbox Patterns:**
```css
/* Vertical stack */
flex flex-col gap-4

/* Horizontal row */
flex items-center gap-2

/* Space between */
flex items-center justify-between
```

---

## Components

**Shadcn UI:**
- Located in `/components/ui/`
- Headless, customizable with Tailwind
- Do not modify base components directly

**Custom Components:**
- Located in `/components/{feature}/`
- Follow atomic design: atoms → molecules → organisms

---

## Icons

**Library:** Lucide React

**Usage:**
```tsx
import { User, Mail, Phone } from 'lucide-react';

<User className="w-4 h-4" />
```

**Sizes:**
- Small: w-4 h-4 (16px)
- Medium: w-5 h-5 (20px)
- Large: w-6 h-6 (24px)

---

## Borders & Shadows

**Borders:**
- Default: `border-border`
- Radius: `rounded-lg` (0.5rem)

**Shadows:**
- Defined in globals.css
- Examples: shadow-sm, shadow-md, shadow-lg

---

## Responsive Design

**Breakpoints:**
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

**Pattern:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

---

## Accessibility

**Requirements:**
- Proper semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Focus states visible

---

## Mobile Optimization

**Viewport Height:**
- Use `calc(var(--vh, 1vh) * 100)` for full-screen
- Accounts for mobile browser chrome

**Touch Targets:**
- Minimum 44px × 44px for buttons
- Adequate spacing between clickable elements

---

_Last Updated: Dec 7, 2024_
