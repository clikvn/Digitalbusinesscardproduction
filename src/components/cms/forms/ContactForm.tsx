import React from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form@7.55.0";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Separator } from "../../ui/separator";
import { BusinessCardData, messagingUrlPatterns, socialChannelUrlPatterns } from "../../../types/business-card";
import { Phone, Mail, MapPin, MessageCircle, Share2, Bot } from "lucide-react";
import { FieldVisibilityPopover } from "../FieldVisibilityPopover";
import { messagingExtractors, socialChannelExtractors } from "../../../utils/social-url-parser";

interface ContactFormProps {
  contact: BusinessCardData['contact'];
  messaging: BusinessCardData['socialMessaging'];
  channels: BusinessCardData['socialChannels'];
  onContactChange: (data: BusinessCardData['contact']) => void;
  onMessagingChange: (data: BusinessCardData['socialMessaging']) => void;
  onChannelsChange: (data: BusinessCardData['socialChannels']) => void;
  onFieldFocus?: (field: { label: string; value: string; onApply: (value: string) => void }) => void;
}

export function ContactForm({ 
  contact, 
  messaging, 
  channels, 
  onContactChange, 
  onMessagingChange, 
  onChannelsChange,
  onFieldFocus 
}: ContactFormProps) {
  const { t } = useTranslation();
  const contactForm = useForm({
    defaultValues: contact,
    values: contact,
  });

  const messagingForm = useForm({
    defaultValues: messaging,
    values: messaging,
  });

  const channelsForm = useForm({
    defaultValues: channels,
    values: channels,
  });

  // ✅ UPDATED: Work with plain values (no more nested objects)
  const handleContactChange = (field: keyof BusinessCardData['contact'], value: string) => {
    onContactChange({
      ...contact,
      [field]: value  // ✅ Just the value!
    });
  };

  // ✅ UPDATED: Work with plain values (no more nested objects)
  // Automatically extract username/ID from URLs if a URL is pasted
  const handleMessagingChange = (field: keyof BusinessCardData['socialMessaging'], value: string) => {
    // Extract username/ID from URL if it's a URL, otherwise use the value as-is
    const extractor = messagingExtractors[field];
    const username = extractor ? extractor(value) : value;
    
    onMessagingChange({
      ...messaging,
      [field]: username  // ✅ Just the username!
    });
  };

  // ✅ UPDATED: Work with plain values (no more nested objects)
  // Automatically extract username/ID from URLs if a URL is pasted
  const handleChannelsChange = (field: keyof BusinessCardData['socialChannels'], value: string) => {
    // Extract username/ID from URL if it's a URL, otherwise use the value as-is
    const extractor = socialChannelExtractors[field];
    const username = extractor ? extractor(value) : value;
    
    onChannelsChange({
      ...channels,
      [field]: username  // ✅ Just the username!
    });
  };

  const validatePhone = (value: string): string | true => {
    if (!value) return true;
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
      return t("forms.invalidPhoneNumber");
    }
    return true;
  };

  const validateEmail = (value: string): string | true => {
    if (!value) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return t("forms.invalidEmail");
    }
    return true;
  };

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Contact Details */}
      <Card className="border-[#e4e4e7] shadow-sm gap-3">
        <CardHeader className="px-4 md:px-6 md:pt-6 pb-[0px] pt-[12px] pr-[16px] pl-[16px]">
          <CardTitle className="text-lg">{t("forms.directContact")}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-5 md:pb-6 pt-0">
          <Form {...contactForm}>
            <div className="grid gap-4 md:gap-5">
              <div className="space-y-2">
                <FormLabel>{t("forms.phoneNumber")}</FormLabel>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
                    <Input
                      value={contact.phone}
                      onChange={(e) => handleContactChange('phone', e.target.value)}
                      onFocus={() => {
                        onFieldFocus?.({
                          label: t("forms.phoneNumber"),
                          value: contact.phone,
                          onApply: (value) => handleContactChange('phone', value)
                        });
                      }}
                      placeholder={t("forms.phonePlaceholder")}
                      className="pl-10 h-9"
                    />
                  </div>
                  <FieldVisibilityPopover fieldPath="contact.phone" />
                </div>
              </div>

              <div className="space-y-2">
                <FormLabel>{t("forms.emailAddress")}</FormLabel>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
                    <Input
                      value={contact.email}
                      onChange={(e) => handleContactChange('email', e.target.value)}
                      onFocus={() => {
                        onFieldFocus?.({
                          label: t("forms.emailAddress"),
                          value: contact.email,
                          onApply: (value) => handleContactChange('email', value)
                        });
                      }}
                      type="email"
                      placeholder={t("forms.emailPlaceholder")}
                      className="pl-10 h-9"
                    />
                  </div>
                  <FieldVisibilityPopover fieldPath="contact.email" />
                </div>
              </div>

              <div className="space-y-2">
                <FormLabel>{t("forms.physicalAddressOptional")}</FormLabel>
                <div className="flex gap-2 items-start">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-[#71717a]" />
                    <Textarea
                      value={contact.address}
                      onChange={(e) => handleContactChange('address', e.target.value)}
                      onFocus={() => {
                        onFieldFocus?.({
                          label: t("forms.physicalAddress"),
                          value: contact.address,
                          onApply: (value) => handleContactChange('address', value)
                        });
                      }}
                      placeholder={t("forms.addressPlaceholder")}
                      rows={3}
                      className="pl-10 resize-none overflow-hidden"
                    />
                  </div>
                  <FieldVisibilityPopover fieldPath="contact.address" buttonClassName="h-9 px-3 mt-0.5" />
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <FormLabel>{t("forms.aiAgentAssistant")}</FormLabel>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 flex items-center gap-3 p-3 rounded-md border border-[#e4e4e7] bg-[#fafafa] opacity-60 cursor-not-allowed">
                    <Bot className="w-5 h-5 text-[#71717a]" />
                    <div className="flex-1">
                      <p className="text-sm text-[#0a0a0a]">{t("forms.enableAIChatAssistant")}</p>
                      <p className="text-xs text-[#71717a] mt-0.5">{t("messages.comingSoon")}</p>
                    </div>
                  </div>
                  <div className="opacity-60 pointer-events-none">
                    <FieldVisibilityPopover fieldPath="contact.aiAgent" />
                  </div>
                </div>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Messaging & Social Grid */}
      <div className="grid gap-5 md:gap-6 lg:grid-cols-2">
        {/* Messaging Apps */}
        <Card className="border-[#e4e4e7] shadow-sm gap-3">
          <CardHeader className="px-4 md:px-6 md:pt-6 pb-[0px] pt-[12px] pr-[16px] pl-[16px]">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#0a0a0a]" />
              <CardTitle className="text-lg">{t("forms.messagingApps")}</CardTitle>
            </div>
            <p className="text-sm text-[#71717a] m-[0px] pt-2">
              {t("forms.enterUsernameId")}
            </p>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-5 md:pb-6 pt-0">
            <Form {...messagingForm}>
              <div className="grid gap-4">
                {/* Zalo */}
                <div className="space-y-2">
                  <FormLabel>{t("forms.zalo")}</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={messaging.zalo}
                      onChange={(e) => handleMessagingChange('zalo', e.target.value)}
                      placeholder={t("forms.phoneNumberPlaceholder")}
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialMessaging.zalo" />
                  </div>
                  <FormDescription className="text-xs">
                    {t("common.link")}:{' '}
                    {messaging.zalo ? (
                      <a
                        href={messagingUrlPatterns.zalo(messaging.zalo)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {messagingUrlPatterns.zalo(messaging.zalo)}
                      </a>
                    ) : (
                      <span className="text-[#71717a]">https://zalo.me/your-phone-number</span>
                    )}
                  </FormDescription>
                </div>

                {/* Messenger */}
                <div className="space-y-2">
                  <FormLabel>{t("forms.messenger")}</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={messaging.messenger}
                      onChange={(e) => handleMessagingChange('messenger', e.target.value)}
                      placeholder={t("forms.usernamePlaceholder")}
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialMessaging.messenger" />
                  </div>
                  <FormDescription className="text-xs">
                    {t("common.link")}:{' '}
                    {messaging.messenger ? (
                      <a
                        href={messagingUrlPatterns.messenger(messaging.messenger)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {messagingUrlPatterns.messenger(messaging.messenger)}
                      </a>
                    ) : (
                      <span className="text-[#71717a]">https://m.me/username</span>
                    )}
                  </FormDescription>
                </div>

                {/* Telegram */}
                <div className="space-y-2">
                  <FormLabel>{t("forms.telegram")}</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={messaging.telegram}
                      onChange={(e) => handleMessagingChange('telegram', e.target.value)}
                      placeholder={t("forms.usernamePlaceholder")}
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialMessaging.telegram" />
                  </div>
                  <FormDescription className="text-xs">
                    {t("common.link")}:{' '}
                    {messaging.telegram ? (
                      <a
                        href={messagingUrlPatterns.telegram(messaging.telegram)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {messagingUrlPatterns.telegram(messaging.telegram)}
                      </a>
                    ) : (
                      <span className="text-[#71717a]">https://t.me/username</span>
                    )}
                  </FormDescription>
                </div>

                {/* WhatsApp */}
                <div className="space-y-2">
                  <FormLabel>{t("forms.whatsapp")}</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={messaging.whatsapp}
                      onChange={(e) => handleMessagingChange('whatsapp', e.target.value)}
                      placeholder={t("forms.whatsappPlaceholder")}
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialMessaging.whatsapp" />
                  </div>
                  <FormDescription className="text-xs">
                    {t("common.link")}:{' '}
                    {messaging.whatsapp ? (
                      <a
                        href={messagingUrlPatterns.whatsapp(messaging.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {messagingUrlPatterns.whatsapp(messaging.whatsapp)}
                      </a>
                    ) : (
                      <span className="text-[#71717a]">https://wa.me/84123456789</span>
                    )}
                  </FormDescription>
                </div>

                {/* KakaoTalk */}
                <div className="space-y-2">
                  <FormLabel>{t("forms.kakaotalk")}</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={messaging.kakao}
                      onChange={(e) => handleMessagingChange('kakao', e.target.value)}
                      placeholder={t("forms.usernamePlaceholder")}
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialMessaging.kakao" />
                  </div>
                  <FormDescription className="text-xs">
                    {t("common.link")}:{' '}
                    {messaging.kakao ? (
                      <a
                        href={messagingUrlPatterns.kakao(messaging.kakao)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {messagingUrlPatterns.kakao(messaging.kakao)}
                      </a>
                    ) : (
                      <span className="text-[#71717a]">kakaotalk://conversations/username</span>
                    )}
                  </FormDescription>
                </div>

                {/* Discord */}
                <div className="space-y-2">
                  <FormLabel>{t("forms.discord")}</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={messaging.discord}
                      onChange={(e) => handleMessagingChange('discord', e.target.value)}
                      placeholder={t("forms.usernamePlaceholder")}
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialMessaging.discord" />
                  </div>
                  <FormDescription className="text-xs">
                    {t("common.link")}:{' '}
                    {messaging.discord ? (
                      <a
                        href={messagingUrlPatterns.discord(messaging.discord)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {messagingUrlPatterns.discord(messaging.discord)}
                      </a>
                    ) : (
                      <span className="text-[#71717a]">https://discord.com/users/username</span>
                    )}
                  </FormDescription>
                </div>

                {/* WeChat */}
                <div className="space-y-2">
                  <FormLabel>{t("forms.wechat")}</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={messaging.wechat}
                      onChange={(e) => handleMessagingChange('wechat', e.target.value)}
                      placeholder={t("forms.wechatPlaceholder")}
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialMessaging.wechat" />
                  </div>
                  <FormDescription className="text-xs">
                    {t("common.link")}:{' '}
                    {messaging.wechat ? (
                      <a
                        href={messagingUrlPatterns.wechat(messaging.wechat)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {messagingUrlPatterns.wechat(messaging.wechat)}
                      </a>
                    ) : (
                      <span className="text-[#71717a]">weixin://dl/chat?wechat-id</span>
                    )}
                  </FormDescription>
                </div>
              </div>
            </Form>
          </CardContent>
        </Card>

        {/* Social Channels */}
        <Card className="border-[#e4e4e7] shadow-sm gap-3">
          <CardHeader className="px-4 md:px-6 md:pt-6 pb-[0px] pt-[12px] pr-[16px] pl-[16px]">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#0a0a0a]" />
              <CardTitle className="text-lg">{t("forms.socialMedia")}</CardTitle>
            </div>
            <p className="text-sm text-[#71717a] m-[0px] pt-2">
              {t("forms.enterUsernameHandle")}
            </p>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-5 md:pb-6 pt-0">
            <Form {...channelsForm}>
              <div className="grid gap-4">
                {/* Facebook */}
                <div className="space-y-2">
                  <FormLabel>{t("forms.facebook")}</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={channels.facebook}
                      onChange={(e) => handleChannelsChange('facebook', e.target.value)}
                      placeholder={t("forms.facebookPlaceholder")}
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialChannels.facebook" />
                  </div>
                  <FormDescription className="text-xs">
                    {t("common.link")}:{' '}
                    {channels.facebook ? (
                      <a
                        href={socialChannelUrlPatterns.facebook(channels.facebook)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {socialChannelUrlPatterns.facebook(channels.facebook)}
                      </a>
                    ) : (
                      <span className="text-[#71717a]">https://facebook.com/yourpage</span>
                    )}
                  </FormDescription>
                </div>

                {/* LinkedIn */}
                <div className="space-y-2">
                  <FormLabel>{t("forms.linkedin")}</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={channels.linkedin}
                      onChange={(e) => handleChannelsChange('linkedin', e.target.value)}
                      placeholder={t("forms.usernamePlaceholder")}
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialChannels.linkedin" />
                  </div>
                  <FormDescription className="text-xs">
                    {t("common.link")}:{' '}
                    {channels.linkedin ? (
                      <a
                        href={socialChannelUrlPatterns.linkedin(channels.linkedin)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {socialChannelUrlPatterns.linkedin(channels.linkedin)}
                      </a>
                    ) : (
                      <span className="text-[#71717a]">https://linkedin.com/in/username</span>
                    )}
                  </FormDescription>
                </div>

                {/* Twitter */}
                <div className="space-y-2">
                  <FormLabel>{t("forms.twitter")}</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={channels.twitter}
                      onChange={(e) => handleChannelsChange('twitter', e.target.value)}
                      placeholder={t("forms.usernamePlaceholder")}
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialChannels.twitter" />
                  </div>
                  <FormDescription className="text-xs">
                    {t("common.link")}:{' '}
                    {channels.twitter ? (
                      <a
                        href={socialChannelUrlPatterns.twitter(channels.twitter)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {socialChannelUrlPatterns.twitter(channels.twitter)}
                      </a>
                    ) : (
                      <span className="text-[#71717a]">https://twitter.com/username</span>
                    )}
                  </FormDescription>
                </div>

                {/* YouTube */}
                <div className="space-y-2">
                  <FormLabel>{t("forms.youtube")}</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={channels.youtube}
                      onChange={(e) => handleChannelsChange('youtube', e.target.value)}
                      placeholder={t("forms.youtubePlaceholder")}
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialChannels.youtube" />
                  </div>
                  <FormDescription className="text-xs">
                    {t("common.link")}:{' '}
                    {channels.youtube ? (
                      <a
                        href={socialChannelUrlPatterns.youtube(channels.youtube)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {socialChannelUrlPatterns.youtube(channels.youtube)}
                      </a>
                    ) : (
                      <span className="text-[#71717a]">https://youtube.com/@channel</span>
                    )}
                  </FormDescription>
                </div>

                {/* TikTok */}
                <div className="space-y-2">
                  <FormLabel>{t("forms.tiktok")}</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={channels.tiktok}
                      onChange={(e) => handleChannelsChange('tiktok', e.target.value)}
                      placeholder={t("forms.usernamePlaceholder")}
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialChannels.tiktok" />
                  </div>
                  <FormDescription className="text-xs">
                    {t("common.link")}:{' '}
                    {channels.tiktok ? (
                      <a
                        href={socialChannelUrlPatterns.tiktok(channels.tiktok)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {socialChannelUrlPatterns.tiktok(channels.tiktok)}
                      </a>
                    ) : (
                      <span className="text-[#71717a]">https://tiktok.com/@username</span>
                    )}
                  </FormDescription>
                </div>
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
