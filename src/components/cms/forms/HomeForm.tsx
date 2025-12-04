import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form@7.55.0";
import { Card, CardContent } from "../../ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Upload, Edit2, Trash2 } from "lucide-react";
import { FullScreenImagePositioner } from "../FullScreenImagePositioner";
import { AvatarImagePositioner } from "../AvatarImagePositioner";
import { BusinessCardData, ProfileImageData } from "../../../types/business-card";
import { parseProfileImage } from "../../../utils/profile-image-utils";
import { api } from "../../../lib/api";
import { getUserCode } from "../../../utils/user-code";
import { toast } from "sonner@2.0.3";
import imgImg from "figma:asset/420b26ed698402e60bcb7141f4b23bc3850beb9d.png";

interface HomeFormProps {
  data: BusinessCardData['personal'];
  onChange: (data: BusinessCardData['personal']) => void;
  onFieldFocus?: (field: { label: string; value: string; onApply: (value: string) => void }) => void;
}

export function HomeForm({ data, onChange, onFieldFocus }: HomeFormProps) {
  const form = useForm({
    defaultValues: data,
    values: data,
  });

  const [showPositioner, setShowPositioner] = useState(false);
  const [showAvatarPositioner, setShowAvatarPositioner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof BusinessCardData['personal'], value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const profileImageData = parseProfileImage(data.profileImage);
  const currentImageUrl = profileImageData?.imageUrl || "";
  const currentPosition = profileImageData?.position || { x: 0, y: 0, scale: 1 };
  const currentAvatarPosition = profileImageData?.avatarPosition || { x: 0, y: 0, scale: 1 };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const userCode = getUserCode();
      toast.info("Uploading image...");
      
      const { url } = await api.storage.upload(userCode, file);
      
      const newData: ProfileImageData = {
        imageUrl: url,
        position: { x: 0, y: 0, scale: 1 }
      };
      handleChange('profileImage', JSON.stringify(newData));
      toast.success("Image uploaded successfully");
      
      // Auto-open positioner after upload
      setTimeout(() => setShowPositioner(true), 100);
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast.error(`Upload failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSavePosition = (position: { x: number; y: number; scale: number }) => {
    const newData: ProfileImageData = {
      imageUrl: currentImageUrl,
      position,
      avatarPosition: profileImageData?.avatarPosition
    };
    handleChange('profileImage', JSON.stringify(newData));
  };

  const handleSaveAvatarPosition = (avatarPosition: { x: number; y: number; scale: number }) => {
    const newData: ProfileImageData = {
      imageUrl: currentImageUrl,
      position: profileImageData?.position,
      avatarPosition
    };
    handleChange('profileImage', JSON.stringify(newData));
  };

  const handleRemoveImage = () => {
    handleChange('profileImage', '');
  };

  return (
    <>
      <div className="space-y-5 md:space-y-6">
        {/* Main Information Section */}
        <Card className="border-[#e4e4e7] shadow-sm gap-3">
          <CardContent className="px-4 md:px-6 pb-5 md:pb-6 pt-5 md:pt-6">
            <Form {...form}>
              <div className="grid gap-4 md:gap-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleChange('name', e.target.value);
                          }}
                          placeholder="Enter your full name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Title *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleChange('title', e.target.value);
                          }}
                          placeholder="e.g., Interior Designer"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleChange('businessName', e.target.value);
                          }}
                          placeholder="e.g., Design Solutions"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleChange('bio', e.target.value);
                          }}
                          placeholder="Tell us about yourself..."
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Form>
          </CardContent>
        </Card>

        {/* Background Image Section */}
        <Card className="border-[#e4e4e7] shadow-sm gap-3">
          <CardContent className="px-4 md:px-6 pb-5 md:pb-6 pt-5 md:pt-6">
            <div className="space-y-4">
              <div>
                <Label>Home Background Image</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload and position the background image for your home screen
                </p>
              </div>

              {currentImageUrl ? (
                <div className="space-y-3">
                  {/* Image Preview */}
                  <div className="relative w-full h-48 bg-slate-100 rounded-lg overflow-hidden">
                    <img
                      src={currentImageUrl}
                      alt="Background preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPositioner(true)}
                      className="flex-1"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Position
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Change
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-dashed"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm">Upload Background Image</span>
                  </div>
                </Button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Avatar Position Section */}
        {currentImageUrl && (
          <Card className="border-[#e4e4e7] shadow-sm gap-3">
            <CardContent className="px-4 md:px-6 pb-5 md:pb-6 pt-5 md:pt-6">
              <div className="space-y-4">
                <div>
                  <Label>Avatar Image Position</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Adjust how your image appears in the circular avatar
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAvatarPositioner(true)}
                  className="w-full"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Avatar Position
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Full-Screen Image Positioner */}
      {showPositioner && currentImageUrl && (
        <FullScreenImagePositioner
          imageUrl={currentImageUrl}
          initialPosition={currentPosition}
          profileName={data.name}
          profileTitle={data.title}
          onSave={handleSavePosition}
          onClose={() => setShowPositioner(false)}
        />
      )}

      {/* Avatar Image Positioner */}
      {showAvatarPositioner && currentImageUrl && (
        <AvatarImagePositioner
          imageUrl={currentImageUrl}
          initialPosition={currentAvatarPosition}
          onSave={handleSaveAvatarPosition}
          onClose={() => setShowAvatarPositioner(false)}
        />
      )}
    </>
  );
}