import React from "react";
import { useForm } from "react-hook-form@7.55.0";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Input } from "../../ui/input";
import { BusinessCardData } from "../../../types/business-card";
import { MessageCircle, Share2 } from "lucide-react";

interface SocialLinksFormProps {
  messaging: BusinessCardData['socialMessaging'];
  channels: BusinessCardData['socialChannels'];
  onMessagingChange: (data: BusinessCardData['socialMessaging']) => void;
  onChannelsChange: (data: BusinessCardData['socialChannels']) => void;
  onFieldFocus?: (field: { label: string; value: string; onApply: (value: string) => void }) => void;
}

export function SocialLinksForm({ messaging, channels, onMessagingChange, onChannelsChange, onFieldFocus }: SocialLinksFormProps) {
  const messagingForm = useForm({
    defaultValues: messaging,
    values: messaging,
  });

  const channelsForm = useForm({
    defaultValues: channels,
    values: channels,
  });

  const validateURL = (value: string): string | true => {
    if (!value) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return "Please enter a valid URL (e.g., https://example.com)";
    }
  };

  const handleMessagingChange = (field: keyof BusinessCardData['socialMessaging'], value: string) => {
    onMessagingChange({
      ...messaging,
      [field]: value
    });
  };

  const handleChannelsChange = (field: keyof BusinessCardData['socialChannels'], value: string) => {
    onChannelsChange({
      ...channels,
      [field]: value
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Messaging Apps */}
      <Card className="border-[#e4e4e7] shadow-sm gap-3">
        <CardHeader className="px-4 md:px-6 md:pt-6 pb-[0px] pt-[12px] pr-[16px] pl-[16px]">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#0a0a0a]" />
            <CardTitle className="text-lg">Messaging Apps</CardTitle>
          </div>
          <p className="text-sm text-[#71717a] m-[0px]">Direct messaging platforms</p>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-5 md:pb-6 space-y-4">
          <Form {...messagingForm}>
            <FormField
              control={messagingForm.control}
              name="zalo"
              rules={{ validate: validateURL }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zalo</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleMessagingChange('zalo', e.target.value);
                      }}
                      placeholder="https://zalo.me/your-id"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={messagingForm.control}
              name="messenger"
              rules={{ validate: validateURL }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Messenger</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleMessagingChange('messenger', e.target.value);
                      }}
                      placeholder="https://m.me/username"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={messagingForm.control}
              name="telegram"
              rules={{ validate: validateURL }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telegram</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleMessagingChange('telegram', e.target.value);
                      }}
                      placeholder="https://t.me/username"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={messagingForm.control}
              name="whatsapp"
              rules={{ validate: validateURL }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleMessagingChange('whatsapp', e.target.value);
                      }}
                      placeholder="https://wa.me/84123456789"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={messagingForm.control}
              name="kakao"
              rules={{ validate: validateURL }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>KakaoTalk</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleMessagingChange('kakao', e.target.value);
                      }}
                      placeholder="kakaotalk://conversations/username"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={messagingForm.control}
              name="discord"
              rules={{ validate: validateURL }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discord</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleMessagingChange('discord', e.target.value);
                      }}
                      placeholder="https://discord.com/users/username"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={messagingForm.control}
              name="wechat"
              rules={{ validate: validateURL }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WeChat</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleMessagingChange('wechat', e.target.value);
                      }}
                      placeholder="weixin://dl/chat"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          <p className="text-sm text-[#71717a] m-[0px]">Public social profiles</p>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-5 md:pb-6 space-y-4">
          <Form {...channelsForm}>
            <FormField
              control={channelsForm.control}
              name="facebook"
              rules={{ validate: validateURL }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleChannelsChange('facebook', e.target.value);
                      }}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={channelsForm.control}
              name="linkedin"
              rules={{ validate: validateURL }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleChannelsChange('linkedin', e.target.value);
                      }}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={channelsForm.control}
              name="twitter"
              rules={{ validate: validateURL }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter / X</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleChannelsChange('twitter', e.target.value);
                      }}
                      placeholder="https://twitter.com/username"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={channelsForm.control}
              name="youtube"
              rules={{ validate: validateURL }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleChannelsChange('youtube', e.target.value);
                      }}
                      placeholder="https://youtube.com/@channel"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={channelsForm.control}
              name="tiktok"
              rules={{ validate: validateURL }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TikTok</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleChannelsChange('tiktok', e.target.value);
                      }}
                      placeholder="https://tiktok.com/@username"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>

          <div className="bg-[#e9e6dc]/30 p-4 rounded-lg border border-[#535146]/10 mt-4">
            <p className="text-sm font-medium text-[#535146] mb-2">💡 Tips</p>
            <ul className="text-sm text-[#535146]/70 space-y-1">
              <li>• Enter full URLs including https://</li>
              <li>• Leave blank any platforms you don't use</li>
              <li>• Double-check URLs to ensure they work</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
