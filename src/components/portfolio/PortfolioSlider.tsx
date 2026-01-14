import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PortfolioCategory } from "../../types/business-card";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PortfolioSlider({ 
  categories, 
  selectedCategoryId, 
  onSelectCategory 
}: { 
  categories: PortfolioCategory[]; 
  selectedCategoryId: string | null; 
  onSelectCategory: (id: string) => void;
}) {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      window.addEventListener('resize', updateScrollButtons);
      return () => {
        container.removeEventListener('scroll', updateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
      };
    }
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const targetScroll = direction === 'left'
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  if (categories.length === 0) {
    return (
      <div className="absolute content-stretch flex gap-[8px] inset-0 items-center justify-center" data-name="slider">
        <div className="text-zinc-500">{t("public.noCategoriesAvailable")}</div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center gap-2" data-name="slider">
      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="shrink-0 w-8 h-8 flex items-center justify-center bg-white/80 hover:bg-white border border-zinc-200 rounded-full shadow-sm transition-colors z-10"
          aria-label={t("public.scrollLeft")}
        >
          <ChevronLeft className="w-5 h-5 text-[#535146]" />
        </button>
      )}
      
      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        onScroll={updateScrollButtons}
        className="flex-1 flex gap-[8px] items-center overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category) => (
          <PortfolioCategoryItem 
            key={category.id}
            name={category.name}
            isActive={selectedCategoryId === category.id}
            onClick={() => onSelectCategory(category.id)}
          />
        ))}
      </div>

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="shrink-0 w-8 h-8 flex items-center justify-center bg-white/80 hover:bg-white border border-zinc-200 rounded-full shadow-sm transition-colors z-10"
          aria-label={t("public.scrollRight")}
        >
          <ChevronRight className="w-5 h-5 text-[#535146]" />
        </button>
      )}
    </div>
  );
}

function PortfolioCategoryItem({ name, isActive, onClick }: { name: string; isActive: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col h-full items-center justify-center min-w-fit relative shrink-0" 
      data-name="category"
    >
      <div className="box-border flex gap-[8px] items-center justify-center overflow-clip relative rounded-[12px] shrink-0 px-[12px] py-[8px] whitespace-nowrap" data-name="Button-Text">
        <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#535146] text-[16px] text-center">
          <p className="leading-[24px]">{name}</p>
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
