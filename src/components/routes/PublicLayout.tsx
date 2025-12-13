import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner@2.0.3";
import { HomeBackgroundImage } from "../home/HomeBackgroundImage";
import { Gradient } from "../home/Gradient";
import { NavigationMenu } from "../layout/NavigationMenu";
import { ContactScreen } from "../screens/ContactScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { PortfolioScreen } from "../screens/PortfolioScreen";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "../ui/sheet";
import { X, MessageSquare, Plus, Trash2, Sparkles } from "lucide-react";
import { AIAssistant } from "../cms/AIAssistant";
import { ConversationThread } from "../cms/ConversationThreads";
import { 
  createThread, 
  deleteThread, 
  getThreadsSummary, 
  getCurrentThreadId,
  setCurrentThreadId 
} from "../../utils/conversation-storage";
import { copyWithToast } from "../../utils/clipboard-utils";
import { getUserCode, buildProfileUrl, buildCMSUrl } from "../../utils/user-code";
import { trackPageView } from "../../utils/analytics";
import { supabase } from "../../lib/supabase-client";

export function PublicLayout({ screen }: { screen: 'home' | 'contact' | 'profile' | 'portfolio' }) {
  const { userCode, groupCode, contactCode } = useParams<{ 
    userCode: string; 
    groupCode?: string;
    contactCode?: string;
  }>();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  
  // AI Agent state
  const [aiAgentOpen, setAIAgentOpen] = useState(false);
  const [threadsOpen, setThreadsOpen] = useState(false);
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [currentThreadId, setCurrentThreadIdState] = useState<string | null>(null);

  // Redirect to public group if no groupCode provided
  useEffect(() => {
    const redirectToPublic = async () => {
      if (!groupCode && userCode) {
        try {
          // Fetch public group's share code
          const { data, error } = await supabase
            .from('user_share_groups')
            .select('share_code')
            .eq('user_code', userCode)
            .eq('id', 'public')
            .maybeSingle();
          
          if (data && data.share_code && !error) {
            // Build new URL with public share code
            let newPath = `/${userCode}/${data.share_code}`;
            if (screen !== 'home') {
              newPath += `/${screen}`;
            }
            navigate(newPath, { replace: true });
          }
        } catch (e) {
          console.error('Error fetching public share code:', e);
          // Continue anyway, just won't redirect
        }
      }
    };
    
    redirectToPublic();
  }, [userCode, groupCode, screen, navigate]);

  // Track page view
  useEffect(() => {
    const trackPage = async () => {
      if (!userCode) return;
      
      const pageMap = {
        'home': 'page.home',
        'contact': 'page.contact',
        'profile': 'page.profile',
        'portfolio': 'page.portfolio',
      } as const;
      
      // If no groupCode, fetch the actual default group's share code from database
      let effectiveShareCode = groupCode;
      
      if (!effectiveShareCode) {
        try {
          // Query for the default group (is_default = true)
          const { data, error } = await supabase
            .from('user_share_groups')
            .select('share_code')
            .eq('user_code', userCode)
            .eq('is_default', true)
            .maybeSingle();
          
          if (data?.share_code && !error) {
            effectiveShareCode = data.share_code;
            console.log('[PublicLayout] Resolved default share code:', effectiveShareCode);
          } else {
            console.error('[PublicLayout] No default group found for user:', userCode, error);
            return; // Don't track if we can't find the share code
          }
        } catch (e) {
          console.error('[PublicLayout] Error fetching default share code:', e);
          return; // Don't track on error
        }
      }
      
      trackPageView(
        userCode,
        effectiveShareCode,
        pageMap[screen],
        contactCode // Contact ID would need to be parsed from somewhere else if needed
      );
    };
    
    trackPage();
  }, [userCode, groupCode, screen, contactCode]);

  // Check if current user is the owner (for showing edit buttons)
  const isOwner = userCode === getUserCode();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session && isOwner);
      setUserId(session?.user?.id);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session && isOwner);
      setUserId(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, [isOwner]);

  // AI Agent Logic
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
    await copyWithToast(
      value, 
      toast, 
      "Copied to clipboard! You can paste it into any field.",
      "Unable to copy to clipboard. Please copy manually."
    );
  };

  // Navigation Helpers
  const navigateTo = (targetScreen: 'home' | 'contact' | 'profile' | 'portfolio') => {
    let url = `/${userCode}`;
    if (groupCode) url += `/${groupCode}`;
    if (targetScreen !== 'home') url += `/${targetScreen}`;
    navigate(url);
  };

  const navigateToCMS = (section?: string) => {
    navigate(buildCMSUrl(getUserCode(), section));
  };

  return (
    <div className="bg-[#faf9f5] w-full h-full relative" style={{ height: 'calc(var(--vh, 1vh) * 100)', overflow: screen === 'home' ? 'hidden' : 'auto' }}>
      {/* Home Screen Specific Layout */}
      {screen === 'home' && (
        <div className="bg-[#c96442] w-full h-full relative">
          <HomeBackgroundImage />
          <Gradient 
            onNavigateToContact={() => navigateTo('contact')} 
            onNavigateToProfile={() => navigateTo('profile')}
            onNavigateToPortfolio={() => navigateTo('portfolio')}
          />
        </div>
      )}

      {/* Other Screens */}
      {screen === 'contact' && (
        <ContactScreen 
          onBack={() => navigateTo('home')} 
          onMenuClick={() => setIsMenuOpen(true)} 
          onAIClick={() => setAIAgentOpen(true)} 
        />
      )}

      {screen === 'profile' && (
        <ProfileScreen 
          onBack={() => navigateTo('home')} 
          onMenuClick={() => setIsMenuOpen(true)} 
        />
      )}

      {screen === 'portfolio' && (
        <PortfolioScreen 
          onBack={() => navigateTo('home')} 
          onMenuClick={() => setIsMenuOpen(true)} 
        />
      )}

      {/* Navigation Menu - Always available via Home NavBar or specific headers */}
      <NavigationMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigateHome={() => navigateTo('home')}
        onNavigateContact={() => navigateTo('contact')}
        onNavigateProfile={() => navigateTo('profile')}
        onNavigatePortfolio={() => navigateTo('portfolio')}
        onNavigateToMyProfile={() => navigate(buildCMSUrl(getUserCode()))}
        currentScreen={screen}
        isAuthenticated={isAuthenticated}
        onLogin={() => navigate(buildCMSUrl(getUserCode()))}
        onLogout={async () => {
          await supabase.auth.signOut();
          toast.success("Logged out successfully");
          // Stay on page, just update state (handled by onAuthStateChange)
        }}
        onNavigateToCMS={navigateToCMS}
        onOpenAIAssistant={() => {
          // Go to CMS and open AI
          navigateToCMS();
          // Note: In a real app we'd pass a state/query param to open AI, 
          // but for now relies on the existing global hack or just navigating
          setTimeout(() => {
            if ((window as any).__openAIAssistant) (window as any).__openAIAssistant();
          }, 500);
        }}
        userId={userId}
      />

      {/* AI Agent Sheet (Only for Contact screen mostly, but kept here for completeness) */}
      <Sheet open={aiAgentOpen} onOpenChange={setAIAgentOpen}>
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
                    onClick={() => setAIAgentOpen(false)}
                    className="shrink-0 size-[28px] rounded-[6px] flex items-center justify-center hover:bg-[#ebebeb]/30 transition-colors" 
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-[#83827d]" strokeWidth={1.67} />
                  </button>
                </div>
              </div>

              {/* AI Assistant Component */}
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
                      {threads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                          <MessageSquare className="w-8 h-8 text-[#83827d] mb-2 opacity-50" />
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
                                  <MessageSquare className="w-4 h-4 text-[#7a776c] flex-shrink-0" />
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
  );
}