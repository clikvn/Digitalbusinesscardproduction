import React from "react";
import { PortfolioCategory } from "../../types/business-card";

export function PortfolioSlider({ 
  categories, 
  selectedCategoryId, 
  onSelectCategory 
}: { 
  categories: PortfolioCategory[]; 
  selectedCategoryId: string | null; 
  onSelectCategory: (id: string) => void;
}) {
  if (categories.length === 0) {
    return (
      <div className="absolute content-stretch flex gap-[8px] inset-0 items-center justify-center" data-name="slider">
        <div className="text-zinc-500">No categories available</div>
      </div>
    );
  }

  return (
    <div className="absolute content-stretch flex gap-[8px] inset-0 items-center" data-name="slider">
      {categories.map((category) => (
        <PortfolioCategoryItem 
          key={category.id}
          name={category.name}
          isActive={selectedCategoryId === category.id}
          onClick={() => onSelectCategory(category.id)}
        />
      ))}
    </div>
  );
}

function PortfolioCategoryItem({ name, isActive, onClick }: { name: string; isActive: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="basis-0 content-stretch flex flex-col grow h-full items-center justify-center min-h-px min-w-px relative shrink-0" 
      data-name="category"
    >
      <div className="basis-0 box-border content-stretch flex gap-[8px] grow items-center justify-center min-h-px min-w-px overflow-clip relative rounded-[12px] shrink-0 px-[12px] py-[8px]" data-name="Button-Text">
        <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#535146] text-[18px] text-center text-nowrap">
          <p className="leading-[28px] whitespace-pre">{name}</p>
        </div>
      </div>
      {isActive ? <PortfolioActive /> : <PortfolioActiveInactive />}
    </button>
  );
}

function PortfolioActive() {
  return (
    <div className="bg-[#535146] h-[4px] relative rounded-[100px] shrink-0 w-full" data-name="active">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="h-[4px] w-full" />
      </div>
    </div>
  );
}

function PortfolioActiveInactive() {
  return (
    <div className="h-[4px] relative rounded-[100px] shrink-0 w-full" data-name="active">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="h-[4px] w-full" />
      </div>
    </div>
  );
}
