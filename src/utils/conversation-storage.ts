import { ConversationThread } from "../components/cms/ConversationThreads";

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ConversationData {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const THREADS_STORAGE_KEY = 'ai-conversation-threads';
const CURRENT_THREAD_KEY = 'ai-current-thread-id';

/**
 * Generate a title from the first user message
 */
function generateTitle(firstMessage: string): string {
  const maxLength = 50;
  const cleaned = firstMessage.trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength) + '...';
}

/**
 * Get all conversation threads
 */
export function getAllThreads(): ConversationData[] {
  try {
    const stored = localStorage.getItem(THREADS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[Conversation Storage] Failed to load threads:', error);
  }
  return [];
}

/**
 * Get a specific thread by ID
 */
export function getThread(threadId: string): ConversationData | null {
  const threads = getAllThreads();
  return threads.find(t => t.id === threadId) || null;
}

/**
 * Save all threads to localStorage
 */
function saveAllThreads(threads: ConversationData[]): void {
  try {
    localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
  } catch (error) {
    console.error('[Conversation Storage] Failed to save threads:', error);
  }
}

/**
 * Create a new conversation thread
 */
export function createThread(): ConversationData {
  const newThread: ConversationData = {
    id: `thread-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title: 'New Conversation',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const threads = getAllThreads();
  threads.push(newThread);
  saveAllThreads(threads);
  setCurrentThreadId(newThread.id);

  return newThread;
}

/**
 * Update a thread's messages
 */
export function updateThreadMessages(threadId: string, messages: Message[]): void {
  const threads = getAllThreads();
  const threadIndex = threads.findIndex(t => t.id === threadId);
  
  if (threadIndex !== -1) {
    threads[threadIndex].messages = messages;
    threads[threadIndex].updatedAt = Date.now();
    
    // Update title based on first user message if still "New Conversation"
    if (threads[threadIndex].title === 'New Conversation' && messages.length > 0) {
      const firstUserMessage = messages.find(m => m.role === 'user');
      if (firstUserMessage) {
        threads[threadIndex].title = generateTitle(firstUserMessage.content);
      }
    }
    
    saveAllThreads(threads);
  }
}

/**
 * Delete a thread
 */
export function deleteThread(threadId: string): void {
  const threads = getAllThreads();
  const filteredThreads = threads.filter(t => t.id !== threadId);
  saveAllThreads(filteredThreads);
  
  // If deleting current thread, clear current thread ID
  if (getCurrentThreadId() === threadId) {
    localStorage.removeItem(CURRENT_THREAD_KEY);
  }
}

/**
 * Get all threads as summary for the threads list
 */
export function getThreadsSummary(): ConversationThread[] {
  const threads = getAllThreads();
  return threads.map(thread => {
    const lastMessage = thread.messages.length > 0 
      ? thread.messages[thread.messages.length - 1].content
      : 'No messages yet';
    
    return {
      id: thread.id,
      title: thread.title,
      lastMessage: lastMessage.substring(0, 60) + (lastMessage.length > 60 ? '...' : ''),
      timestamp: thread.updatedAt,
      messageCount: thread.messages.filter(m => m.role !== 'system').length,
    };
  });
}

/**
 * Get current thread ID
 */
export function getCurrentThreadId(): string | null {
  return localStorage.getItem(CURRENT_THREAD_KEY);
}

/**
 * Set current thread ID
 */
export function setCurrentThreadId(threadId: string): void {
  localStorage.setItem(CURRENT_THREAD_KEY, threadId);
}

/**
 * Clear current thread ID
 */
export function clearCurrentThreadId(): void {
  localStorage.removeItem(CURRENT_THREAD_KEY);
}
