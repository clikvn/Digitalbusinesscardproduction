import React from "react";
import { Sparkles } from "lucide-react";

interface AIAgentProps {
  fieldLabel: string;
  currentValue: string;
  onApply: (value: string) => void;
  initialMessage?: string;
  threadId?: string | null;
  onThreadUpdate?: () => void;
  // Thread management props
  threads?: any[];
  currentThreadId?: string | null;
  onSelectThread?: (threadId: string) => void;
  onNewThread?: () => void;
  onDeleteThread?: (threadId: string) => void;
  // Show menu button
  showThreadsMenu?: boolean;
  onThreadsMenuClick?: () => void;
  // External control of threads panel
  threadsOpen?: boolean;
  onThreadsOpenChange?: (open: boolean) => void;
}

/**
 * AI Assistant Component - Placeholder for Flowise Integration
 * 
 * This component is currently disabled as we are migrating from OpenAI to Flowise.
 * The UI structure is preserved for future Flowise integration.
 */
export function AIAssistant({ 
  fieldLabel, 
}: AIAgentProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="mb-4 p-4 rounded-full bg-gray-100">
        <Sparkles className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="mb-2">AI Assistant Unavailable</h3>
      <p className="text-gray-500 max-w-md">
        The AI assistant is currently being upgraded to a new platform. 
        This feature will be available again soon with improved capabilities.
      </p>
    </div>
  );
}
