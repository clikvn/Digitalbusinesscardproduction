import React from "react";
import { useParams } from "react-router-dom";
import { usePublicBusinessCard } from "../../hooks/usePublicBusinessCard";
import { ButtonMain } from "./ContactButtons";
import { Other } from "./SocialLinks";
import { getUserCode } from "../../utils/user-code";

export function CallToAction({ onAIClick }: { onAIClick?: () => void }) {
  const { userCode, groupCode } = useParams<{ userCode: string; groupCode?: string }>();
  const targetUserCode = userCode || getUserCode();
  
  const { data, isLoading, error } = usePublicBusinessCard(targetUserCode, groupCode);

  if (isLoading) return null; // Parent component (Share) handles loading
  if (error) {
    console.error('[CallToAction] Error loading data:', error);
    return null;
  }
  if (!data) return null;

  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full" data-name="call to action">
      <ButtonMain phone={data.contact.phone} email={data.contact.email} onAIClick={onAIClick} />
      <Other />
    </div>
  );
}
