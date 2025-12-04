import React from "react";
import { PortfolioItem } from "../../types/business-card";
import { PortfolioItemDisplay } from "./PortfolioItemDisplay";

export function PortfolioList({ 
  portfolioItems, 
  selectedCategoryId 
}: { 
  portfolioItems: PortfolioItem[]; 
  selectedCategoryId: string | null;
}) {
  // Filter items by selected category
  const filteredItems = selectedCategoryId 
    ? portfolioItems.filter(item => item.categoryId === selectedCategoryId)
    : portfolioItems;

  if (filteredItems.length === 0) {
    return (
      <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full py-12">
        <p className="text-zinc-500">No portfolio items in this category</p>
      </div>
    );
  }

  // Placeholder image for items without images
  const placeholderImage = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full pb-[16px] pt-[0px] pr-[0px] pl-[0px]" data-name="list">
      {filteredItems.map((item) => {
        // Determine the type for the UI component
        let displayType: 'image' | 'video' | 'virtual-tour' = 'image';
        let displayImages: string[] = [];
        
        if (item.type === 'images' && item.images && item.images.length > 0) {
          displayType = 'image';
          displayImages = item.images;
        } else if (item.type === 'video') {
          displayType = 'video';
          // Use first image as thumbnail or placeholder
          displayImages = item.images && item.images.length > 0 ? [item.images[0]] : [placeholderImage];
        } else if (item.type === 'virtual-tour') {
          displayType = 'virtual-tour';
          // Use first image as thumbnail or placeholder
          displayImages = item.images && item.images.length > 0 ? [item.images[0]] : [placeholderImage];
        }

        // Fallback to placeholder if no images
        if (displayImages.length === 0) {
          displayImages = [placeholderImage];
        }

        return (
          <PortfolioItemDisplay
            key={item.id}
            itemId={item.id}
            type={displayType}
            images={displayImages}
            title={item.title}
            details={item.description}
            videoUrl={item.videoUrl}
            tourUrl={item.tourUrl}
          />
        );
      })}
    </div>
  );
}
