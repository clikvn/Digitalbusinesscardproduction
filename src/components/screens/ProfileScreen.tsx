import React from "react";
import { ProfileHeaderWithBack } from "../profile/ProfileHeaderWithBack";
import { ProfileCredentials } from "../profile/ProfileCredentials";

export function ProfileScreen({ onBack, onMenuClick }: { onBack: () => void; onMenuClick: () => void }) {
  return (
    <div className="bg-[#faf9f5] w-full overflow-auto" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <div className="w-full max-w-[500px] mx-auto">
        <div className="bg-[#faf9f5] content-stretch flex flex-col items-start relative w-full" data-name="Profile">
          <ProfileHeaderWithBack onBack={onBack} onMenuClick={onMenuClick} />
          <ProfileCredentials />
        </div>
      </div>
    </div>
  );
}
