import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form@7.55.0";
import { Card, CardContent } from "../../ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Skeleton } from "../../ui/skeleton";
import { Upload, Edit2, Trash2, Sparkles, UtensilsCrossed, Building2, Home, Trees, Coffee, Briefcase, Film, Smile, Users, BookOpen, ChevronLeft, Baby, Palette, Presentation, Library, Armchair, Building, MapPin, Sofa, Flower2, ShoppingBag, Footprints, Store, Lightbulb, School, Image as ImageIcon, Camera, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../ui/dialog";
import { FullScreenImagePositioner } from "../FullScreenImagePositioner";
import { AvatarImagePositioner } from "../AvatarImagePositioner";
import { BusinessCardData, ProfileImageData } from "../../../types/business-card";
import { parseProfileImage } from "../../../utils/profile-image-utils";
import { api } from "../../../lib/api";
import { getUserCode } from "../../../utils/user-code";
import { toast } from "sonner@2.0.3";
import { supabase } from "../../../lib/supabase-client";
import { useAllFieldPermissions } from "../../../hooks/useBusinessManagement";
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
  
  // Check field permissions for employees
  const { isReadonly } = useAllFieldPermissions();

  const [showPositioner, setShowPositioner] = useState(false);
  const [showAvatarPositioner, setShowAvatarPositioner] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templates, setTemplates] = useState<Array<{ id: number; name: string; description: string; preview_url: string }>>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{ id: number; name: string; description: string; preview_url: string } | null>(null);
  const [templateOptions, setTemplateOptions] = useState<{
    backgroundColor?: string;
    place?: string;
    animeStyle?: string;
    casualStyle?: string;
    fashionStyle?: string;
  }>({
    backgroundColor: '#ffffff',
    place: '',
    animeStyle: '',
    casualStyle: '',
    fashionStyle: ''
  });
  const [professionalBackgroundType, setProfessionalBackgroundType] = useState<'color' | 'place'>('color');
  const [casualBackgroundType, setCasualBackgroundType] = useState<'place' | 'style'>('place');
  const [fashionBackgroundType, setFashionBackgroundType] = useState<'place' | 'style'>('place');
  const [generatingPortrait, setGeneratingPortrait] = useState(false);
  const [generatedImagePreview, setGeneratedImagePreview] = useState<string | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});
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

  const handleAIHelp = async () => {
    console.log('[handleAIHelp] Started');
    
    // Check if image is uploaded
    if (!currentImageUrl) {
      console.log('[handleAIHelp] No image uploaded');
      toast.error("You need to upload your portrait photo first");
      return;
    }

    // Check quota before opening template dialog
    try {
      console.log('[handleAIHelp] Getting user...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('[handleAIHelp] Auth error:', authError);
        toast.error("Please sign in to use this feature");
        return;
      }

      console.log('[handleAIHelp] User ID:', user.id);
      console.log('[handleAIHelp] Checking quota...');
      
      // Check if user has quota remaining
      const quotaResult = await api.quota.check(user.id, 'portrait_generation');
      
      console.log('[handleAIHelp] Quota result:', quotaResult);
      
      if (!quotaResult.allowed) {
        // User has exceeded their monthly limit
        const limitText = quotaResult.monthlyLimit === -1 
          ? 'unlimited' 
          : quotaResult.monthlyLimit.toString();
        
        console.log('[handleAIHelp] Quota exceeded. Limit:', limitText, 'Used:', quotaResult.monthlyUsed);
        
        // Better error message for 0 limit vs exceeded limit
        if (quotaResult.monthlyLimit === 0) {
          toast.error(
            `This feature is not available for your plan. Your monthly limit is 0.`
          );
        } else {
          toast.error(
            `Monthly limit reached! You've used ${quotaResult.monthlyUsed} of ${limitText} allowed generations.`
          );
        }
        return;
      }
      
      console.log('[handleAIHelp] Quota check passed');
    } catch (error: any) {
      console.error('[handleAIHelp] Quota check failed:', error);
      toast.error(`Failed to check quota: ${error.message}`);
      return;
    }

    // Reset state and set Professional as default
    setSelectedTemplate({ id: 1, name: "Template 1", description: "Professional", preview_url: "/templates/1/image" });
    setProfessionalBackgroundType('color');
    setTemplateOptions({
      backgroundColor: '#FFFFFF',
      place: '',
      animeStyle: '',
      casualStyle: '',
      fashionStyle: ''
    });

    // Open dialog and load templates
    setShowTemplateDialog(true);
    loadTemplates();
  };

  const loadTemplates = () => {
    setLoadingTemplates(true);
    try {
      // Hardcode templates based on the API structure with descriptions
      const templateList = [
        { id: 1, name: "Template 1", description: "Professional", preview_url: "/templates/1/image" },
        { id: 2, name: "Template 2", description: "Casual", preview_url: "/templates/2/image" },
        { id: 3, name: "Template 3", description: "Fashion", preview_url: "/templates/3/image" },
        { id: 4, name: "Template 4", description: "Fun", preview_url: "/templates/4/image" },
      ];
      setTemplates(templateList);
      
      // Initialize loading state for all templates
      const initialLoadingState: Record<number, boolean> = {};
      templateList.forEach(template => {
        initialLoadingState[template.id] = true;
      });
      setLoadingImages(initialLoadingState);
    } catch (error: any) {
      console.error("Failed to load templates:", error);
      toast.error(`Failed to load templates: ${error.message || 'Unknown error'}`);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleTemplateSelect = (template: { id: number; name: string; description: string; preview_url: string }) => {
    setSelectedTemplate(template);
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) {
      toast.error("Missing required data");
      return;
    }

    // Use currentImageUrl if available
    const photoToUse = currentImageUrl;
    
    if (!photoToUse) {
      toast.error("No photo available for generation");
      return;
    }

    try {
      setGeneratingPortrait(true);
      toast.info("Generating your portrait...");

      // Build the prompt based on template and options
      let prompt = "";
      
      if (selectedTemplate.id === 1) {
        // Professional template - either color background or place
        if (professionalBackgroundType === 'color') {
          const colorName = [
            { color: '#FFFFFF', name: 'white' },
            { color: '#E5E5E5', name: 'light gray' },
            { color: '#4A4A4A', name: 'dark gray' },
            { color: '#000000', name: 'black' },
            { color: '#F5F5DC', name: 'beige' },
            { color: '#FFF8DC', name: 'cream' },
            { color: '#C9E4FF', name: 'pastel blue' },
            { color: '#FFE4E1', name: 'soft pink' },
            { color: '#A8D5BA', name: 'green' },
            { color: '#C8A882', name: 'mocha' },
          ].find(c => c.color === templateOptions.backgroundColor)?.name || 'white';
          
          prompt = `Professional business portrait with ${colorName} background, natural lighting, and clean composition`;
        } else {
          // Place background for professional
          const placeDescriptions: Record<string, string> = {
            'corporate_office': 'corporate office with clean desks, glass walls, modern workspace',
            'boardroom': 'boardroom with conference table and presentation screen',
            'library': 'library or study room, intellectual and focused setting',
            'business_lounge': 'business lounge or coworking space with premium seating',
            'city_skyline': 'office with city skyline view through window, tall buildings in background',
            'reception_lobby': 'elegant reception lobby with front-desk area, professional vibe'
          };
          const place = templateOptions.place || 'corporate_office';
          const placeDesc = placeDescriptions[place] || place;
          prompt = `Professional business portrait in ${placeDesc}, natural lighting, clean composition, formal atmosphere`;
        }
      } else if (selectedTemplate.id === 2) {
        // Casual template with color or place
        if (casualBackgroundType === 'place') {
          const colorName = [
            { color: '#FFFFFF', name: 'white' },
            { color: '#E5E5E5', name: 'light gray' },
            { color: '#4A4A4A', name: 'dark gray' },
            { color: '#000000', name: 'black' },
            { color: '#F5F5DC', name: 'beige' },
            { color: '#FFF8DC', name: 'cream' },
            { color: '#C9E4FF', name: 'pastel blue' },
            { color: '#FFE4E1', name: 'soft pink' },
            { color: '#A8D5BA', name: 'green' },
            { color: '#C8A882', name: 'mocha' },
          ].find(c => c.color === templateOptions.backgroundColor)?.name || 'white';
          
          prompt = `Casual portrait with ${colorName} background, natural light, relaxed atmosphere, friendly expression`;
        } else {
          const placeDescriptions: Record<string, string> = {
            'living_room': 'living room with comfy sofa, homey environment',
            'garden': 'garden or backyard with greenery and warm lighting',
            'street_stroll': 'walking on a sidewalk or quiet street',
            'bookstore': 'cozy bookstore with charming shelves of books',
            'minimal_room': 'minimal room with simple, clean interior and soft tones',
            'beach_walk': 'beach walk with casual outdoor vibe and sea breeze atmosphere'
          };
          const place = templateOptions.place || 'living_room';
          const placeDesc = placeDescriptions[place] || place;
          prompt = `Casual portrait in ${placeDesc}, natural light, relaxed atmosphere, friendly expression`;
        }
      } else if (selectedTemplate.id === 3) {
        // Fashion full body template with color or place
        if (fashionBackgroundType === 'place') {
          const colorName = [
            { color: '#FFFFFF', name: 'white' },
            { color: '#E5E5E5', name: 'light gray' },
            { color: '#4A4A4A', name: 'dark gray' },
            { color: '#000000', name: 'black' },
            { color: '#F5F5DC', name: 'beige' },
            { color: '#FFF8DC', name: 'cream' },
            { color: '#C9E4FF', name: 'pastel blue' },
            { color: '#FFE4E1', name: 'soft pink' },
            { color: '#A8D5BA', name: 'green' },
            { color: '#C8A882', name: 'mocha' },
          ].find(c => c.color === templateOptions.backgroundColor)?.name || 'white';
          
          prompt = `Fashion full body portrait with ${colorName} background, studio lighting, high contrast, modern aesthetic`;
        } else {
          const placeDescriptions: Record<string, string> = {
            'runway_stage': 'runway stage with spotlight and dramatic shadows',
            'urban_street': 'urban street fashion scene with graffiti walls, narrow alleys, city energy',
            'boutique': 'high-end boutique interior with luxury store backdrop',
            'studio_editorial': 'studio with editorial lighting, colored lights, gradient backgrounds',
            'rooftop_cityscape': 'rooftop with dramatic cityscape, fashion-magazine style',
            'art_gallery': 'art gallery with clean modern walls, premium artistic vibe'
          };
          const place = templateOptions.place || 'runway_stage';
          const placeDesc = placeDescriptions[place] || place;
          prompt = `Fashion full body portrait in ${placeDesc}, studio lighting, high contrast, modern aesthetic`;
        }
      } else if (selectedTemplate.id === 4) {
        // Fun template with anime style only
        const style = templateOptions.animeStyle || 'cartoon';
        
        // Build detailed prompt based on style
        let stylePrompt = '';
        switch (style) {
          case 'ghibli':
            stylePrompt = 'Ghibli style portrait inspired by Studio Ghibli films, warm hand-painted backgrounds with magical realism, soft character expressions with natural movement, comforting color palettes, whimsical and nostalgic atmosphere, emotionally expressive';
            break;
          case 'cartoon':
            stylePrompt = 'Cartoon style portrait with simple shapes and bold outlines, exaggerated expressions, playful and humorous atmosphere, colorful and high-contrast with clean clear silhouettes, light-hearted scene';
            break;
          case 'anime':
            stylePrompt = 'Anime style portrait with sharp line work, expressive eyes, dynamic poses, vibrant colors with dramatic shading and stylized effects, Japanese animation aesthetic';
            break;
          case 'manga':
            stylePrompt = 'Manga style portrait with black-and-white line art, screentone textures, detailed background composition, motion lines and intense expressions, narrative storytelling aesthetic';
            break;
          case 'chibi':
            stylePrompt = 'Chibi style portrait with cute super-deformed character, big head and small body, soft lines with rounded shapes, pastel-like colors, very emotional and expressive with simple drawings, perfect for stickers and mascots';
            break;
          case 'semi-realistic':
            stylePrompt = 'Semi-realistic anime portrait mixing realism with anime aesthetics, accurate anatomy lighting and depth, anime-like eyes and hair with stylization, dramatic and cinematic atmosphere, emotional art style';
            break;
          default:
            stylePrompt = 'Cartoon style portrait, vibrant colors, artistic interpretation, fun and creative';
        }
        
        prompt = stylePrompt;
      }

      // Log what we're sending to the API for debugging
      console.log("=== API REQUEST DEBUG ===");
      console.log("Current Image URL:", photoToUse);
      console.log("Template ID:", selectedTemplate.id);
      console.log("Prompt:", prompt);
      console.log("Template Options:", templateOptions);
      console.log("========================");

      // Create FormData for API request
      const formData = new FormData();
      formData.append('user_image_url', photoToUse);
      formData.append('template_id', selectedTemplate.id.toString());
      formData.append('prompt', prompt);

      // Log FormData contents
      console.log("FormData contents:");
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      // Call the portrait generation API
      const response = await fetch('https://portrait-generator-568865197474.europe-west1.run.app/generate', {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'omit',
      });

      console.log("API Response Status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("API Error Response:", errorData);
        throw new Error(errorData?.error || `API error: ${response.status}`);
      }

      // Get the response JSON with base64 image
      const result = await response.json();
      console.log("API Success Response:", {
        status: result.status,
        hasImage: !!result.image_base64,
        imageFormat: result.image_format
      });
      
      if (result.status !== 'success' || !result.image_base64) {
        throw new Error("No image data returned from API");
      }
      
      // Convert base64 to data URL for preview
      const dataUrl = `data:image/${result.image_format || 'png'};base64,${result.image_base64}`;
      
      // Log usage to database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await api.quota.logUsage(user.id, 'portrait_generation');
        }
      } catch (logError) {
        console.error('Failed to log usage:', logError);
        // Don't block the user experience if logging fails
      }
      
      // Show preview dialog
      setGeneratedImagePreview(dataUrl);
      setShowTemplateDialog(false);
      setShowPreviewDialog(true);
      
      toast.success("Portrait generated successfully!");
    } catch (error: any) {
      console.error("Portrait generation failed:", error);
      toast.error(`Failed to generate portrait: ${error.message || 'Unknown error'}`);
    } finally {
      setGeneratingPortrait(false);
    }
  };

  const handleUseGeneratedImage = async () => {
    if (!generatedImagePreview) return;

    try {
      toast.info("Uploading generated portrait...");

      // Convert data URL to blob
      const response = await fetch(generatedImagePreview);
      const blob = await response.blob();
      
      // Create a file from the blob
      const file = new File([blob], `generated-portrait-${Date.now()}.png`, { type: 'image/png' });
      
      // Upload to Supabase
      const userCode = getUserCode();
      const { url } = await api.storage.upload(userCode, file);
      
      // Update the background image with the uploaded URL
      const newData: ProfileImageData = {
        imageUrl: url,
        position: { x: 0, y: 0, scale: 1 }
      };
      handleChange('profileImage', JSON.stringify(newData));
      
      toast.success("Portrait applied successfully!");
      setShowPreviewDialog(false);
      setGeneratedImagePreview(null);
      setSelectedTemplate(null);
      
      // Auto-open positioner to let user adjust the new portrait
      setTimeout(() => setShowPositioner(true), 100);
    } catch (error: any) {
      console.error("Failed to apply portrait:", error);
      toast.error(`Failed to apply portrait: ${error.message || 'Unknown error'}`);
    }
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
                  render={({ field }) => {
                    const readonly = isReadonly('personal.title');
                    return (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Professional Title *
                          {readonly && (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" title="This field is read-only" />
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => {
                              if (!readonly) {
                                field.onChange(e);
                                handleChange('title', e.target.value);
                              }
                            }}
                            placeholder="e.g., Interior Designer"
                            disabled={readonly}
                            className={readonly ? 'bg-muted cursor-not-allowed' : ''}
                          />
                        </FormControl>
                        {readonly && (
                          <p className="text-xs text-muted-foreground">
                            This field is controlled by your business owner
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => {
                    const readonly = isReadonly('personal.businessName');
                    return (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Business Name
                          {readonly && (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" title="This field is read-only" />
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => {
                              if (!readonly) {
                                field.onChange(e);
                                handleChange('businessName', e.target.value);
                              }
                            }}
                            placeholder="e.g., Design Solutions"
                            disabled={readonly}
                            className={readonly ? 'bg-muted cursor-not-allowed' : ''}
                          />
                        </FormControl>
                        {readonly && (
                          <p className="text-xs text-muted-foreground">
                            This field is controlled by your business owner
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
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
        <Card className="border-[#e4e4e7] shadow-sm gap-3 relative">
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
                  <div className="relative w-full h-48 bg-slate-100 rounded-lg overflow-hidden group">
                    <img
                      src={currentImageUrl}
                      alt="Background preview"
                      className="w-full h-full object-cover"
                    />
                    {/* AI Button at Bottom Right */}
                    <button
                      type="button"
                      onClick={handleAIHelp}
                      className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/70 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white/80 transition-all border border-white/30"
                      title="AI Restyle with AI"
                    >
                      <span className="text-sm font-medium text-gray-900">AI Restyle</span>
                      <Sparkles className="w-4 h-4 text-gray-900" />
                    </button>
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

      {/* Template Selection - Full Screen */}
      {showTemplateDialog && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {/* Header */}
          <div className="h-[46px] shrink-0 border-b border-[#ebebeb] bg-background">
            <div className="flex h-[46px] items-center justify-between px-[12px]">
              {/* Back button */}
              <button 
                onClick={() => {
                  setShowTemplateDialog(false);
                  setSelectedTemplate(null);
                  setProfessionalBackgroundType('color');
                  setCasualBackgroundType('place');
                  setFashionBackgroundType('place');
                  setTemplateOptions({
                    backgroundColor: '#ffffff',
                    place: '',
                    animeStyle: '',
                    casualStyle: '',
                    fashionStyle: ''
                  });
                }}
                disabled={generatingPortrait}
                className="shrink-0 size-[28px] rounded-[6px] flex items-center justify-center hover:bg-[#ebebeb]/30 transition-colors" 
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5 text-[#83827d]" strokeWidth={1.67} />
              </button>
              
              {/* Title */}
              <div className="flex-1 text-center">
                <p className="leading-[20px] text-[#3d3929] text-sm">
                  Portrait Style
                </p>
              </div>
              
              {/* Empty space for symmetry */}
              <div className="shrink-0 size-[28px]" />
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
            {loadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading templates...</div>
              </div>
            ) : templates.length > 0 ? (
              <div className="space-y-4 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  {templates.map((template) => {
                    // Construct full image URL from preview_url
                    const imageUrl = template.preview_url.startsWith('http') 
                      ? template.preview_url 
                      : `https://portrait-generator-568865197474.europe-west1.run.app${template.preview_url}`;
                    
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleTemplateSelect(template)}
                        className={`flex flex-col items-center rounded-lg overflow-hidden border-2 transition-all ${
                          selectedTemplate?.id === template.id
                            ? 'border-primary'
                            : 'border-border hover:border-border/80'
                        }`}
                      >
                        <div className="relative aspect-square w-full">
                          {loadingImages[template.id] && (
                            <Skeleton className="absolute inset-0 w-full h-full" />
                          )}
                          <img
                            src={imageUrl}
                            alt={template.name}
                            className={`w-full h-full object-cover ${loadingImages[template.id] ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
                            onLoad={() => {
                              setLoadingImages(prev => ({
                                ...prev,
                                [template.id]: false
                              }));
                            }}
                            onError={() => {
                              setLoadingImages(prev => ({
                                ...prev,
                                [template.id]: false
                              }));
                            }}
                          />
                          {selectedTemplate?.id === template.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div 
                          className="px-3 py-2 bg-background"
                          style={{ textAlign: 'center' }}
                        >
                          <p 
                            className={`text-sm ${
                              selectedTemplate?.id === template.id
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            }`}
                            style={{ textAlign: 'center', width: '100%', display: 'block' }}
                          >
                            {template.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {/* Template-specific Options */}
                {selectedTemplate && (
                  <div className="p-4 bg-card rounded-lg border border-[#e4e4e7] flex flex-col">
                    {selectedTemplate.id === 1 && (
                      <div className="space-y-3 w-full">
                        {/* Toggle between Simple and Place */}
                        <div className="flex gap-2 p-1 bg-muted rounded-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setProfessionalBackgroundType('color');
                              setTemplateOptions({ ...templateOptions, place: '', backgroundColor: '#FFFFFF' });
                            }}
                            className={`flex-1 py-2 px-3 rounded-md text-sm transition-all ${
                              professionalBackgroundType === 'color'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Simple
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setProfessionalBackgroundType('place');
                              setTemplateOptions({ ...templateOptions, backgroundColor: '', place: 'office' });
                            }}
                            className={`flex-1 py-2 px-3 rounded-md text-sm transition-all ${
                              professionalBackgroundType === 'place'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Place
                          </button>
                        </div>
                        
                        {/* Show Color Picker or Place Picker based on toggle */}
                        <div className="min-h-[140px]">
                        {professionalBackgroundType === 'color' ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-5 gap-2">
                              {[
                                { color: '#FFFFFF', name: 'White' },
                                { color: '#E5E5E5', name: 'Light Gray' },
                                { color: '#4A4A4A', name: 'Dark Gray' },
                                { color: '#000000', name: 'Black' },
                                { color: '#F5F5DC', name: 'Beige' },
                                { color: '#FFF8DC', name: 'Cream' },
                                { color: '#C9E4FF', name: 'Pastel Blue' },
                                { color: '#FFE4E1', name: 'Soft Pink' },
                                { color: '#A8D5BA', name: 'Green' },
                                { color: '#C8A882', name: 'Mocha' },
                              ].map((colorOption) => (
                                <button
                                  key={colorOption.color}
                                  type="button"
                                  onClick={() => setTemplateOptions({ ...templateOptions, backgroundColor: colorOption.color })}
                                  className={`aspect-square rounded-lg border-2 transition-all ${
                                    templateOptions.backgroundColor === colorOption.color
                                      ? 'border-primary scale-110'
                                      : 'border-border hover:border-border/80'
                                  }`}
                                  style={{ backgroundColor: colorOption.color }}
                                  title={colorOption.name}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { value: 'corporate_office', name: 'Office', Icon: Building2 },
                                { value: 'boardroom', name: 'Boardroom', Icon: Presentation },
                                { value: 'library', name: 'Library', Icon: Library },
                                { value: 'business_lounge', name: 'Lounge', Icon: Armchair },
                                { value: 'city_skyline', name: 'Skyline', Icon: Building },
                                { value: 'reception_lobby', name: 'Lobby', Icon: MapPin },
                              ].map((placeOption) => {
                                const Icon = placeOption.Icon;
                                return (
                                  <button
                                    key={placeOption.value}
                                    type="button"
                                    onClick={() => setTemplateOptions({ ...templateOptions, place: placeOption.value })}
                                    className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                                      templateOptions.place === placeOption.value
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-border/80 bg-background'
                                    }`}
                                    style={{ aspectRatio: '5/3' }}
                                  >
                                    <Icon className={`w-5 h-5 mb-0.5 ${
                                      templateOptions.place === placeOption.value ? 'text-primary' : 'text-muted-foreground'
                                    }`} />
                                    <span className={`text-xs ${
                                      templateOptions.place === placeOption.value ? 'text-primary' : 'text-muted-foreground'
                                    }`}>
                                      {placeOption.name}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        </div>
                      </div>
                    )}
                    
                    {selectedTemplate.id === 2 && (
                      <div className="space-y-3 w-full">
                        {/* Toggle between Simple and Place */}
                        <div className="flex gap-2 p-1 bg-muted rounded-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setCasualBackgroundType('place');
                              setTemplateOptions({ ...templateOptions, place: '', backgroundColor: '#FFFFFF' });
                            }}
                            className={`flex-1 py-2 px-3 rounded-md text-sm transition-all ${
                              casualBackgroundType === 'place'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Simple
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCasualBackgroundType('style');
                              setTemplateOptions({ ...templateOptions, backgroundColor: '', place: 'outdoor' });
                            }}
                            className={`flex-1 py-2 px-3 rounded-md text-sm transition-all ${
                              casualBackgroundType === 'style'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Place
                          </button>
                        </div>
                        
                        {/* Show Color Picker or Place Picker based on toggle */}
                        <div className="min-h-[140px]">
                        {casualBackgroundType === 'place' ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-5 gap-2">
                              {[
                                { color: '#FFFFFF', name: 'White' },
                                { color: '#E5E5E5', name: 'Light Gray' },
                                { color: '#4A4A4A', name: 'Dark Gray' },
                                { color: '#000000', name: 'Black' },
                                { color: '#F5F5DC', name: 'Beige' },
                                { color: '#FFF8DC', name: 'Cream' },
                                { color: '#C9E4FF', name: 'Pastel Blue' },
                                { color: '#FFE4E1', name: 'Soft Pink' },
                                { color: '#A8D5BA', name: 'Green' },
                                { color: '#C8A882', name: 'Mocha' },
                              ].map((colorOption) => (
                                <button
                                  key={colorOption.color}
                                  type="button"
                                  onClick={() => setTemplateOptions({ ...templateOptions, backgroundColor: colorOption.color })}
                                  className={`aspect-square rounded-lg border-2 transition-all ${
                                    templateOptions.backgroundColor === colorOption.color
                                      ? 'border-primary scale-110'
                                      : 'border-border hover:border-border/80'
                                  }`}
                                  style={{ backgroundColor: colorOption.color }}
                                  title={colorOption.name}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { value: 'living_room', name: 'Living', Icon: Sofa },
                                { value: 'garden', name: 'Garden', Icon: Flower2 },
                                { value: 'street_stroll', name: 'Street', Icon: Footprints },
                                { value: 'bookstore', name: 'Bookstore', Icon: BookOpen },
                                { value: 'minimal_room', name: 'Minimal', Icon: Home },
                                { value: 'beach_walk', name: 'Beach', Icon: Trees },
                              ].map((placeOption) => {
                                const Icon = placeOption.Icon;
                                return (
                                  <button
                                    key={placeOption.value}
                                    type="button"
                                    onClick={() => setTemplateOptions({ ...templateOptions, place: placeOption.value })}
                                    className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                                      templateOptions.place === placeOption.value
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-border/80 bg-background'
                                    }`}
                                    style={{ aspectRatio: '5/3' }}
                                  >
                                    <Icon className={`w-5 h-5 mb-0.5 ${
                                      templateOptions.place === placeOption.value ? 'text-primary' : 'text-muted-foreground'
                                    }`} />
                                    <span className={`text-xs ${
                                      templateOptions.place === placeOption.value ? 'text-primary' : 'text-muted-foreground'
                                    }`}>
                                      {placeOption.name}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        </div>
                      </div>
                    )}
                    
                    {(selectedTemplate.id === 3) && (
                      <div className="space-y-3 w-full">
                        {/* Toggle between Simple and Place */}
                        <div className="flex gap-2 p-1 bg-muted rounded-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setFashionBackgroundType('place');
                              setTemplateOptions({ ...templateOptions, place: '', backgroundColor: '#FFFFFF' });
                            }}
                            className={`flex-1 py-2 px-3 rounded-md text-sm transition-all ${
                              fashionBackgroundType === 'place'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Simple
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFashionBackgroundType('style');
                              setTemplateOptions({ ...templateOptions, backgroundColor: '', place: 'outdoor' });
                            }}
                            className={`flex-1 py-2 px-3 rounded-md text-sm transition-all ${
                              fashionBackgroundType === 'style'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Place
                          </button>
                        </div>
                        
                        {/* Show Color Picker or Place Picker based on toggle */}
                        <div className="min-h-[140px]">
                        {fashionBackgroundType === 'place' ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-5 gap-2">
                              {[
                                { color: '#FFFFFF', name: 'White' },
                                { color: '#E5E5E5', name: 'Light Gray' },
                                { color: '#4A4A4A', name: 'Dark Gray' },
                                { color: '#000000', name: 'Black' },
                                { color: '#F5F5DC', name: 'Beige' },
                                { color: '#FFF8DC', name: 'Cream' },
                                { color: '#C9E4FF', name: 'Pastel Blue' },
                                { color: '#FFE4E1', name: 'Soft Pink' },
                                { color: '#A8D5BA', name: 'Green' },
                                { color: '#C8A882', name: 'Mocha' },
                              ].map((colorOption) => (
                                <button
                                  key={colorOption.color}
                                  type="button"
                                  onClick={() => setTemplateOptions({ ...templateOptions, backgroundColor: colorOption.color })}
                                  className={`aspect-square rounded-lg border-2 transition-all ${
                                    templateOptions.backgroundColor === colorOption.color
                                      ? 'border-primary scale-110'
                                      : 'border-border hover:border-border/80'
                                  }`}
                                  style={{ backgroundColor: colorOption.color }}
                                  title={colorOption.name}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { value: 'runway_stage', name: 'Runway', Icon: Camera },
                                { value: 'urban_street', name: 'Urban', Icon: Footprints },
                                { value: 'boutique', name: 'Boutique', Icon: ShoppingBag },
                                { value: 'studio_editorial', name: 'Studio', Icon: Lightbulb },
                                { value: 'rooftop_cityscape', name: 'Rooftop', Icon: Building },
                                { value: 'art_gallery', name: 'Gallery', Icon: ImageIcon },
                              ].map((placeOption) => {
                                const Icon = placeOption.Icon;
                                return (
                                  <button
                                    key={placeOption.value}
                                    type="button"
                                    onClick={() => setTemplateOptions({ ...templateOptions, place: placeOption.value })}
                                    className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                                      templateOptions.place === placeOption.value
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-border/80 bg-background'
                                    }`}
                                    style={{ aspectRatio: '5/3' }}
                                  >
                                    <Icon className={`w-5 h-5 mb-0.5 ${
                                      templateOptions.place === placeOption.value ? 'text-primary' : 'text-muted-foreground'
                                    }`} />
                                    <span className={`text-xs ${
                                      templateOptions.place === placeOption.value ? 'text-primary' : 'text-muted-foreground'
                                    }`}>
                                      {placeOption.name}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        </div>
                      </div>
                    )}
                    
                    {selectedTemplate.id === 4 && (
                      <div className="space-y-3 w-full">
                        {/* Toggle for Style - single option for consistency */}
                        <div className="flex gap-2 p-1 bg-muted rounded-lg">
                          <button
                            type="button"
                            className="flex-1 py-2 px-3 rounded-md text-sm transition-all bg-background text-foreground shadow-sm"
                          >
                            Style
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { value: 'ghibli', name: 'Ghibli', Icon: Film },
                              { value: 'cartoon', name: 'Cartoon', Icon: Smile },
                              { value: 'anime', name: 'Anime', Icon: Users },
                              { value: 'manga', name: 'Manga', Icon: BookOpen },
                              { value: 'chibi', name: 'Chibi', Icon: Baby },
                              { value: 'semi-realistic', name: 'Semi-Realistic', Icon: Palette },
                            ].map((styleOption) => {
                              const Icon = styleOption.Icon;
                              return (
                                <button
                                  key={styleOption.value}
                                  type="button"
                                  onClick={() => setTemplateOptions({ ...templateOptions, animeStyle: styleOption.value })}
                                  className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                                    templateOptions.animeStyle === styleOption.value
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border hover:border-border/80 bg-background'
                                  }`}
                                  style={{ aspectRatio: '5/3' }}
                                >
                                  <Icon className={`w-5 h-5 mb-0.5 ${
                                    templateOptions.animeStyle === styleOption.value ? 'text-primary' : 'text-muted-foreground'
                                  }`} />
                                  <span className={`text-xs ${
                                    templateOptions.animeStyle === styleOption.value ? 'text-primary' : 'text-muted-foreground'
                                  }`}>
                                    {styleOption.name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">No templates available</div>
              </div>
            )}
          </div>
          
          {/* Fixed Bottom Actions */}
          <div className="flex-shrink-0 px-4 py-4 border-t border-[#ebebeb] bg-background">
            <Button
              type="button"
              onClick={handleApplyTemplate}
              disabled={!selectedTemplate || generatingPortrait}
              className="w-full"
            >
              {generatingPortrait ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                'Apply Style'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generated Portrait Preview</DialogTitle>
            <DialogDescription>
              Review and apply the generated portrait
            </DialogDescription>
          </DialogHeader>
          
          {generatedImagePreview ? (
            <div className="relative w-full aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden">
              <img
                src={generatedImagePreview}
                alt="Generated portrait preview"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">No preview available</div>
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreviewDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUseGeneratedImage}
              className="flex-1"
            >
              Apply Portrait
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}