import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { usePublicBusinessCard } from "../../hooks/usePublicBusinessCard";
import { PortfolioSlider } from "./PortfolioSlider";
import { PortfolioList } from "./PortfolioList";
import { getUserCode } from "../../utils/user-code";

export function PortfolioListing() {
  const { userCode, groupCode } = useParams<{ userCode: string; groupCode?: string }>();
  const targetUserCode = userCode || getUserCode();
  
  const { data, isLoading, error } = usePublicBusinessCard(targetUserCode, groupCode);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // Hook must be called before any early returns
  useEffect(() => {
    if (data) {
      // If no category selected, select first
      if (!selectedCategoryId && data.portfolioCategories.length > 0) {
        setSelectedCategoryId(data.portfolioCategories[0].id);
      }
      // If selected category no longer exists (e.g. deleted in CMS), select first or null
      else if (selectedCategoryId && !data.portfolioCategories.find(c => c.id === selectedCategoryId)) {
        if (data.portfolioCategories.length > 0) {
          setSelectedCategoryId(data.portfolioCategories[0].id);
        } else {
          setSelectedCategoryId(null);
        }
      }
    }
  }, [data, selectedCategoryId]);

  // Early returns come AFTER all hooks
  if (isLoading || error || !data) return null;

  return (
    <div className="box-border content-stretch flex flex-col gap-[16px] items-start px-[24px] py-0 relative w-full">
      <div className="h-[56px] overflow-x-auto overflow-y-clip relative shrink-0 w-full" data-name="nav-menu-slider">
        <PortfolioSlider 
          categories={data.portfolioCategories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
      </div>
      <PortfolioList 
        portfolioItems={data.portfolio}
        selectedCategoryId={selectedCategoryId}
      />
    </div>
  );
}