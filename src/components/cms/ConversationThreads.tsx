import React from "react";
import { Plus, MessageSquare, Trash2, X, Edit, Sparkles } from "lucide-react";
import { Button } from "../ui/button";

export interface ConversationThread {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  messageCount: number;
}

interface ConversationThreadsProps {
  threads: ConversationThread[];
  currentThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
  onDeleteThread: (threadId: string) => void;
  onClose?: () => void;
}

export function ConversationThreads({
  threads,
  currentThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  onClose,
}: ConversationThreadsProps) {
  // Sort threads by timestamp (newest first)
  const sortedThreads = [...threads].sort((a, b) => b.timestamp - a.timestamp);

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-[#faf9f5]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#dad9d4]">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#ebebeb]/50 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-[#3d3d3a]" />
          </button>
        )}
        
        {/* New Chat Button */}
        <button
          onClick={onNewThread}
          className="flex items-center gap-2 px-3 py-2 hover:bg-[#ebebeb]/50 rounded-lg transition-colors ml-auto"
          aria-label="New chat"
        >
          <div className="w-6 h-6 bg-[#c96442] rounded-full flex items-center justify-center">
            <Edit className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm text-[#3d3d3a]">New chat</span>
        </button>
      </div>

      {/* Navigation Menu */}
      <div className="px-2 py-3 border-b border-[#dad9d4]">
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[#ebebeb]/50 text-[#3d3d3a] text-sm transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span>Chats</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#ebebeb]/30 text-[#7a776c] text-sm transition-colors">
            <Sparkles className="w-4 h-4" />
            <span>Projects</span>
          </button>
        </div>
      </div>

      {/* Recents Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <h3 className="text-xs text-[#7a776c] px-2 mb-2">Recents</h3>
          {sortedThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-4">
              <MessageSquare className="w-8 h-8 text-[#83827d] mb-2 opacity-50" />
              <p className="text-xs text-[#83827d]">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {sortedThreads.map((thread) => (
                <div
                  key={thread.id}
                  className={`group relative rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                    currentThreadId === thread.id
                      ? "bg-[#ebebeb]/70"
                      : "hover:bg-[#ebebeb]/30"
                  }`}
                  onClick={() => onSelectThread(thread.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#7a776c] flex-shrink-0" />
                      <span className="text-sm text-[#3d3d3a] truncate">
                        {thread.title}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteThread(thread.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#ebebeb]/50 rounded flex-shrink-0"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#7a776c]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}