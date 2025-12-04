import React from "react";
import { useParams } from "react-router-dom";
import { usePublicBusinessCard } from "../../hooks/usePublicBusinessCard";
import { getUserCode } from "../../utils/user-code";
import { MarkdownText } from "../common/MarkdownText";

export function ProfileCredentials() {
  const { userCode, groupCode } = useParams<{ userCode: string; groupCode?: string }>();
  const targetUserCode = userCode || getUserCode();
  
  const { data, isLoading, error } = usePublicBusinessCard(targetUserCode, groupCode);

  if (isLoading || error || !data) return null;

  // Split name for display (first name on first line, last name on second)
  const nameParts = data.personal.name.split(' ');
  const firstName = nameParts.slice(0, -1).join(' ') || data.personal.name;
  const lastName = nameParts[nameParts.length - 1];

  return (
    <div className="box-border content-stretch flex flex-col gap-[8px] items-center pb-[16px] pt-[0px] px-[24px] relative shrink-0 w-full pr-[24px] pl-[24px]" data-name="credentials">
      <div className="content-stretch flex flex-col gap-[16px] items-start justify-center relative shrink-0 w-full" data-name="widget-elements-title">
        <div className="box-border content-stretch flex gap-[8px] items-start px-0 relative shrink-0 w-full py-[8px] pt-[8px] pr-[0px] pb-[0px] pl-[0px]" data-name="title">
          <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[36px] not-italic relative shrink-0 text-[#535146] text-[30px] text-nowrap tracking-[-0.225px] whitespace-pre">
            {nameParts.length > 1 ? (
              <>
                <p className="mb-0">{firstName}</p>
                <p>{lastName}</p>
              </>
            ) : (
              <p>{data.personal.name}</p>
            )}
          </div>
        </div>
      </div>
      <div className="box-border content-stretch flex flex-col gap-[4px] items-start pb-[8px] pt-0 px-0 relative shrink-0 w-full" data-name="widget-elements-title">
        <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="title">
          <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#535146] text-[18px] text-nowrap">
            <p className="leading-[28px] whitespace-pre">{data.personal.title}</p>
          </div>
        </div>
      </div>
      {/* ✅ FIXED: Access plain string directly, not .value */}
      {data.profile.about && data.profile.about.trim() !== '' && (
        <div className="box-border content-stretch flex flex-col gap-[4px] items-start px-0 py-[8px] relative shrink-0 w-full" data-name="widget-elements-title">
          <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="title">
            <div className="flex flex-col font-['Be_Vietnam_Pro:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#535146] text-[16px] text-nowrap">
              <p className="leading-[24px] whitespace-pre">{(data.customLabels?.['profile.about'] || 'ABOUT').toUpperCase()}</p>
            </div>
          </div>
          <div className="flex flex-col font-['Be_Vietnam_Pro:Medium',sans-serif] justify-center leading-[20px] not-italic relative shrink-0 text-[#83827d] text-[14px] w-full">
            <MarkdownText>{data.profile.about}</MarkdownText>
          </div>
        </div>
      )}
      {/* ✅ FIXED: Access plain string directly, not .value */}
      {data.profile.serviceAreas && data.profile.serviceAreas.trim() !== '' && (
        <div className="box-border content-stretch flex flex-col gap-[4px] items-start px-0 py-[8px] relative shrink-0 w-full" data-name="widget-elements-title">
          <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="title">
            <div className="flex flex-col font-['Be_Vietnam_Pro:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#535146] text-[16px] text-nowrap">
              <p className="leading-[24px] whitespace-pre">{(data.customLabels?.['profile.serviceAreas'] || 'SERVICE AREAS').toUpperCase()}</p>
            </div>
          </div>
          <div className="flex flex-col font-['Be_Vietnam_Pro:Medium',sans-serif] justify-center leading-[20px] not-italic relative shrink-0 text-[#83827d] text-[14px] w-full">
            <MarkdownText>{data.profile.serviceAreas}</MarkdownText>
          </div>
        </div>
      )}
      {/* ✅ FIXED: Access plain string directly, not .value */}
      {data.profile.specialties && data.profile.specialties.trim() !== '' && (
        <div className="box-border content-stretch flex flex-col gap-[4px] items-start px-0 py-[8px] relative shrink-0 w-full" data-name="widget-elements-title">
          <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="title">
            <div className="flex flex-col font-['Be_Vietnam_Pro:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#535146] text-[16px] text-nowrap">
              <p className="leading-[24px] whitespace-pre">{(data.customLabels?.['profile.specialties'] || 'SPECIALTIES').toUpperCase()}</p>
            </div>
          </div>
          <div className="flex flex-col font-['Be_Vietnam_Pro:Medium',sans-serif] justify-center leading-[20px] not-italic relative shrink-0 text-[#83827d] text-[14px] w-full">
            <MarkdownText>{data.profile.specialties}</MarkdownText>
          </div>
        </div>
      )}
      {/* ✅ FIXED: Access plain string directly, not .value */}
      {data.profile.experience && data.profile.experience.trim() !== '' && (
        <div className="box-border content-stretch flex flex-col gap-[4px] items-start px-0 py-[8px] relative shrink-0 w-full" data-name="widget-elements-title">
          <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="title">
            <div className="flex flex-col font-['Be_Vietnam_Pro:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#535146] text-[16px] text-nowrap">
              <p className="leading-[24px] whitespace-pre">{(data.customLabels?.['profile.experience'] || 'EXPERIENCE').toUpperCase()}</p>
            </div>
          </div>
          <div className="flex flex-col font-['Be_Vietnam_Pro:Medium',sans-serif] justify-center leading-[20px] not-italic relative shrink-0 text-[#83827d] text-[14px] w-full">
            <MarkdownText>{data.profile.experience}</MarkdownText>
          </div>
        </div>
      )}
      {/* ✅ FIXED: Access plain string directly, not .value */}
      {data.profile.languages && data.profile.languages.trim() !== '' && (
        <div className="box-border content-stretch flex flex-col gap-[4px] items-start px-0 py-[8px] relative shrink-0 w-full" data-name="widget-elements-title">
          <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="title">
            <div className="flex flex-col font-['Be_Vietnam_Pro:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#535146] text-[16px] text-nowrap">
              <p className="leading-[24px] whitespace-pre">{(data.customLabels?.['profile.languages'] || 'LANGUAGES').toUpperCase()}</p>
            </div>
          </div>
          <div className="flex flex-col font-['Be_Vietnam_Pro:Medium',sans-serif] justify-center leading-[20px] not-italic relative shrink-0 text-[#83827d] text-[14px] w-full">
            <MarkdownText>{data.profile.languages}</MarkdownText>
          </div>
        </div>
      )}
      {/* ✅ FIXED: Access plain string directly, not .value */}
      {data.profile.certifications && data.profile.certifications.trim() !== '' && (
        <div className="box-border content-stretch flex flex-col gap-[4px] items-start px-0 py-[8px] relative shrink-0 w-full" data-name="widget-elements-title">
          <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="title">
            <div className="flex flex-col font-['Be_Vietnam_Pro:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#535146] text-[16px] text-nowrap">
              <p className="leading-[24px] whitespace-pre">{(data.customLabels?.['profile.certifications'] || 'CERTIFICATIONS').toUpperCase()}</p>
            </div>
          </div>
          <div className="flex flex-col font-['Be_Vietnam_Pro:Medium',sans-serif] justify-center leading-[20px] not-italic relative shrink-0 text-[#83827d] text-[14px] w-full">
            <MarkdownText>{data.profile.certifications}</MarkdownText>
          </div>
        </div>
      )}
    </div>
  );
}