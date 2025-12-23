# AI Agent Chat Feature - Extraction Guide

This guide lists all files and dependencies needed to extract the AI Agent Chat feature into a separate project while maintaining the current design.

---

## 📁 Core Components (Must Copy)

### 1. Main Chat Interface
- **File:** `/components/cms/AIAssistant.tsx`
- **Purpose:** Main chat UI with messages, input, voice recognition, and message actions
- **Key Features:**
  - Message display (user/assistant bubbles)
  - Auto-resizing textarea input
  - Voice input with speech recognition
  - Message actions (Copy, Like, Dislike, Regenerate)
  - Smooth animations and transitions

### 2. Conversation Threads Sidebar
- **File:** `/components/cms/ConversationThreads.tsx`
- **Purpose:** Sidebar for managing multiple chat conversations
- **Key Features:**
  - List recent conversations
  - Create new thread
  - Delete thread
  - Select/switch between threads
  - Navigation menu (Chats/Projects tabs)

---

## 🛠️ Utilities (Must Copy)

### Conversation Storage
- **File:** `/utils/conversation-storage.ts`
- **Purpose:** LocalStorage-based conversation management
- **Functions:**
  - `getAllThreads()` - Get all conversation threads
  - `getThread(threadId)` - Get specific thread
  - `createThread()` - Create new conversation
  - `updateThreadMessages(threadId, messages)` - Update thread messages
  - `deleteThread(threadId)` - Delete thread
  - `getThreadsSummary()` - Get threads list summary
  - `getCurrentThreadId()` / `setCurrentThreadId()` - Current thread management

---

## 📦 Dependencies (Must Install)

### NPM Packages
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "lucide-react": "latest",
    "react-speech-recognition": "latest",
    "tailwindcss": "^4.0"
  }
}
```

### Browser API Requirements
- `navigator.clipboard` - For copy functionality
- `SpeechRecognition API` - For voice input (check browser support)

---

## 🎨 UI Components from Shadcn (Must Copy)

Copy these files from `/components/ui/`:
- `button.tsx` - Button component
- `sheet.tsx` - Sheet/Drawer component (for mobile sidebar)
- `separator.tsx` - Separator lines

---

## 🎨 Styling Requirements

### 1. Tailwind CSS Setup
Ensure Tailwind v4.0 is configured in your project.

### 2. Required CSS Variables
Copy these from `/styles/globals.css`:

```css
:root {
  /* Background colors */
  --background: oklch(0.9818 0.0054 95.0986);
  --foreground: oklch(0.3438 0.0269 95.7226);
  
  /* Terracotta primary color */
  --primary: oklch(0.6171 0.1375 39.0427); /* #c96442 */
  --primary-foreground: oklch(1.0000 0 0);
  
  /* Border colors */
  --border: oklch(0.8847 0.0069 97.3627);
  
  /* Font families */
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
}
```

### 3. Custom Colors Used
- **Terracotta/Primary:** `#c96442` / `bg-[#c96442]`
- **Background Cream:** `#FAF9F5` / `bg-[#FAF9F5]`
- **User Message Bubble:** `#E9E6DC` / `bg-[#E9E6DC]`
- **Border Gray:** `#DAD9D4` / `border-[#DAD9D4]`
- **Text Colors:**
  - Primary text: `#3D3D3A` / `text-[#3D3D3A]`
  - Secondary text: `#3D3929` / `text-[#3D3929]`
  - Muted text: `#7A776C` / `text-[#7A776C]`
  - Icon gray: `#83827D` / `text-[#83827D]`
  - Light gray: `#ebebeb` / `bg-[#ebebeb]`

### 4. Typography
```css
/* Message text */
font-family: 'Arial';
font-size: 16px;
line-height: 24px;
font-weight: 400;
```

### 5. Border Radius
- Message bubbles: `24px` / `rounded-[24px]`
- Input container: `24px` / `rounded-[24px]`
- Buttons: `full` / `rounded-full`
- Thread items: `lg` / `rounded-lg`

### 6. Animations
Add this CSS for voice visualization bars:
```css
@keyframes pulse {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}
```

---

## 🔧 Integration Points

### Where Chat is Triggered From (Reference Only)

#### 1. CMSDashboard
- **File:** `/components/cms/CMSDashboard.tsx`
- **Integration:** Opens chat in Sheet component
- **Trigger:** "Personal AI" and "AI Agent" sidebar buttons

#### 2. BusinessCardStudio
- **File:** `/components/cms/BusinessCardStudio.tsx`
- **Integration:** Dashboard card with "Personal AI" section
- **Trigger:** Click on AI Assistant card

### How to Integrate in Your Project

```tsx
import { AIAssistant } from './components/AIAssistant';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './components/ui/sheet';

function YourComponent() {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <button onClick={() => setAiOpen(true)}>
        Open AI Assistant
      </button>

      {/* AI Chat Sheet */}
      <Sheet open={aiOpen} onOpenChange={setAiOpen}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-md p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>AI Assistant</SheetTitle>
          </SheetHeader>
          <div className="h-full">
            <AIAssistant
              fieldLabel="General"
              currentValue=""
              onApply={(value) => console.log(value)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
```

---

## 📋 TypeScript Interfaces

### Core Types to Copy

```typescript
// Message type
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Conversation thread data
interface ConversationData {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// Thread summary for sidebar
interface ConversationThread {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  messageCount: number;
}

// AIAssistant props
interface AIAgentProps {
  fieldLabel: string;
  currentValue: string;
  onApply: (value: string) => void;
  initialMessage?: string;
  threadId?: string | null;
  onThreadUpdate?: () => void;
  threads?: any[];
  currentThreadId?: string | null;
  onSelectThread?: (threadId: string) => void;
  onNewThread?: () => void;
  onDeleteThread?: (threadId: string) => void;
  showThreadsMenu?: boolean;
  onThreadsMenuClick?: () => void;
  threadsOpen?: boolean;
  onThreadsOpenChange?: (open: boolean) => void;
  activeTab?: 'ai' | 'products' | 'favourite';
  onTabChange?: (tab: 'ai' | 'products' | 'favourite') => void;
}
```

---

## 🎯 Key Design Patterns

### 1. Message Layout
- **User messages:** Right-aligned, rounded bubble with `bg-[#E9E6DC]`
- **Assistant messages:** Left-aligned, no background, full width
- **Actions:** Only shown for assistant messages (Copy, Like, Dislike, Regenerate)

### 2. Input Area (3 States)
1. **Default:** Textarea + Mic button + Send button
2. **Typing:** Textarea + Send button (mic hidden)
3. **Recording:** Textarea + Voice bars + Active mic button + Send button

### 3. Voice Input Features
- Click mic to start recording
- Continuous listening mode
- Live transcript synced to textarea
- Voice bars visualization (20 animated bars)
- Click mic again to stop

### 4. Auto-resize Textarea
- Min height: 36px (1 line)
- Max height: 96px (4 lines)
- Auto-expands while typing
- Resets after sending

### 5. Responsive Design
- Mobile-first approach
- Full-height layout (`h-full`)
- Scrollable message area
- Sticky input at bottom

---

## 🚀 Optional Enhancements

### To Implement Later (Currently Placeholders)
1. **AI Integration:**
   - Replace `setTimeout` mock response in `handleSendMessage()`
   - Connect to OpenAI API or custom AI backend
   - Stream responses in real-time

2. **Message Actions:**
   - Implement like/dislike feedback storage
   - Implement regenerate functionality
   - Add message editing

3. **Thread Management:**
   - Add thread renaming
   - Add search/filter threads
   - Export conversation history

4. **Attachments:**
   - Implement file upload (Plus button)
   - Support image attachments
   - Support document attachments

---

## 🎨 Visual Reference

### Message Bubble Styling
```tsx
// User message
<div className="ml-auto bg-[#E9E6DC] rounded-[24px] max-w-[80%]"
     style={{
       fontFamily: 'Arial',
       fontSize: '16px',
       lineHeight: '24px',
       fontWeight: 400,
       color: '#3D3929',
       padding: '12px 16px'
     }}>
  Message content
</div>

// Assistant message
<div className="mr-auto max-w-full"
     style={{
       fontFamily: 'Arial',
       fontSize: '16px',
       lineHeight: '24px',
       fontWeight: 400,
       color: '#3D3929',
       padding: '0px'
     }}>
  Message content
</div>
```

### Input Container Styling
```tsx
<div className="flex-1 flex flex-col rounded-[24px] bg-[#FAF9F5]"
     style={{ 
       border: '0.693px solid #DAD9D4',
       paddingLeft: '16px',
       paddingRight: '4px',
       paddingTop: '4px',
       paddingBottom: '4px',
       gap: '4px',
     }}>
  {/* Textarea and buttons */}
</div>
```

### Send Button States
```tsx
// Active (has text)
<button className="bg-[#c96442] text-white rounded-full"
        style={{ width: '36px', height: '36px' }}>
  <ArrowUp />
</button>

// Disabled (no text)
<button className="bg-[#ebebeb] text-[#7A776C] rounded-full"
        style={{ width: '36px', height: '36px' }}>
  <ArrowUp />
</button>
```

---

## ✅ Checklist for Extraction

- [ ] Copy `/components/cms/AIAssistant.tsx`
- [ ] Copy `/components/cms/ConversationThreads.tsx`
- [ ] Copy `/utils/conversation-storage.ts`
- [ ] Copy Shadcn UI components (Button, Sheet, Separator)
- [ ] Install NPM dependencies (react-speech-recognition, lucide-react)
- [ ] Copy CSS variables to your globals.css
- [ ] Copy TypeScript interfaces
- [ ] Set up Tailwind CSS v4.0
- [ ] Add pulse animation keyframes
- [ ] Test speech recognition browser support
- [ ] Implement AI backend integration
- [ ] Test on mobile and desktop
- [ ] Test voice input functionality
- [ ] Test thread creation/deletion
- [ ] Test message actions (copy, etc.)

---

## 🎨 Design System Summary

**Primary Color:** Terracotta `#c96442`
**Background:** Cream `#FAF9F5`
**Typography:** Arial, 16px/24px
**Border Radius:** 24px (containers), full (buttons)
**Spacing:** 12px, 16px standard padding
**Transitions:** `transition-colors` for all interactive elements

---

## 📝 Notes

1. **LocalStorage Only:** Current implementation uses localStorage for persistence. For production, consider database backend.
2. **Mock AI:** Replace the `setTimeout` mock in `handleSendMessage()` with real AI API calls.
3. **Browser Support:** Speech recognition requires modern browsers (Chrome, Edge). Provide fallback for unsupported browsers.
4. **Accessibility:** Add ARIA labels and keyboard navigation support.
5. **Mobile UX:** Touch-friendly button sizes (44px minimum) already implemented.

---

_This extraction guide reflects the current implementation as of the latest code snapshot._
