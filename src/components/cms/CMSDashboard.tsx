import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
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
import { EmployeeManager } from "./EmployeeManager";
import { BusinessCardData } from "../../types/business-card";
import { exportData, importData } from "../../utils/storage";
import { Home, Mail, FileText, Briefcase, Sparkles, ArrowRight, ChevronLeft, Menu, X, Plus, Copy, ThumbsUp, ThumbsDown, Paperclip, Camera, MessageCircle, Trash2, Share2, LogOut, Loader2, Users } from "lucide-react";
import { useBusinessManagement } from "../../hooks/useBusinessManagement";
import { BarChart3 } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { Badge } from "../ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet";
import { copyWithToast } from "../../utils/clipboard-utils";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "../ui/breadcrumb";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CMSNavigationBar } from "./CMSNavigationBar";
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
  const { t } = useTranslation();
  // Get userCode from URL
  const { userCode } = parseProfileUrl(window.location.pathname);
  
  // Use hook for data access
  const { data: queryData, update, isLoading } = useBusinessCard(userCode || undefined);
  
  // Check if user is business owner
  const { isBusinessOwner } = useBusinessManagement();
  
  // Local state for form handling
  const [data, setData] = useState<BusinessCardData | null>(null);
  
  const [activeTab, setActiveTab] = useState(activeSection || "home");
  const [activeField, setActiveField] = useState<ActiveField | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync query data to local state
  useEffect(() => {
    if (queryData && !data) {
      setData(queryData);
      // ✅ CRITICAL FIX: Don't trigger auto-save for initial data load
      hasPendingChangesRef.current = false;
    }
  }, [queryData]);

  // Update active tab when activeSection prop changes
  useEffect(() => {
    if (activeSection) {
      setActiveTab(activeSection);
    }
  }, [activeSection]);

  // Expose AI Agent opening function to parent (for external script integration)
  useEffect(() => {
    if (onOpenAIAssistant) {
      // This effect allows parent to trigger opening the AI Agent via external script
      window.__openAIAssistant = () => {
        if (onOpenAIAssistant) {
          onOpenAIAssistant();
        }
      };
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
    toast.success(t("common.success"));
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
          toast.error(t("common.error"));
        }
      } catch (error) {
          toast.error(t("common.error"));
      }
    };
    input.click();
  };

  const handleFieldFocus = (field: ActiveField) => {
    setActiveField(field);
    // Trigger external AI script if available when field is focused
    if (field.initialMessage && (window as any).__openAIAssistant) {
      (window as any).__openAIAssistant();
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
              onAIClick={() => {
                toast.info(t("messages.comingSoon"));
              }}
              onNavigateToStudio={onNavigateToStudio}
              currentPage="section"
              isBusinessOwner={isBusinessOwner}
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

              {isBusinessOwner && (
                <TabsContent value="employees" className="mt-0 space-y-6">
                  <EmployeeManager />
                </TabsContent>
              )}
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
            {isBusinessOwner && (
              <button
                onClick={() => {
                  setActiveTab("employees");
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                  activeTab === "employees" ? "bg-[#f4f4f5] text-[#0a0a0a]" : "text-[#71717a] hover:bg-[#f4f4f5]"
                }`}
              >
                <Users className="w-5 h-5" />
                <span>My Business</span>
              </button>
            )}
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
              <span>{t("navigation.analytics")}</span>
            </button>
            <button
              onClick={() => {
                toast.info(t("messages.comingSoon"));
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left text-[#71717a] hover:bg-[#f4f4f5]"
            >
              <Sparkles className="w-5 h-5" />
              <span>{t("navigation.personalAI")}</span>
            </button>
            <Separator className="my-2" />
            <button
              onClick={() => {
                toast.info(t("messages.comingSoon"));
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#71717a] hover:bg-[#f4f4f5] transition-colors text-left"
            >
              <Sparkles className="w-5 h-5" />
              <span>{t("navigation.aiAgent")}</span>
            </button>
            <button
              onClick={() => {
                onNavigateHome();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#71717a] hover:bg-[#f4f4f5] transition-colors text-left"
            >
              <Home className="w-5 h-5" />
              <span>{t("navigation.viewMyProfile")}</span>
            </button>
            <button
              onClick={() => {
                onLogout();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut className="w-5 h-5" />
              <span>{t("common.logout")}</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}