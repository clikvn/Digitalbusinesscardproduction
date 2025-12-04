import React from "react";
import { HomeProfileCard } from "./HomeProfileCard";

export function Gradient({ onNavigateToContact, onNavigateToProfile, onNavigateToPortfolio }: { 
  onNavigateToContact: () => void; 
  onNavigateToProfile: () => void;
  onNavigateToPortfolio: () => void;
}) {
  return (
    <div className="absolute inset-0 flex items-end justify-center" data-name="Gradient">
      <div className="w-full max-w-[500px] px-[16px]">
        <HomeProfileCard 
          onNavigateToContact={onNavigateToContact} 
          onNavigateToProfile={onNavigateToProfile}
          onNavigateToPortfolio={onNavigateToPortfolio}
        />
      </div>
    </div>
  );
}
