import React from "react";
import { ArrowLeft } from "lucide-react";
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
  isBusinessOwner?: boolean;
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
    case "employees": return "My Business";
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
  isBusinessOwner = false,
}: CMSNavigationBarProps) {
  return (
    <div className="flex h-[46px] items-center px-4 md:px-8 overflow-hidden relative">
      {/* Left side */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Back button (shows on section pages) */}
        {currentPage === "section" && onNavigateToStudio && (
          <button 
            onClick={onNavigateToStudio}
            className="shrink-0 size-[20px] flex items-center justify-center" 
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
        
        {/* Breadcrumbs - show logic based on nav visibility */}
        {currentPage === "overview" ? (
          // Show just "Business Card Studio" as current page
          <div className="text-sm text-[#0a0a0a] font-medium text-[16px]">
            Business Card Studio
          </div>
        ) : (
          // Show breadcrumbs - simplified when center nav is visible (desktop)
          <Breadcrumb>
            <BreadcrumbList className="text-base">
              <BreadcrumbItem>
                <BreadcrumbLink 
                  className="text-base text-[#71717a] hover:text-[#0a0a0a] cursor-pointer"
                  onClick={onNavigateToStudio}
                >
                  Studio
                </BreadcrumbLink>
              </BreadcrumbItem>
              {/* Only show current page in breadcrumb when center nav is hidden (mobile) */}
              {/* On desktop, the current page is highlighted in the center nav instead */}
              <BreadcrumbSeparator className="md:hidden" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-base text-[#0a0a0a] font-medium md:hidden">
                  {getPageLabel(activeTab)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>
      
      {/* Center - desktop nav (only show when in section pages and tabs available) */}
      {/* When visible, this replaces the current page in breadcrumb */}
      {currentPage === "section" && onTabChange && (
        <nav className="hidden md:flex items-center gap-0 flex-shrink-0 overflow-x-auto scrollbar-hide absolute left-1/2 -translate-x-1/2">
          {isBusinessOwner && (
            <button
              onClick={() => onTabChange("employees")}
              className={`text-sm font-medium transition-all whitespace-nowrap px-3 py-1.5 rounded-md ${
                activeTab === "employees" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-[#71717a] hover:text-[#0a0a0a] hover:bg-accent"
              }`}
            >
              My Business
            </button>
          )}
          <button
            onClick={() => onTabChange("home")}
            className={`text-sm font-medium transition-all whitespace-nowrap px-3 py-1.5 rounded-md ${
              activeTab === "home" 
                ? "bg-primary text-primary-foreground" 
                : "text-[#71717a] hover:text-[#0a0a0a] hover:bg-accent"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onTabChange("contact")}
            className={`text-sm font-medium transition-all whitespace-nowrap px-3 py-1.5 rounded-md ${
              activeTab === "contact" 
                ? "bg-primary text-primary-foreground" 
                : "text-[#71717a] hover:text-[#0a0a0a] hover:bg-accent"
            }`}
          >
            Contact
          </button>
          <button
            onClick={() => onTabChange("profile")}
            className={`text-sm font-medium transition-all whitespace-nowrap px-3 py-1.5 rounded-md ${
              activeTab === "profile" 
                ? "bg-primary text-primary-foreground" 
                : "text-[#71717a] hover:text-[#0a0a0a] hover:bg-accent"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => onTabChange("portfolio")}
            className={`text-sm font-medium transition-all whitespace-nowrap px-3 py-1.5 rounded-md ${
              activeTab === "portfolio" 
                ? "bg-primary text-primary-foreground" 
                : "text-[#71717a] hover:text-[#0a0a0a] hover:bg-accent"
            }`}
          >
            Portfolio
          </button>
          <button
            onClick={() => onTabChange("share")}
            className={`text-sm font-medium transition-all whitespace-nowrap px-3 py-1.5 rounded-md ${
              activeTab === "share" 
                ? "bg-primary text-primary-foreground" 
                : "text-[#71717a] hover:text-[#0a0a0a] hover:bg-accent"
            }`}
          >
            Share Contact
          </button>
          <button
            onClick={() => onTabChange("shareconfig")}
            className={`text-sm font-medium transition-all whitespace-nowrap px-3 py-1.5 rounded-md ${
              activeTab === "shareconfig" 
                ? "bg-primary text-primary-foreground" 
                : "text-[#71717a] hover:text-[#0a0a0a] hover:bg-accent"
            }`}
          >
            Share Config
          </button>
          <button
            onClick={() => onTabChange("analytics")}
            className={`text-sm font-medium transition-all whitespace-nowrap px-3 py-1.5 rounded-md ${
              activeTab === "analytics" 
                ? "bg-primary text-primary-foreground" 
                : "text-[#71717a] hover:text-[#0a0a0a] hover:bg-accent"
            }`}
          >
            Analytics
          </button>
        </nav>
      )}

      {/* Right side - removed AI button */}
    </div>
  );
}