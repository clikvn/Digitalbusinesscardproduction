import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { HomeForm } from "./forms/HomeForm";
import { ContactForm } from "./forms/ContactForm";
import { PortfolioForm } from "./forms/PortfolioForm";
import { ProfileForm } from "./forms/ProfileForm";
import { ShareManager } from "./ShareManager";
import { UserCodeSettings } from "./UserCodeSettings";
import { ShareConfiguration } from "./ShareConfiguration";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { BusinessCardData } from "../../types/business-card";
import { exportData, importData } from "../../utils/storage";
import { Home, Mail, FileText, Briefcase, Sparkles, ArrowRight, ChevronLeft, Menu, X, Plus, Copy, ThumbsUp, ThumbsDown, Paperclip, Camera, MessageCircle, Trash2, Share2, LogOut, Loader2, Users } from "lucide-react";
import { BarChart3 } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { Badge } from "../ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet";
import { copyWithToast } from "../../utils/clipboard-utils";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "../ui/breadcrumb";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CMSNavigationBar } from "./CMSNavigationBar";
import { AIAssistant } from "./AIAssistant";
import { ConversationThread } from "./ConversationThreads";
import { 
  getAllThreads, 
  createThread, 
  deleteThread, 
  getThreadsSummary, 
  getCurrentThreadId,
  setCurrentThreadId 
} from "../../utils/conversation-storage";
import { parseProfileUrl } from "../../utils/user-code";
import { useBusinessCard } from "../../hooks/useBusinessCard";

interface CMSDashboardProps {
  onLogout: () => void;
  onNavigateHome: () => void;
  activeSection?: string | null;
  onNavigateToStudio: () => void;
  onMenuClick?: () => void;
  onOpenAIAssistant?: () => void;
}

interface ActiveField {
  label: string;
  value: string;
  onApply: (value: string) => void;
  initialMessage?: string;
}

export function CMSDashboard({ onLogout, onNavigateHome, activeSection, onNavigateToStudio, onMenuClick, onOpenAIAssistant }: CMSDashboardProps) {
  // Get userCode from URL
  const { userCode } = parseProfileUrl(window.location.pathname);
  
  // Use hook for data access
  const { data: queryData, update, isLoading } = useBusinessCard(userCode || undefined);
  
  // Local state for form handling
  const [data, setData] = useState<BusinessCardData | null>(null);
  
  const [activeTab, setActiveTab] = useState(activeSection || "home");
  const [activeField, setActiveField] = useState<ActiveField | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAIOpen, setMobileAIOpen] = useState(false);
  const [threadsOpen, setThreadsOpen] = useState(false);
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [currentThreadId, setCurrentThreadIdState] = useState<string | null>(null);

  // AI Tab state
  const [aiActiveTab, setAIActiveTab] = useState<'ai' | 'products' | 'favourite'>('ai');

  // Sync query data to local state
  useEffect(() => {
    if (queryData && !data) {
      setData(queryData);
      // ✅ CRITICAL FIX: Don't trigger auto-save for initial data load
      hasPendingChangesRef.current = false;
    }
  }, [queryData]);

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

  // Update active tab when activeSection prop changes
  useEffect(() => {
    if (activeSection) {
      setActiveTab(activeSection);
    }
  }, [activeSection]);

  // Expose AI Agent opening function to parent
  useEffect(() => {
    if (onOpenAIAssistant) {
      // This effect allows parent to trigger opening the AI Agent
      window.__openAIAssistant = () => setMobileAIOpen(true);
    }
    return () => {
      delete window.__openAIAssistant;
    };
  }, [onOpenAIAssistant]);

  // Auto-save with debouncing to prevent saving on every keystroke
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasPendingChangesRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const latestDataRef = useRef<BusinessCardData | null>(null);

  // Keep latest data in ref for unmount save
  useEffect(() => {
    latestDataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (data) {
      // ✅ CRITICAL FIX: Skip auto-save on initial load
      // This prevents overwriting user data with default data on refresh/logout
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
        return;
      }

      // Mark that we have pending changes
      hasPendingChangesRef.current = true;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout - save after user stops typing for 1500ms (increased from 800ms)
      saveTimeoutRef.current = setTimeout(() => {
        update(data);
        hasPendingChangesRef.current = false;
      }, 1500);
    }

    // Cleanup function
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, update]);

  // Save on unmount - catch any pending changes when user navigates away
  useEffect(() => {
    return () => {
      // If there are pending changes, save them immediately using latest data from ref
      if (hasPendingChangesRef.current && latestDataRef.current) {
        // Clear the debounce timeout
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        // Save immediately using the ref (guaranteed to be latest)
        update(latestDataRef.current);
      }
    };
  }, [update]);

  const handleDataChange = (section: keyof BusinessCardData, value: any) => {
    setData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [section]: value
      };
    });
  };

  const handleCustomLabelChange = (labelKey: string, value: string) => {
    setData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        customLabels: {
          ...prev.customLabels,
          [labelKey]: value
        }
      };
    });
  };

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-card-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const success = importData(text);
        if (success) {
          // Force refresh via hook logic? 
          // importData saves to localStorage, but our hook cache might be stale.
          // We should probably expose a refetch or invalidate in the hook.
          // For now, reloading the page is the safest fallback for this legacy util.
          window.location.reload();
        } else {
          toast.error("Invalid data format");
        }
      } catch (error) {
        toast.error("Failed to import data");
      }
    };
    input.click();
  };

  const handleFieldFocus = (field: ActiveField) => {
    setActiveField(field);
    // Open mobile AI panel when field is focused with initial message
    if (field.initialMessage) {
      setMobileAIOpen(true);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#faf9f5]">
        <Loader2 className="w-8 h-8 animate-spin text-[#c96442]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col h-screen">
      {/* Two Column Layout */}
      <div className="flex-1 flex flex-col max-w-[1920px] mx-auto w-full overflow-hidden min-h-0">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background flex flex-col min-h-0">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b bg-background">
            <CMSNavigationBar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              profileImage={data.personal.profileImage}
              profileName={data.personal.name}
              onMenuClick={onMenuClick || (() => setMobileMenuOpen(true))}
              onAIClick={() => setMobileAIOpen(true)}
              onNavigateToStudio={onNavigateToStudio}
              currentPage="section"
            />
          </header>
          <div className="px-4 py-6 sm:px-8 sm:py-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

              <TabsContent value="home" className="mt-0 space-y-6">
                <HomeForm
                  data={data.personal}
                  onChange={(value) => handleDataChange('personal', value)}
                  onFieldFocus={handleFieldFocus}
                />
              </TabsContent>

              <TabsContent value="contact" className="mt-0 space-y-6">
                <ContactForm
                  contact={data.contact}
                  messaging={data.socialMessaging}
                  channels={data.socialChannels}
                  onContactChange={(value) => handleDataChange('contact', value)}
                  onMessagingChange={(value) => handleDataChange('socialMessaging', value)}
                  onChannelsChange={(value) => handleDataChange('socialChannels', value)}
                  onFieldFocus={handleFieldFocus}
                />
              </TabsContent>

              <TabsContent value="profile" className="mt-0 space-y-6">
                <UserCodeSettings />
                <ProfileForm
                  personal={data.personal}
                  profile={data.profile}
                  customLabels={data.customLabels}
                  onPersonalChange={(value) => handleDataChange('personal', value)}
                  onProfileChange={(value) => handleDataChange('profile', value)}
                  onCustomLabelChange={handleCustomLabelChange}
                  onFieldFocus={handleFieldFocus}
                />
              </TabsContent>

              <TabsContent value="portfolio" className="mt-0 space-y-6">
                <PortfolioForm
                  data={data.portfolio}
                  categories={data.portfolioCategories}
                  onChange={(value) => handleDataChange('portfolio', value)}
                  onCategoriesChange={(value) => handleDataChange('portfolioCategories', value)}
                  onFieldFocus={handleFieldFocus}
                />
              </TabsContent>

              <TabsContent value="share" className="mt-0 space-y-6">
                <ShareManager
                  onMenu={() => setMobileMenuOpen(true)}
                />
              </TabsContent>

              <TabsContent value="shareconfig" className="mt-0 space-y-6">
                <ShareConfiguration />
              </TabsContent>

              <TabsContent value="analytics" className="mt-0 space-y-6">
                <AnalyticsDashboard />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden sticky bottom-0 z-30 border-t bg-white">

      </nav>

      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[300px] p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Navigate between different sections of the dashboard</SheetDescription>
          <div className="flex flex-col p-4 pt-12 space-y-2">
            <button
              onClick={() => {
                setActiveTab("home");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                activeTab === "home" ? "bg-[#f4f4f5] text-[#0a0a0a]" : "text-[#71717a] hover:bg-[#f4f4f5]"
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("contact");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                activeTab === "contact" ? "bg-[#f4f4f5] text-[#0a0a0a]" : "text-[#71717a] hover:bg-[#f4f4f5]"
              }`}
            >
              <Mail className="w-5 h-5" />
              <span>Contact</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("profile");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                activeTab === "profile" ? "bg-[#f4f4f5] text-[#0a0a0a]" : "text-[#71717a] hover:bg-[#f4f4f5]"
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Profile</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("portfolio");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                activeTab === "portfolio" ? "bg-[#f4f4f5] text-[#0a0a0a]" : "text-[#71717a] hover:bg-[#f4f4f5]"
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span>Portfolio</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("share");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                activeTab === "share" ? "bg-[#f4f4f5] text-[#0a0a0a]" : "text-[#71717a] hover:bg-[#f4f4f5]"
              }`}
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("shareconfig");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                activeTab === "shareconfig" ? "bg-[#f4f4f5] text-[#0a0a0a]" : "text-[#71717a] hover:bg-[#f4f4f5]"
              }`}
            >
              <Share2 className="w-5 h-5" />
              <span>Share Config</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("analytics");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                activeTab === "analytics" ? "bg-[#f4f4f5] text-[#0a0a0a]" : "text-[#71717a] hover:bg-[#f4f4f5]"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => {
                setMobileAIOpen(true);
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left text-[#71717a] hover:bg-[#f4f4f5]"
            >
              <Sparkles className="w-5 h-5" />
              <span>Personal AI</span>
            </button>
            <Separator className="my-2" />
            <button
              onClick={() => {
                setMobileAIOpen(true);
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#71717a] hover:bg-[#f4f4f5] transition-colors text-left"
            >
              <Sparkles className="w-5 h-5" />
              <span>AI Agent</span>
            </button>
            <button
              onClick={() => {
                onNavigateHome();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#71717a] hover:bg-[#f4f4f5] transition-colors text-left"
            >
              <Home className="w-5 h-5" />
              <span>View My Profile</span>
            </button>
            <button
              onClick={() => {
                onLogout();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* AI Agent App */}
      <Sheet open={mobileAIOpen} onOpenChange={setMobileAIOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[390px] p-0 bg-[#f5f4ee] [&>button]:hidden">
          <SheetTitle className="sr-only">AI Agent</SheetTitle>
          <SheetDescription className="sr-only">
            Get AI assistance for writing and improving your business card content
          </SheetDescription>
          <div className="flex flex-col h-full relative">
            {/* Header */}
            <div className="h-[46px] shrink-0 relative z-20 border-b border-[#ebebeb] bg-[#FAF9F5]">
              <div className="flex h-[46px] items-center justify-between px-[12px]">
                {/* Menu icon */}
                <button onClick={() => setThreadsOpen(true)} className="shrink-0 size-[24px]" aria-label="Menu">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                    <path d="M4 12H20" stroke="#3D3D3A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    <path d="M4 18H20" stroke="#3D3D3A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    <path d="M4 6H20" stroke="#3D3D3A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </button>
                
                {/* Tabs */}
                <div className="flex-1 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setAIActiveTab('ai')}
                    className={`px-0 pb-[6px] border-b-[1.4px] transition-colors ${
                      aiActiveTab === 'ai' 
                        ? 'border-[#3D3D3A] text-[#3D3D3A]' 
                        : 'border-transparent text-[#7A776C]'
                    }`}
                    style={{ 
                      fontFamily: 'Arial', 
                      fontSize: '16px', 
                      lineHeight: '23px',
                      fontWeight: 400,
                    }}
                  >
                    AI Assistant
                  </button>
                  <button
                    onClick={() => setAIActiveTab('products')}
                    className={`px-0 pb-[6px] border-b-[1.4px] transition-colors ${
                      aiActiveTab === 'products' 
                        ? 'border-[#3D3D3A] text-[#3D3D3A]' 
                        : 'border-transparent text-[#7A776C]'
                    }`}
                    style={{ 
                      fontFamily: 'Arial', 
                      fontSize: '16px', 
                      lineHeight: '23px',
                      fontWeight: 400,
                    }}
                  >
                    Products
                  </button>
                  <button
                    onClick={() => setAIActiveTab('favourite')}
                    className={`px-0 pb-[6px] border-b-[1.4px] transition-colors ${
                      aiActiveTab === 'favourite' 
                        ? 'border-[#3D3D3A] text-[#3D3D3A]' 
                        : 'border-transparent text-[#7A776C]'
                    }`}
                    style={{ 
                      fontFamily: 'Arial', 
                      fontSize: '16px', 
                      lineHeight: '23px',
                      fontWeight: 400,
                    }}
                  >
                    Favourite
                  </button>
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

            {/* Content */}
            {activeField ? (
              <AIAssistant
                fieldLabel={activeField.label}
                currentValue={activeField.value}
                onApply={(value) => {
                  activeField.onApply(value);
                  setMobileAIOpen(false);
                }}
                initialMessage={activeField.initialMessage}
                threadId={currentThreadId}
                onThreadUpdate={handleThreadUpdate}
                threads={threads}
                currentThreadId={currentThreadId}
                onSelectThread={handleSelectThread}
                onNewThread={handleNewThread}
                onDeleteThread={handleDeleteThread}
                activeTab={aiActiveTab}
                onTabChange={setAIActiveTab}
              />
            ) : (
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
                activeTab={aiActiveTab}
                onTabChange={setAIActiveTab}
              />
            )}

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

      {/* Conversation Threads Sheet - No longer needed, can be removed */}
      <Sheet open={false} onOpenChange={() => {}}>
        <SheetContent side="left" className="w-full sm:max-w-[350px] p-0 [&>button]:hidden">
          <SheetTitle className="sr-only">Conversation Threads</SheetTitle>
          <SheetDescription className="sr-only">
            Manage your AI conversation threads
          </SheetDescription>
        </SheetContent>
      </Sheet>
    </div>
  );
}