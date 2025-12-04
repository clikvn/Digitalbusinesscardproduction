import React from "react";
import { useForm } from "react-hook-form@7.55.0";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Separator } from "../../ui/separator";
import { BusinessCardData } from "../../../types/business-card";
import { Phone, Mail, MapPin, MessageCircle, Share2, Bot } from "lucide-react";
import { FieldVisibilityPopover } from "../FieldVisibilityPopover";

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
  const handleMessagingChange = (field: keyof BusinessCardData['socialMessaging'], username: string) => {
    onMessagingChange({
      ...messaging,
      [field]: username  // ✅ Just the username!
    });
  };

  // ✅ UPDATED: Work with plain values (no more nested objects)
  const handleChannelsChange = (field: keyof BusinessCardData['socialChannels'], username: string) => {
    onChannelsChange({
      ...channels,
      [field]: username  // ✅ Just the username!
    });
  };

  const validatePhone = (value: string): string | true => {
    if (!value) return true;
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
      return "Please enter a valid phone number (e.g., +84 123 456 789)";
    }
    return true;
  };

  const validateEmail = (value: string): string | true => {
    if (!value) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
    return true;
  };

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Contact Details */}
      <Card className="border-[#e4e4e7] shadow-sm gap-3">
        <CardHeader className="px-4 md:px-6 md:pt-6 pb-[0px] pt-[12px] pr-[16px] pl-[16px]">
          <CardTitle className="text-lg">Direct Contact</CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-5 md:pb-6 pt-0">
          <Form {...contactForm}>
            <div className="grid gap-4 md:gap-5">
              <div className="space-y-2">
                <FormLabel>Phone Number</FormLabel>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
                    <Input
                      value={contact.phone}
                      onChange={(e) => handleContactChange('phone', e.target.value)}
                      onFocus={() => {
                        onFieldFocus?.({
                          label: 'Phone Number',
                          value: contact.phone,
                          onApply: (value) => handleContactChange('phone', value)
                        });
                      }}
                      placeholder="+84 123 456 789"
                      className="pl-10 h-9"
                    />
                  </div>
                  <FieldVisibilityPopover fieldPath="contact.phone" />
                </div>
              </div>

              <div className="space-y-2">
                <FormLabel>Email Address</FormLabel>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
                    <Input
                      value={contact.email}
                      onChange={(e) => handleContactChange('email', e.target.value)}
                      onFocus={() => {
                        onFieldFocus?.({
                          label: 'Email Address',
                          value: contact.email,
                          onApply: (value) => handleContactChange('email', value)
                        });
                      }}
                      type="email"
                      placeholder="your.email@example.com"
                      className="pl-10 h-9"
                    />
                  </div>
                  <FieldVisibilityPopover fieldPath="contact.email" />
                </div>
              </div>

              <div className="space-y-2">
                <FormLabel>Physical Address (Optional)</FormLabel>
                <div className="flex gap-2 items-start">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-[#71717a]" />
                    <Textarea
                      value={contact.address}
                      onChange={(e) => handleContactChange('address', e.target.value)}
                      onFocus={() => {
                        onFieldFocus?.({
                          label: 'Physical Address',
                          value: contact.address,
                          onApply: (value) => handleContactChange('address', value)
                        });
                      }}
                      placeholder="123 Design Street, District 1, Ho Chi Minh City"
                      rows={3}
                      className="pl-10 resize-none overflow-hidden"
                    />
                  </div>
                  <FieldVisibilityPopover fieldPath="contact.address" buttonClassName="h-9 px-3 mt-0.5" />
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <FormLabel>AI Agent Assistant</FormLabel>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 flex items-center gap-3 p-3 rounded-md border border-[#e4e4e7] bg-[#fafafa]">
                    <Bot className="w-5 h-5 text-[#71717a]" />
                    <div className="flex-1">
                      <p className="text-sm text-[#0a0a0a]">Enable AI chat assistant button</p>
                      <p className="text-xs text-[#71717a] mt-0.5">Allows visitors to chat with your AI assistant on the contact page</p>
                    </div>
                  </div>
                  <FieldVisibilityPopover fieldPath="contact.aiAgent" />
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
              <CardTitle className="text-lg">Messaging Apps</CardTitle>
            </div>
            <p className="text-sm text-[#71717a] m-[0px] pt-2">
              Enter just your username/ID. Select visibility groups to control who sees each app.
            </p>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-5 md:pb-6 pt-0">
            <Form {...messagingForm}>
              <div className="grid gap-4">
                {/* Zalo */}
                <div className="space-y-2">
                  <FormLabel>Zalo</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={messaging.zalo}
                      onChange={(e) => handleMessagingChange('zalo', e.target.value)}
                      placeholder="your-phone-number"
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialMessaging.zalo" />
                  </div>
                  <FormDescription className="text-xs">
                    Link: https://zalo.me/{messaging.zalo || 'your-phone-number'}
                  </FormDescription>
                </div>

                {/* Messenger */}
                <div className="space-y-2">
                  <FormLabel>Messenger</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={messaging.messenger}
                      onChange={(e) => handleMessagingChange('messenger', e.target.value)}
                      placeholder="username"
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialMessaging.messenger" />
                  </div>
                  <FormDescription className="text-xs">
                    Link: https://m.me/{messaging.messenger || 'username'}
                  </FormDescription>
                </div>

                {/* Telegram */}
                <div className="space-y-2">
                  <FormLabel>Telegram</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={messaging.telegram}
                      onChange={(e) => handleMessagingChange('telegram', e.target.value)}
                      placeholder="username"
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialMessaging.telegram" />
                  </div>
                  <FormDescription className="text-xs">
                    Link: https://t.me/{messaging.telegram || 'username'}
                  </FormDescription>
                </div>

                {/* WhatsApp */}
                <div className="space-y-2">
                  <FormLabel>WhatsApp</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={messaging.whatsapp}
                      onChange={(e) => handleMessagingChange('whatsapp', e.target.value)}
                      placeholder="84123456789"
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialMessaging.whatsapp" />
                  </div>
                  <FormDescription className="text-xs">
                    Link: https://wa.me/{messaging.whatsapp || '84123456789'}
                  </FormDescription>
                </div>

                {/* KakaoTalk */}
                <div className="space-y-2">
                  <FormLabel>KakaoTalk</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={messaging.kakao}
                      onChange={(e) => handleMessagingChange('kakao', e.target.value)}
                      placeholder="username"
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialMessaging.kakao" />
                  </div>
                  <FormDescription className="text-xs">
                    Link: kakaotalk://conversations/{messaging.kakao || 'username'}
                  </FormDescription>
                </div>

                {/* Discord */}
                <div className="space-y-2">
                  <FormLabel>Discord</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={messaging.discord}
                      onChange={(e) => handleMessagingChange('discord', e.target.value)}
                      placeholder="username"
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialMessaging.discord" />
                  </div>
                  <FormDescription className="text-xs">
                    Link: https://discord.com/users/{messaging.discord || 'username'}
                  </FormDescription>
                </div>

                {/* WeChat */}
                <div className="space-y-2">
                  <FormLabel>WeChat</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={messaging.wechat}
                      onChange={(e) => handleMessagingChange('wechat', e.target.value)}
                      placeholder="wechat-id"
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialMessaging.wechat" />
                  </div>
                  <FormDescription className="text-xs">
                    Link: weixin://dl/chat?{messaging.wechat || 'wechat-id'}
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
              <CardTitle className="text-lg">Social Media</CardTitle>
            </div>
            <p className="text-sm text-[#71717a] m-[0px] pt-2">
              Enter just your username/handle. Select visibility groups to control who sees each channel.
            </p>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-5 md:pb-6 pt-0">
            <Form {...channelsForm}>
              <div className="grid gap-4">
                {/* Facebook */}
                <div className="space-y-2">
                  <FormLabel>Facebook</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={channels.facebook}
                      onChange={(e) => handleChannelsChange('facebook', e.target.value)}
                      placeholder="yourpage"
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialChannels.facebook" />
                  </div>
                  <FormDescription className="text-xs">
                    Link: https://facebook.com/{channels.facebook || 'yourpage'}
                  </FormDescription>
                </div>

                {/* LinkedIn */}
                <div className="space-y-2">
                  <FormLabel>LinkedIn</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={channels.linkedin}
                      onChange={(e) => handleChannelsChange('linkedin', e.target.value)}
                      placeholder="username"
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialChannels.linkedin" />
                  </div>
                  <FormDescription className="text-xs">
                    Link: https://linkedin.com/in/{channels.linkedin || 'username'}
                  </FormDescription>
                </div>

                {/* Twitter */}
                <div className="space-y-2">
                  <FormLabel>Twitter / X</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={channels.twitter}
                      onChange={(e) => handleChannelsChange('twitter', e.target.value)}
                      placeholder="username"
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialChannels.twitter" />
                  </div>
                  <FormDescription className="text-xs">
                    Link: https://twitter.com/{channels.twitter || 'username'}
                  </FormDescription>
                </div>

                {/* YouTube */}
                <div className="space-y-2">
                  <FormLabel>YouTube</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={channels.youtube}
                      onChange={(e) => handleChannelsChange('youtube', e.target.value)}
                      placeholder="channel"
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialChannels.youtube" />
                  </div>
                  <FormDescription className="text-xs">
                    Link: https://youtube.com/@{channels.youtube || 'channel'}
                  </FormDescription>
                </div>

                {/* TikTok */}
                <div className="space-y-2">
                  <FormLabel>TikTok</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={channels.tiktok}
                      onChange={(e) => handleChannelsChange('tiktok', e.target.value)}
                      placeholder="username"
                      className="h-9 flex-1"
                    />
                    <FieldVisibilityPopover fieldPath="socialChannels.tiktok" />
                  </div>
                  <FormDescription className="text-xs">
                    Link: https://tiktok.com/@{channels.tiktok || 'username'}
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
