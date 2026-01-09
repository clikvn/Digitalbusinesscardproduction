import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Home, Mail, FileText, Briefcase, Sparkles, ArrowRight, Share2, Users } from "lucide-react";
import { BarChart3 } from "lucide-react";
import { CMSNavigationBar } from "./CMSNavigationBar";
import { toast } from "sonner@2.0.3";
import { useBusinessManagement } from "../../hooks/useBusinessManagement";

interface BusinessCardStudioProps {
  onNavigateToSection: (section: string) => void;
  onNavigateHome?: () => void;
  onMenuClick?: () => void;
  onAIClick?: () => void;
  profileImage?: string;
  profileName?: string;
}

export function BusinessCardStudio({ onNavigateToSection, onNavigateHome, onMenuClick, onAIClick, profileImage, profileName }: BusinessCardStudioProps) {
  const { isBusinessOwner } = useBusinessManagement();

  const cards = [
    // My Business card for business owners - at the top
    ...(isBusinessOwner ? [{
      id: "employees",
      title: "My Business",
      description: "Manage your team's digital business cards and permissions",
      icon: Users,
      color: "bg-gradient-to-br from-indigo-500/10 to-indigo-500/5",
      iconColor: "text-indigo-600",
    }] : []),
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
                onAIClick={() => {
                  if (onAIClick) {
                    onAIClick();
                  } else if ((window as any).__openAIAssistant) {
                    (window as any).__openAIAssistant();
                  }
                }}
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
                    onClick={() => {
                      if (card.id === 'ai-assistant') {
                        // Show coming soon message
                        toast.info("This feature will coming soon!");
                      } else {
                        onNavigateToSection(card.id);
                      }
                    }}
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

      </div>
    </div>
  );
}