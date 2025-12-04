import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Home, Mail, FileText, Briefcase, Sparkles, ArrowRight, ChevronLeft, Menu, X, Plus, Copy, ThumbsUp, ThumbsDown, Paperclip, Camera, MessageCircle, Trash2, Share2 } from "lucide-react";
import { BarChart3 } from "lucide-react";
import { CMSNavigationBar } from "./CMSNavigationBar";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "../ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { toast } from "sonner@2.0.3";
import { AIAssistant } from "./AIAssistant";
import { ConversationThreads, ConversationThread } from "./ConversationThreads";
import { 
  getAllThreads, 
  createThread, 
  deleteThread, 
  getThreadsSummary, 
  getCurrentThreadId,
  setCurrentThreadId,
  getThread,
  ConversationData 
} from "../../utils/conversation-storage";
import { copyWithToast } from "../../utils/clipboard-utils";

interface BusinessCardStudioProps {
  onNavigateToSection: (section: string) => void;
  onNavigateHome?: () => void;
  onMenuClick?: () => void;
  onAIClick?: () => void;
  profileImage?: string;
  profileName?: string;
}

export function BusinessCardStudio({ onNavigateToSection, onNavigateHome, onMenuClick, onAIClick, profileImage, profileName }: BusinessCardStudioProps) {
  const [mobileAIOpen, setMobileAIOpen] = useState(false);
  const [threadsOpen, setThreadsOpen] = useState(false);
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [currentThreadId, setCurrentThreadIdState] = useState<string | null>(null);

  // Load threads on mount
  useEffect(() => {
    loadThreads();
    const savedThreadId = getCurrentThreadId();
    setCurrentThreadIdState(savedThreadId);
  }, []);

  const loadThreads = () => {
    const threadsSummary = getThreadsSummary();
    setThreads(threadsSummary);
  };

  const handleNewThread = () => {
    const newThread = createThread();
    setCurrentThreadIdState(newThread.id);
    loadThreads();
    setThreadsOpen(false);
    toast.success("New conversation started");
  };

  const handleSelectThread = (threadId: string) => {
    setCurrentThreadIdState(threadId);
    setCurrentThreadId(threadId);
    setThreadsOpen(false);
    toast.success("Conversation loaded");
  };

  const handleDeleteThread = (threadId: string) => {
    deleteThread(threadId);
    if (currentThreadId === threadId) {
      setCurrentThreadIdState(null);
    }
    loadThreads();
    toast.success("Conversation deleted");
  };

  const handleThreadUpdate = () => {
    loadThreads();
  };

  const handleApplySuggestion = async (value: string) => {
    // Copy to clipboard when applying suggestion in general chat
    await copyWithToast(
      value, 
      toast, 
      "Copied to clipboard! You can paste it into any field.",
      "Unable to copy to clipboard. Please copy manually."
    );
  };

  const cards = [
    {
      id: "home",
      title: "Home",
      description: "Customize your main profile card with name, title, and location",
      icon: Home,
      color: "bg-gradient-to-br from-[#c96442]/10 to-[#c96442]/5",
      iconColor: "text-[#c96442]",
    },
    {
      id: "contact",
      title: "Contact",
      description: "Add your contact information and social media links",
      icon: Mail,
      color: "bg-gradient-to-br from-blue-500/10 to-blue-500/5",
      iconColor: "text-blue-600",
    },
    {
      id: "profile",
      title: "Profile",
      description: "Share your story, experience, and professional background",
      icon: FileText,
      color: "bg-gradient-to-br from-green-500/10 to-green-500/5",
      iconColor: "text-green-600",
    },
    {
      id: "portfolio",
      title: "Portfolio",
      description: "Showcase your work with images, videos, and project details",
      icon: Briefcase,
      color: "bg-gradient-to-br from-purple-500/10 to-purple-500/5",
      iconColor: "text-purple-600",
    },
    {
      id: "share",
      title: "Share",
      description: "Share your digital card with contacts via QR code, URL, or email",
      icon: Share2,
      color: "bg-gradient-to-br from-orange-500/10 to-orange-500/5",
      iconColor: "text-orange-600",
    },
    {
      id: "shareconfig",
      title: "Share Config",
      description: "Control which fields are visible to each contact group",
      icon: Share2,
      color: "bg-gradient-to-br from-pink-500/10 to-pink-500/5",
      iconColor: "text-pink-600",
    },
    {
      id: "analytics",
      title: "Analytics",
      description: "Track engagement and views across all your shared links",
      icon: BarChart3,
      color: "bg-gradient-to-br from-cyan-500/10 to-cyan-500/5",
      iconColor: "text-cyan-600",
    },
    {
      id: "ai-assistant",
      title: "Personal AI",
      description: "Get AI-powered help to craft compelling content for your card",
      icon: Sparkles,
      color: "bg-gradient-to-br from-amber-500/10 to-amber-500/5",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col h-screen">
      {/* Main Layout */}
      <div className="flex-1 flex flex-col max-w-[1920px] mx-auto w-full overflow-hidden min-h-0">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#faf9f5] flex flex-col min-h-0">
          {/* Top Navigation Bar */}
          {onNavigateHome && onMenuClick && (
            <div className="border-b bg-[#faf9f5] sticky top-0 z-30">
              <CMSNavigationBar
                onMenuClick={onMenuClick}
                currentPage="overview"
                onAIClick={() => setMobileAIOpen(true)}
                profileImage={profileImage}
                profileName={profileName || "User"}
              />
            </div>
          )}

          <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col md:p-6 px-[16px] py-[16px]">
            {/* Header */}
            <div className="mb-4 md:mb-6">
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 auto-rows-fr">
              {cards.map((card) => {
                return (
                  <Card
                    key={card.id}
                    className="border-[#e4e4e7] shadow-sm hover:border-[#c96442]/30 transition-all cursor-pointer group hover:shadow-md active:scale-[0.98] h-full"
                    onClick={() => card.id === 'ai-assistant' ? setMobileAIOpen(true) : onNavigateToSection(card.id)}
                  >
                    <div className="px-4 md:px-6 pt-4 pb-4 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <card.icon className={`w-5 h-5 ${card.iconColor} shrink-0`} />
                          <span className="text-lg leading-[20px] m-0 p-0">{card.title}</span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-[#83827d] group-hover:text-[#c96442] group-hover:translate-x-1 transition-all shrink-0" />
                      </div>
                      <p className="text-sm text-[#71717a] m-0 pl-8 leading-[20px]">
                        {card.description}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </main>

        {/* AI Agent App - Mobile Sheet */}
        <Sheet open={mobileAIOpen} onOpenChange={setMobileAIOpen}>
          <SheetContent side="right" className="w-full sm:max-w-[390px] p-0 bg-[#f5f4ee] [&>button]:hidden">
            <SheetTitle className="sr-only">AI Agent</SheetTitle>
            <SheetDescription className="sr-only">
              Get AI assistance for writing and improving your business card content
            </SheetDescription>
            <div className="flex flex-col h-full relative">
              {/* Header */}
              <div className="h-[46px] shrink-0 relative z-20 border-b border-[#ebebeb]">
                <div className="flex h-[46px] items-center justify-between px-[12px]">
                  {/* Menu icon */}
                  <button onClick={() => setThreadsOpen(true)} className="shrink-0 size-[24px]" aria-label="Menu">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                      <path d="M4 12H20" stroke="#3D3D3A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      <path d="M4 18H20" stroke="#3D3D3A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      <path d="M4 6H20" stroke="#3D3D3A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </button>
                  
                  {/* Title */}
                  <div className="flex-1 text-center">
                    <p className="leading-[20px] text-[#3d3929] text-sm text-[16px] font-medium">
                      AI Agent
                    </p>
                  </div>
                  
                  {/* Close button */}
                  <button 
                    onClick={() => setMobileAIOpen(false)}
                    className="shrink-0 size-[28px] rounded-[6px] flex items-center justify-center hover:bg-[#ebebeb]/30 transition-colors" 
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-[#83827d]" strokeWidth={1.67} />
                  </button>
                </div>
              </div>

              {/* AI Assistant Component - Connected to ChatKit */}
              <AIAssistant
                fieldLabel="Business Card Content"
                currentValue=""
                onApply={handleApplySuggestion}
                threadId={currentThreadId}
                onThreadUpdate={handleThreadUpdate}
                threads={threads}
                currentThreadId={currentThreadId}
                onSelectThread={handleSelectThread}
                onNewThread={handleNewThread}
                onDeleteThread={handleDeleteThread}
              />

              {/* Threads Sidebar Overlay - Full Height */}
              <div 
                className={`absolute inset-0 w-full sm:w-[280px] bg-[#faf9f5] border-r border-[#dad9d4] z-30 transition-transform duration-300 ${
                  threadsOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex h-[46px] items-center justify-between px-[12px] border-b border-[#dad9d4]">
                    {/* New Chat Button */}
                    <button
                      onClick={() => {
                        handleNewThread();
                        setThreadsOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-[#ebebeb]/50 rounded-lg transition-colors"
                      aria-label="New chat"
                    >
                      <div className="w-6 h-6 bg-[#c96442] rounded-full flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm text-[#3d3d3a]">New chat</span>
                    </button>
                    
                    {/* Close Button */}
                    <button
                      onClick={() => setThreadsOpen(false)}
                      className="shrink-0 size-[28px] rounded-[6px] flex items-center justify-center hover:bg-[#ebebeb]/30 transition-colors"
                      aria-label="Close sidebar"
                    >
                      <X className="w-5 h-5 text-[#83827d]" strokeWidth={1.67} />
                    </button>
                  </div>

                  {/* Navigation Menu */}
                  <div className="px-2 py-3 border-b border-[#dad9d4]">
                    <div className="space-y-1">
                      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[#ebebeb]/50 text-[#3d3d3a] text-sm transition-colors">
                        <MessageCircle className="w-4 h-4" />
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
                      {threads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                          <MessageCircle className="w-8 h-8 text-[#83827d] mb-2 opacity-50" />
                          <p className="text-xs text-[#83827d]">No conversations yet</p>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          {[...threads].sort((a, b) => b.timestamp - a.timestamp).map((thread) => (
                            <div
                              key={thread.id}
                              className={`group relative rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                                currentThreadId === thread.id
                                  ? "bg-[#ebebeb]/70"
                                  : "hover:bg-[#ebebeb]/30"
                              }`}
                              onClick={() => {
                                handleSelectThread(thread.id);
                                setThreadsOpen(false);
                              }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0 flex items-center gap-2">
                                  <MessageCircle className="w-4 h-4 text-[#7a776c] flex-shrink-0" />
                                  <span className="text-sm text-[#3d3d3a] truncate">
                                    {thread.title}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteThread(thread.id);
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
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}