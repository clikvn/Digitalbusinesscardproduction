import React from "react";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "../ui/breadcrumb";

interface CMSNavigationBarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  profileImage?: string;
  profileName?: string;
  onMenuClick: () => void;
  onAIClick?: () => void;
  onNavigateToStudio?: () => void;
  // If currentPage is "overview", we show "Business Card Studio" as current page
  // Otherwise we show breadcrumbs with Business Card Studio > [Section]
  currentPage: "overview" | "section";
}

const getPageLabel = (tab: string) => {
  switch (tab) {
    case "home": return "Home";
    case "contact": return "Contact";
    case "profile": return "Profile";
    case "portfolio": return "Portfolio";
    case "share": return "Share Contact";
    case "shareconfig": return "Share Configuration";
    case "analytics": return "Analytics";
    default: return tab;
  }
};

export function CMSNavigationBar({
  activeTab = "home",
  onTabChange,
  profileImage,
  profileName = "User",
  onMenuClick,
  onAIClick,
  onNavigateToStudio,
  currentPage,
}: CMSNavigationBarProps) {
  return (
    <div className="flex h-[46px] items-center justify-between px-4 md:px-8">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Back button (mobile only, shows on section pages) */}
        {currentPage === "section" && onNavigateToStudio && (
          <button 
            onClick={onNavigateToStudio}
            className="md:hidden shrink-0 size-[20px] flex items-center justify-center" 
            aria-label="Back to Studio"
          >
            <ArrowLeft className="size-5 text-[#3D3D3A]" strokeWidth={2} />
          </button>
        )}
        
        {/* Hamburger menu - mobile only (only show on overview page) */}
        {currentPage === "overview" && (
          <button 
            onClick={onMenuClick}
            className="shrink-0 size-[20px]" 
            aria-label="Menu"
          >
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
              <path d="M4 12H20" stroke="#3D3D3A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              <path d="M4 18H20" stroke="#3D3D3A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              <path d="M4 6H20" stroke="#3D3D3A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
        )}
        
        {/* Breadcrumbs - always show */}
        {currentPage === "overview" ? (
          // Show just "Business Card Studio" as current page
          <div className="text-sm text-[#0a0a0a] font-medium text-[16px]">
            Business Card Studio
          </div>
        ) : (
          // Show breadcrumbs with navigation
          <Breadcrumb>
            <BreadcrumbList className="text-base">
              <BreadcrumbItem>
                <BreadcrumbLink 
                  className="text-base text-[#71717a] hover:text-[#0a0a0a] cursor-pointer hidden md:block"
                  onClick={onNavigateToStudio}
                >
                  Studio
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-base text-[#0a0a0a] font-medium">
                  {getPageLabel(activeTab)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>
      
      {/* Center - desktop nav (only show when in section pages and tabs available) */}
      {currentPage === "section" && onTabChange && (
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => onTabChange("home")}
            className={`text-sm font-medium transition-colors hover:text-[#0a0a0a] ${
              activeTab === "home" ? "text-[#0a0a0a]" : "text-[#71717a]"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onTabChange("contact")}
            className={`text-sm font-medium transition-colors hover:text-[#0a0a0a] ${
              activeTab === "contact" ? "text-[#0a0a0a]" : "text-[#71717a]"
            }`}
          >
            Contact
          </button>
          <button
            onClick={() => onTabChange("profile")}
            className={`text-sm font-medium transition-colors hover:text-[#0a0a0a] ${
              activeTab === "profile" ? "text-[#0a0a0a]" : "text-[#71717a]"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => onTabChange("portfolio")}
            className={`text-sm font-medium transition-colors hover:text-[#0a0a0a] ${
              activeTab === "portfolio" ? "text-[#0a0a0a]" : "text-[#71717a]"
            }`}
          >
            Portfolio
          </button>
          <button
            onClick={() => onTabChange("share")}
            className={`text-sm font-medium transition-colors hover:text-[#0a0a0a] ${
              activeTab === "share" ? "text-[#0a0a0a]" : "text-[#71717a]"
            }`}
          >
            Share Contact
          </button>
          <button
            onClick={() => onTabChange("shareconfig")}
            className={`text-sm font-medium transition-colors hover:text-[#0a0a0a] ${
              activeTab === "shareconfig" ? "text-[#0a0a0a]" : "text-[#71717a]"
            }`}
          >
            Share Config
          </button>
          <button
            onClick={() => onTabChange("analytics")}
            className={`text-sm font-medium transition-colors hover:text-[#0a0a0a] ${
              activeTab === "analytics" ? "text-[#0a0a0a]" : "text-[#71717a]"
            }`}
          >
            Analytics
          </button>
        </nav>
      )}

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* AI icon - always show */}
        {onAIClick && (
          <button 
            onClick={onAIClick}
            className="shrink-0 size-[20px] flex items-center justify-center hover:opacity-70 transition-opacity" 
            aria-label="AI Agent"
          >
            <Sparkles className="w-5 h-5 text-[#3D3D3A]" />
          </button>
        )}
      </div>
    </div>
  );
}