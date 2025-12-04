import React from "react";
import { ContactHeaderWithBack } from "../contact/ContactHeaderWithBack";
import { Share } from "../contact/Share";

export function ContactScreen({ onBack, onMenuClick, onAIClick }: { onBack: () => void; onMenuClick: () => void; onAIClick?: () => void }) {
  return (
    <div className="bg-[#faf9f5] w-full overflow-auto" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <div className="w-full max-w-[500px] mx-auto">
        <div className="bg-[#faf9f5] content-stretch flex flex-col gap-[8px] items-start relative w-full" data-name="Contact">
          <ContactHeaderWithBack onBack={onBack} onMenuClick={onMenuClick} />
          <Share onAIClick={onAIClick} />
        </div>
      </div>
    </div>
  );
}
