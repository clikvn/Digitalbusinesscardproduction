import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Home, Mail, User, Briefcase, Sparkles, LogOut, LogIn, CreditCard, Share2, BarChart3, Key } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "../ui/sheet";
import { useUserPlan } from "../../hooks/useUserPlan";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "../ui/badge";
import { ChangePasswordDialog } from "../cms/ChangePasswordDialog";
import { UpgradePlanDialog } from "../cms/UpgradePlanDialog";
import { LanguageSwitcher } from "../common/LanguageSwitcher";
import { toast } from "sonner@2.0.3";

export function NavigationMenu({ 
  isOpen, 
  onClose, 
  onNavigateHome, 
  onNavigateContact, 
  onNavigateProfile, 
  onNavigatePortfolio,
  onNavigateToMyProfile,
  currentScreen,
  isAuthenticated,
  onLogin,
  onLogout,
  onNavigateToCMS,
  cmsSection,
  onOpenAIAssistant,
  userId
}: { 
  isOpen: boolean;
  onClose: () => void;
  onNavigateHome: () => void;
  onNavigateContact: () => void;
  onNavigateProfile: () => void;
  onNavigatePortfolio: () => void;
  onNavigateToMyProfile?: () => void;
  currentScreen: 'home' | 'contact' | 'profile' | 'portfolio';
  isAuthenticated?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
  onNavigateToCMS?: (section: string) => void;
  cmsSection?: string | null;
  onOpenAIAssistant?: () => void;
  userId?: string;
}) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  // Only fetch user plan if authenticated and userId is provided
  // This prevents showing cached plan data after logout
  const { data: userPlanData } = useUserPlan(isAuthenticated ? userId : undefined);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [showUpgradePlanDialog, setShowUpgradePlanDialog] = useState(false);
  
  // Explicitly set userPlan to undefined when not authenticated to prevent showing cached data
  const userPlan = isAuthenticated ? userPlanData : undefined;
  
  // Clear user plan cache when authentication status changes to false
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear all user plan queries when not authenticated
      queryClient.removeQueries({ queryKey: ['user-plan'] });
    }
  }, [isAuthenticated, queryClient]);
  
  const handleNavigation = (navigateFn: () => void) => {
    navigateFn();
    onClose();
  };

  const getPlanBadgeVariant = (planName?: string) => {
    switch (planName) {
      case 'admin':
        return 'default'; // Dark badge
      case 'premium':
        return 'secondary'; // Gray badge
      case 'free':
      default:
        return 'outline'; // Outline badge
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[300px] bg-[#faf9f5] border-r border-[#e9e6dc]">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Navigate to different sections of the app
        </SheetDescription>
        
        {/* Plan Badge and Language Switcher - positioned at top left, same row as X button */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {isAuthenticated && userPlan && (
            <button
              onClick={() => setShowUpgradePlanDialog(true)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              aria-label="View upgrade options"
            >
              <Badge variant={getPlanBadgeVariant(userPlan.plan_name)} className="text-xs">
                {userPlan.display_name}
              </Badge>
            </button>
          )}
          <LanguageSwitcher />
        </div>
        
        <div className="flex flex-col px-4 mt-12 gap-1 overflow-y-auto flex-1 pb-6">
          {/* Top Section - Main Navigation */}
          <button
            onClick={() => handleNavigation(onNavigateHome)}
            className={`w-full flex items-center gap-3 h-12 pl-4 rounded-lg transition-colors ${
              currentScreen === 'home' && !cmsSection
                ? 'bg-zinc-100' 
                : 'hover:bg-zinc-50'
            }`}
          >
            <Home className={`w-5 h-5 ${currentScreen === 'home' && !cmsSection ? 'text-neutral-950' : 'text-zinc-500'}`} />
            <span className={currentScreen === 'home' && !cmsSection ? 'text-neutral-950' : 'text-zinc-500'}>{t("navigation.home")}</span>
          </button>

          <button
            onClick={() => handleNavigation(onNavigateContact)}
            className={`w-full flex items-center gap-3 h-12 pl-4 rounded-lg transition-colors ${
              currentScreen === 'contact' 
                ? 'bg-zinc-100' 
                : 'hover:bg-zinc-50'
            }`}
          >
            <Mail className={`w-5 h-5 ${currentScreen === 'contact' ? 'text-neutral-950' : 'text-zinc-500'}`} />
            <span className={currentScreen === 'contact' ? 'text-neutral-950' : 'text-zinc-500'}>{t("navigation.contact")}</span>
          </button>

          <button
            onClick={() => handleNavigation(onNavigateProfile)}
            className={`w-full flex items-center gap-3 h-12 pl-4 rounded-lg transition-colors ${
              currentScreen === 'profile' 
                ? 'bg-zinc-100' 
                : 'hover:bg-zinc-50'
            }`}
          >
            <User className={`w-5 h-5 ${currentScreen === 'profile' ? 'text-neutral-950' : 'text-zinc-500'}`} />
            <span className={currentScreen === 'profile' ? 'text-neutral-950' : 'text-zinc-500'}>{t("navigation.profile")}</span>
          </button>

          <button
            onClick={() => handleNavigation(onNavigatePortfolio)}
            className={`w-full flex items-center gap-3 h-12 pl-4 rounded-lg transition-colors ${
              currentScreen === 'portfolio' 
                ? 'bg-zinc-100' 
                : 'hover:bg-zinc-50'
            }`}
          >
            <Briefcase className={`w-5 h-5 ${currentScreen === 'portfolio' ? 'text-neutral-950' : 'text-zinc-500'}`} />
            <span className={currentScreen === 'portfolio' ? 'text-neutral-950' : 'text-zinc-500'}>{t("navigation.portfolio")}</span>
          </button>

          <button
            onClick={() => {
              toast.info(t("messages.comingSoon"));
              onClose();
            }}
            className="w-full flex items-center gap-3 h-12 pl-4 rounded-lg transition-colors hover:bg-zinc-50"
          >
            <Sparkles className="w-5 h-5 text-zinc-500" />
            <span className="text-zinc-500">{t("navigation.aiAgent")}</span>
          </button>

          {/* Separator */}
          <div className="bg-[#dad9d4] h-px my-4" />

          {/* Bottom Section - CMS/Admin */}
          {isAuthenticated ? (
            <>
              <button
                onClick={() => {
                  setShowChangePasswordDialog(true);
                  onClose();
                }}
                className="w-full flex items-center gap-3 h-12 pl-4 rounded-lg transition-colors hover:bg-zinc-50"
              >
                <Key className="w-5 h-5 text-zinc-500" />
                <span className="text-zinc-500">{t("navigation.changePassword")}</span>
              </button>
              
              <button
                onClick={() => {
                  if (onLogout) {
                    onLogout();
                    onClose();
                  }
                }}
                className="w-full flex items-center gap-3 h-12 pl-4 rounded-lg transition-colors hover:bg-zinc-50"
              >
                <LogOut className="w-5 h-5 text-zinc-500" />
                <span className="text-zinc-500">{t("common.logout")}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                if (onLogin) {
                  handleNavigation(onLogin);
                }
              }}
              className="w-full flex items-center gap-3 h-12 pl-4 rounded-lg transition-colors hover:bg-zinc-50"
            >
              <LogIn className="w-5 h-5 text-zinc-500" />
              <span className="text-zinc-500">{t("common.login")}</span>
            </button>
          )}

          {isAuthenticated && (
            <>
              <button
                onClick={() => {
                  if (onNavigateToMyProfile) {
                    handleNavigation(onNavigateToMyProfile);
                  }
                }}
                className={`w-full flex items-center gap-3 h-12 pl-4 rounded-lg transition-colors ${
                  !cmsSection && onNavigateToMyProfile
                    ? 'bg-zinc-100'
                    : 'hover:bg-zinc-50'
                }`}
              >
                <CreditCard className={`w-5 h-5 ${!cmsSection && onNavigateToMyProfile ? 'text-neutral-950' : 'text-zinc-500'}`} />
                <span className={!cmsSection && onNavigateToMyProfile ? 'text-neutral-950' : 'text-zinc-500'}>{t("navigation.studio")}</span>
              </button>

              <button
                onClick={() => {
                  if (onNavigateToCMS) {
                    handleNavigation(() => onNavigateToCMS('home'));
                  }
                }}
                className={`w-full flex items-center gap-3 h-12 pl-4 rounded-lg transition-colors ${
                  cmsSection === 'home'
                    ? 'bg-zinc-100'
                    : 'hover:bg-zinc-50'
                }`}
              >
                <Home className={`w-5 h-5 ${cmsSection === 'home' ? 'text-neutral-950' : 'text-zinc-500'}`} />
                <span className={cmsSection === 'home' ? 'text-neutral-950' : 'text-zinc-500'}>{t("navigation.editHome")}</span>
              </button>

              <button
                onClick={() => {
                  if (onNavigateToCMS) {
                    handleNavigation(() => onNavigateToCMS('contact'));
                  }
                }}
                className={`w-full flex items-center gap-3 h-12 pl-4 rounded-lg transition-colors ${
                  cmsSection === 'contact'
                    ? 'bg-zinc-100'
                    : 'hover:bg-zinc-50'
                }`}
              >
                <Mail className={`w-5 h-5 ${cmsSection === 'contact' ? 'text-neutral-950' : 'text-zinc-500'}`} />
                <span className={cmsSection === 'contact' ? 'text-neutral-950' : 'text-zinc-500'}>{t("navigation.editContact")}</span>
              </button>

              <button
                onClick={() => {
                  if (onNavigateToCMS) {
                    handleNavigation(() => onNavigateToCMS('profile'));
                  }
                }}
                className={`w-full flex items-center gap-3 h-12 pl-4 rounded-lg transition-colors ${
                  cmsSection === 'profile'
                    ? 'bg-zinc-100'
                    : 'hover:bg-zinc-50'
                }`}
              >
                <User className={`w-5 h-5 ${cmsSection === 'profile' ? 'text-neutral-950' : 'text-zinc-500'}`} />
                <span className={cmsSection === 'profile' ? 'text-neutral-950' : 'text-zinc-500'}>{t("navigation.editProfile")}</span>
              </button>

              <button
                onClick={() => {
                  if (onNavigateToCMS) {
                    handleNavigation(() => onNavigateToCMS('portfolio'));
                  }
                }}
                className={`w-full flex items-center gap-3 h-12 pl-4 rounded-lg transition-colors ${
                  cmsSection === 'portfolio'
                    ? 'bg-zinc-100'
                    : 'hover:bg-zinc-50'
                }`}
              >
                <Briefcase className={`w-5 h-5 ${cmsSection === 'portfolio' ? 'text-neutral-950' : 'text-zinc-500'}`} />
                <span className={cmsSection === 'portfolio' ? 'text-neutral-950' : 'text-zinc-500'}>{t("navigation.editPortfolio")}</span>
              </button>

              <button
                onClick={() => {
                  if (onNavigateToCMS) {
                    handleNavigation(() => onNavigateToCMS('share'));
                  }
                }}
                className={`w-full flex items-center gap-3 h-12 pl-4 rounded-lg transition-colors ${
                  cmsSection === 'share'
                    ? 'bg-zinc-100'
                    : 'hover:bg-zinc-50'
                }`}
              >
                <Share2 className={`w-5 h-5 ${cmsSection === 'share' ? 'text-neutral-950' : 'text-zinc-500'}`} />
                <span className={cmsSection === 'share' ? 'text-neutral-950' : 'text-zinc-500'}>{t("navigation.shareContact")}</span>
              </button>

              <button
                onClick={() => {
                  if (onNavigateToCMS) {
                    handleNavigation(() => onNavigateToCMS('shareconfig'));
                  }
                }}
                className={`w-full flex items-center gap-3 h-12 pl-4 rounded-lg transition-colors ${
                  cmsSection === 'shareconfig'
                    ? 'bg-zinc-100'
                    : 'hover:bg-zinc-50'
                }`}
              >
                <Share2 className={`w-5 h-5 ${cmsSection === 'shareconfig' ? 'text-neutral-950' : 'text-zinc-500'}`} />
                <span className={cmsSection === 'shareconfig' ? 'text-neutral-950' : 'text-zinc-500'}>{t("navigation.shareConfig")}</span>
              </button>

              <button
                onClick={() => {
                  if (onNavigateToCMS) {
                    handleNavigation(() => onNavigateToCMS('analytics'));
                  }
                }}
                className={`w-full flex items-center gap-3 h-12 pl-4 rounded-lg transition-colors ${
                  cmsSection === 'analytics'
                    ? 'bg-zinc-100'
                    : 'hover:bg-zinc-50'
                }`}
              >
                <BarChart3 className={`w-5 h-5 ${cmsSection === 'analytics' ? 'text-neutral-950' : 'text-zinc-500'}`} />
                <span className={cmsSection === 'analytics' ? 'text-neutral-950' : 'text-zinc-500'}>{t("navigation.analytics")}</span>
              </button>

              <button
                onClick={() => {
                  toast.info("This feature will coming soon!");
                  onClose();
                }}
                className="w-full flex items-center gap-3 h-12 pl-4 rounded-lg transition-colors hover:bg-zinc-50"
              >
                <Sparkles className="w-5 h-5 text-zinc-500" />
                <span className="text-zinc-500">{t("navigation.editAssistant")}</span>
              </button>
            </>
          )}
        </div>
      </SheetContent>
      
      {/* Change Password Dialog */}
      <ChangePasswordDialog 
        open={showChangePasswordDialog} 
        onOpenChange={setShowChangePasswordDialog} 
      />
      
      {/* Upgrade Plan Dialog */}
      <UpgradePlanDialog
        open={showUpgradePlanDialog}
        onOpenChange={setShowUpgradePlanDialog}
        currentPlan={userPlan?.plan_name}
      />
    </Sheet>
  );
}