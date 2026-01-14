import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner@2.0.3";
import { usePublicBusinessCard } from "../../hooks/usePublicBusinessCard";
import { useAnalyticsTracking } from "../../hooks/useAnalytics";
import { messagingUrlPatterns, socialChannelUrlPatterns } from "../../types/business-card";
import contactSvgPaths from "../../imports/svg-1txqd1yzsg";
import { getUserCode } from "../../utils/user-code";

export function Other() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="other">
      <Messaging />
      <Channels />
    </div>
  );
}

export function Messaging() {
  const { userCode, groupCode } = useParams<{ userCode: string; groupCode?: string }>();
  const targetUserCode = userCode || getUserCode();
  
  const { data, isLoading, error } = usePublicBusinessCard(targetUserCode, groupCode);

  if (isLoading || error || !data) return null;

  const messaging = data.socialMessaging;
  // ✅ Check plain string values (not .username)
  const hasVisibleApps = Object.values(messaging).some(username => username && username.trim() !== '');

  if (!hasVisibleApps) return null;

  return (
    <div className="box-border content-stretch flex flex-col gap-[16px] items-start px-0 py-[12px] relative shrink-0 w-full" data-name="messaging">
      <WidgetElementsTitle />
      <SocialMessaging />
    </div>
  );
}

export function WidgetElementsTitle() {
  const { t } = useTranslation();
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start justify-center relative shrink-0 w-full" data-name="widget-elements-title">
      <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="title">
        <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#535146] text-[18px] text-nowrap">
          <p className="leading-[28px] whitespace-pre">{t("common.socialMessaging")}</p>
        </div>
      </div>
    </div>
  );
}

export function SocialMessaging() {
  const { userCode, groupCode } = useParams<{ userCode: string; groupCode?: string }>();
  const targetUserCode = userCode || getUserCode();
  
  const { data, isLoading, error } = usePublicBusinessCard(targetUserCode, groupCode);

  if (isLoading || error || !data) return null;

  const messaging = data.socialMessaging;
  // ✅ Access plain string values directly
  const visibleApps = [
    { key: 'zalo', icon: 'zalo', label: 'Zalo', svgPath: contactSvgPaths.p3c0f7800, url: messagingUrlPatterns.zalo(messaging.zalo), username: messaging.zalo },
    { key: 'messenger', icon: 'messenger', label: 'Messenger', svgPath: contactSvgPaths.p28c7e780, url: messagingUrlPatterns.messenger(messaging.messenger), username: messaging.messenger },
    { key: 'telegram', icon: 'telegram', label: 'Telegram', svgPath: contactSvgPaths.p17afbb00, url: messagingUrlPatterns.telegram(messaging.telegram), username: messaging.telegram },
    { key: 'whatsapp', icon: 'whatsapp', label: 'Whatsapp', svgPath: contactSvgPaths.p1d96e40, url: messagingUrlPatterns.whatsapp(messaging.whatsapp), username: messaging.whatsapp },
    { key: 'kakao', icon: 'kakao', label: 'Kakao', svgPath: contactSvgPaths.p1b2b5d00, url: messagingUrlPatterns.kakao(messaging.kakao), username: messaging.kakao },
    { key: 'discord', icon: 'discord', label: 'Discord', svgPath: contactSvgPaths.p2dbd7c00, url: messagingUrlPatterns.discord(messaging.discord), username: messaging.discord },
    { key: 'wechat', icon: 'wechat', label: 'Wechat', svgPath: contactSvgPaths.p13598400, url: messagingUrlPatterns.wechat(messaging.wechat), username: messaging.wechat },
  ].filter(app => app.username && app.username.trim() !== '');

  if (visibleApps.length === 0) return null;

  return (
    <div className="grid grid-cols-4 gap-[16px] w-full" data-name="connect">
      {visibleApps.map(app => (
        <SocialButton key={app.key} icon={app.icon} label={app.label} svgPath={app.svgPath} url={app.url} target={`socialMessaging.${app.key}` as any} />
      ))}
    </div>
  );
}

export function SocialButton({ icon, label, svgPath, url, target }: { icon: string; label: string; svgPath?: string; url?: string; target?: string }) {
  const { userCode, groupCode } = useParams<{ userCode: string; groupCode?: string }>();
  const { trackClickEvent } = useAnalyticsTracking(userCode || '', groupCode || '', undefined);
  
  return (
    <button 
      onClick={() => {
        if (target) {
          trackClickEvent(target as any);
        }
        if (url) {
          window.location.href = url;
        } else {
          toast.info(`Opening ${label}`);
        }
      }}
      className="content-stretch flex flex-col gap-[4px] items-center justify-center relative rounded-[12px] shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95" 
      data-name="Button-Text-Icon-Vertical"
    >
      <div className="backdrop-blur-lg backdrop-filter bg-[#e9e6dc] box-border content-stretch flex gap-[8px] items-center justify-center p-[12px] relative rounded-[100px] shrink-0" data-name="Button-Text-Icon-Horizontal">
        <div className="overflow-clip relative shrink-0 size-[24px]" data-name={`social / ${icon}`}>
          {svgPath && (
            <div className="absolute inset-[8.33%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                <path d={svgPath} fill="var(--fill-0, #535146)" />
              </svg>
            </div>
          )}
        </div>
      </div>
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#535146] text-[12px] text-nowrap whitespace-pre">{label}</p>
    </button>
  );
}

export function Channels() {
  const { userCode, groupCode } = useParams<{ userCode: string; groupCode?: string }>();
  const targetUserCode = userCode || getUserCode();
  
  const { data, isLoading, error } = usePublicBusinessCard(targetUserCode, groupCode);

  if (isLoading || error || !data) return null;

  const channels = data.socialChannels;
  // ✅ Check plain string values (not .username)
  const hasVisibleChannels = Object.values(channels).some(username => username && username.trim() !== '');

  if (!hasVisibleChannels) return null;

  return (
    <div className="box-border content-stretch flex flex-col gap-[16px] items-start px-0 py-[12px] relative shrink-0 w-full" data-name="channels">
      <WidgetElementsTitleChannels />
      <SocialChannels />
    </div>
  );
}

export function WidgetElementsTitleChannels() {
  const { t } = useTranslation();
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start justify-center relative shrink-0 w-full" data-name="widget-elements-title">
      <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="title">
        <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#535146] text-[18px] text-nowrap">
          <p className="leading-[28px] whitespace-pre">{t("common.socialChannels")}</p>
        </div>
      </div>
    </div>
  );
}

export function SocialChannels() {
  const { userCode, groupCode } = useParams<{ userCode: string; groupCode?: string }>();
  const targetUserCode = userCode || getUserCode();
  
  const { data, isLoading, error } = usePublicBusinessCard(targetUserCode, groupCode);

  if (isLoading || error || !data) return null;

  const channels = data.socialChannels;
  // ✅ Access plain string values directly
  const visibleChannels = [
    { key: 'facebook', icon: 'facebook', label: 'Facebook', svgPath: contactSvgPaths.pbab2f00, url: socialChannelUrlPatterns.facebook(channels.facebook), username: channels.facebook },
    { key: 'linkedin', icon: 'linkedin', label: 'Linkedin', svgPath: contactSvgPaths.p3dcb5200, url: socialChannelUrlPatterns.linkedin(channels.linkedin), username: channels.linkedin },
    { key: 'twitter', icon: 'twitter', label: 'Twitter', svgPath: contactSvgPaths.pc49a000, url: socialChannelUrlPatterns.twitter(channels.twitter), username: channels.twitter },
    { key: 'youtube', icon: 'youtube', label: 'Youtube', svgPath: contactSvgPaths.p39d046f0, url: socialChannelUrlPatterns.youtube(channels.youtube), username: channels.youtube },
    { key: 'tiktok', icon: 'tiktok', label: 'Tiktok', svgPath: contactSvgPaths.p15734100, url: socialChannelUrlPatterns.tiktok(channels.tiktok), username: channels.tiktok },
  ].filter(channel => channel.username && channel.username.trim() !== '');

  if (visibleChannels.length === 0) return null;

  return (
    <div className="grid grid-cols-4 gap-[16px] w-full" data-name="connect">
      {visibleChannels.map(channel => (
        <SocialButton key={channel.key} icon={channel.icon} label={channel.label} svgPath={channel.svgPath} url={channel.url} target={`socialChannels.${channel.key}` as any} />
      ))}
    </div>
  );
}
