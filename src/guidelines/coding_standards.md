# Coding Standards

## TypeScript

### Type Safety

**Always use explicit types:**
```typescript
// ✅ Good
function trackEvent(target: string, sessionId: string): void { }

// ❌ Bad
function trackEvent(target, sessionId) { }
```

**Prefer interfaces for objects:**
```typescript
// ✅ Good
interface UserProfile {
  name: string;
  email: string;
}

// ❌ Avoid type aliases for simple objects (use for unions/complex types)
type UserProfile = {
  name: string;
  email: string;
}
```

---

## React

### Component Structure

**Named exports:**
```typescript
// ✅ Good
export function AnalyticsDashboard({ userId }: Props) { }

// ❌ Bad
export default function AnalyticsDashboard({ userId }: Props) { }
```

**Props interface:**
```typescript
// ✅ Good - Interface above component
interface AnalyticsDashboardProps {
  userId: string;
  dateRange?: DateRange;
}

export function AnalyticsDashboard({ userId, dateRange }: AnalyticsDashboardProps) { }
```

---

### Hooks

**Custom hooks:**
```typescript
// ✅ Good - Start with "use"
export function useAnalytics(userId: string) {
  return useQuery({
    queryKey: ['analytics', userId],
    queryFn: () => fetchAnalytics(userId),
  });
}
```

**useMemo for expensive calculations:**
```typescript
// ✅ Good
const stats = useMemo(() => {
  return calculateStats(data);
}, [data]);
```

**useCallback for event handlers:**
```typescript
// ✅ Good
const handleClick = useCallback((id: string) => {
  trackEvent(id);
}, [trackEvent]);
```

---

### Early Returns

**Loading and error states:**
```typescript
// ✅ Good
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;

// Normal render
return <Dashboard data={data} />;
```

---

## File Organization

**Directory structure:**
```
/components/
├── screens/         # Full-page screens (ContactScreen, PortfolioScreen)
├── cms/            # CMS-specific (AnalyticsDashboard, ShareManager)
├── common/         # Shared components (MarkdownText, ScrollPage)
├── ui/             # Shadcn primitives (button, card, dialog)
└── {feature}/      # Feature-specific (profile/, portfolio/)
```

**File naming:**
- Components: PascalCase (AnalyticsDashboard.tsx)
- Utilities: camelCase (analytics.ts)
- Hooks: camelCase starting with "use" (useAnalytics.ts)

---

## Naming Conventions

**Variables:**
```typescript
// ✅ Good - camelCase
const userProfile = { };
const analyticsData = [];
```

**Constants:**
```typescript
// ✅ Good - UPPER_SNAKE_CASE or const object
const MAX_RETRIES = 3;
const CLICK_TARGET_LABELS = { } as const;
```

**Functions:**
```typescript
// ✅ Good - camelCase, descriptive verbs
function trackClickEvent() { }
function calculateAnalytics() { }
```

---

## Patterns to PREFER

### TanStack Query
```typescript
// ✅ Good
const { data, isLoading, error } = useQuery({
  queryKey: ['analytics', userId],
  queryFn: () => fetchAnalytics(userId),
});
```

### Composition over prop drilling
```typescript
// ✅ Good
<AnalyticsProvider userId={userId}>
  <Dashboard />
</AnalyticsProvider>
```

### Tailwind for styling
```typescript
// ✅ Good
<div className="flex items-center gap-4 p-4">
```

---

## Patterns to AVOID

### Default exports
```typescript
// ❌ Bad
export default function Component() { }
```

### Prop drilling
```typescript
// ❌ Bad - too many props
<Child prop1={x} prop2={y} prop3={z} prop4={a} />
```

### Inline objects in dependencies
```typescript
// ❌ Bad - creates new object every render
useEffect(() => { }, [{ foo: 'bar' }]);

// ✅ Good
const deps = useMemo(() => ({ foo: 'bar' }), []);
useEffect(() => { }, [deps]);
```

### Manual DOM manipulation
```typescript
// ❌ Bad
document.getElementById('element')

// ✅ Good - use refs
const ref = useRef<HTMLDivElement>(null);
```

---

## Mobile Touch Events

### Preventing Browser Gesture Conflicts

**CRITICAL for drag/pan interactions:**

When implementing drag, pan, or image positioning features, ALWAYS prevent mobile browser gestures (pull-to-refresh, swipe navigation, pinch-zoom) from interfering.

**Required pattern:**
```typescript
// ✅ Good - Full touch isolation
const handleTouchStart = (e: React.TouchEvent) => {
  e.preventDefault(); // Block initial touch behavior
  // ... your touch logic
};

const handleTouchMove = (e: React.TouchEvent) => {
  if (!isDragging) return;
  e.preventDefault(); // Block scrolling/gestures during drag
  // ... your drag logic
};

return (
  <div
    style={{ touchAction: 'none' }} // Disable ALL browser touch gestures
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
  >
    {/* Draggable content */}
  </div>
);
```

**Applies to:**
- Image positioning editors (FullScreenImagePositioner, AvatarImagePositioner)
- Canvas-based interactions (FaceSelectionImageUploader)
- Custom drag-and-drop interfaces
- Any fullscreen touch-based UI

**touchAction values:**
- `none` - Disable all browser gestures (for drag/pan UIs)
- `pan-y` - Allow vertical scroll only (for horizontal swipe carousels)
- `pan-x` - Allow horizontal scroll only (rare)
- `manipulation` - Disable double-tap zoom, allow scroll (default for buttons)

**Exception - Controls within draggable areas:**
```typescript
// ✅ Good - Exclude control areas from drag handling
const handleTouchStart = (e: React.TouchEvent) => {
  if ((e.target as HTMLElement).closest('.controls-area')) return;
  e.preventDefault();
  // ... drag logic
};

// Controls maintain normal touch behavior
<div className="controls-area">
  <Button>Save</Button>
  <Button>Close</Button>
</div>
```

---

## Error Handling

**Try-catch with specific messages:**
```typescript
// ✅ Good
try {
  await supabase.from('table').insert(data);
} catch (error) {
  console.error('[Component] Failed to insert:', error);
  toast.error('Failed to save changes');
}
```

**Console logging with prefixes:**
```typescript
// ✅ Good
console.log('[Analytics]', data);
console.error('[Supabase]', error);
```

---

## Comments

**Explain WHY, not WHAT:**
```typescript
// ✅ Good - explains intent
// Remove border from first 2 items to create visual grouping
const shouldRemoveBorder = index < 2;

// ❌ Bad - states the obvious
// Set x to 5
const x = 5;
```

**Complex logic:**
```typescript
// ✅ Good - documents business logic
// Visitor ID persists 90 days to track unique people
// Session ID expires after 30 min to track unique visits
const visitorId = getOrCreateVisitorId();
```

---

## Imports

**Order:**
1. External libraries (React, third-party)
2. Internal modules (components, hooks)
3. Types
4. Styles

```typescript
// ✅ Good order
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnalyticsDashboard } from './components/cms/AnalyticsDashboard';
import type { AnalyticsMetrics } from '../../types/analytics';
```

---

_Last Updated: Dec 7, 2024_