import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { X, Check } from "lucide-react";
import { PortfolioItem, PortfolioItemType as ItemType } from "../../types/business-card";
import { ImageUploader } from "./ImageUploader";
import { AIAssistant } from "./AIAssistant";

interface InlinePortfolioItemFormProps {
  item: PortfolioItem;
  onSave: (item: PortfolioItem) => void;
  onCancel: () => void;
}

export function InlinePortfolioItemForm({ item, onSave, onCancel }: InlinePortfolioItemFormProps) {
  const [currentItem, setCurrentItem] = useState(item);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof PortfolioItem, value: string | string[]) => {
    setCurrentItem(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleTypeChange = (type: ItemType) => {
    setCurrentItem(prev => ({
      ...prev,
      type,
      // Clear type-specific fields when switching types
      images: type === 'images' ? prev.images : undefined,
      videoUrl: type === 'video' ? prev.videoUrl : undefined,
      tourUrl: type === 'virtual-tour' ? prev.tourUrl : undefined,
    }));
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!currentItem.title.trim()) {
      newErrors.title = 'Title is required';
    }

    // Validate based on type
    if (currentItem.type === 'images' && (!currentItem.images || currentItem.images.length === 0)) {
      newErrors.images = 'At least one image is required';
    } else if (currentItem.type === 'video' && !currentItem.videoUrl?.trim()) {
      newErrors.videoUrl = 'Video URL is required';
    } else if (currentItem.type === 'virtual-tour' && !currentItem.tourUrl?.trim()) {
      newErrors.tourUrl = 'Virtual tour URL is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(currentItem);
  };

  return (
    <Card className="border-[#e4e4e7] shadow-sm">
      <CardContent className="space-y-4 p-[16px]">
      {/* Type Selection */}
      <div>
        <label className="text-sm text-[#71717a] block mb-2">Type *</label>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={currentItem.type === 'images' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('images')}
            className={currentItem.type === 'images' ? 'bg-[#535146] hover:bg-[#535146]/90' : ''}
          >
            Images
          </Button>
          <Button
            type="button"
            size="sm"
            variant={currentItem.type === 'video' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('video')}
            className={currentItem.type === 'video' ? 'bg-[#535146] hover:bg-[#535146]/90' : ''}
          >
            Video
          </Button>
          <Button
            type="button"
            size="sm"
            variant={currentItem.type === 'virtual-tour' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('virtual-tour')}
            className={currentItem.type === 'virtual-tour' ? 'bg-[#535146] hover:bg-[#535146]/90' : ''}
          >
            Virtual Tour
          </Button>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-sm font-medium block mb-2">Title *</label>
        <Input
          value={currentItem.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Project title"
          className="h-10"
        />
        {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium block mb-2">Description</label>
        <Input
          value={currentItem.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe this project..."
          className="h-10"
        />
      </div>

      {/* Type-specific fields */}
      {currentItem.type === 'images' && (
        <div>
          <ImageUploader
            label="Project Images *"
            value={currentItem.images || []}
            onChange={(value) => handleChange('images', value)}
            description="Upload one or more images for this portfolio item"
            aspectRatio="16/9"
          />
          {errors.images && <p className="text-sm text-red-600 mt-1">{errors.images}</p>}
        </div>
      )}

      {currentItem.type === 'video' && (
        <div>
          <label className="text-sm font-medium block mb-2">Video URL *</label>
          <Input
            value={currentItem.videoUrl || ''}
            onChange={(e) => handleChange('videoUrl', e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />
          <p className="text-xs text-[#71717a] mt-1">Supports YouTube, Vimeo, and other video platforms</p>
          {errors.videoUrl && <p className="text-sm text-red-600 mt-1">{errors.videoUrl}</p>}
        </div>
      )}

      {currentItem.type === 'virtual-tour' && (
        <div>
          <label className="text-sm font-medium block mb-2">Virtual Tour URL *</label>
          <Input
            value={currentItem.tourUrl || ''}
            onChange={(e) => handleChange('tourUrl', e.target.value)}
            placeholder="https://my.matterport.com/show/?m=..."
          />
          <p className="text-xs text-[#71717a] mt-1">Supports Matterport and other virtual tour platforms</p>
          {errors.tourUrl && <p className="text-sm text-red-600 mt-1">{errors.tourUrl}</p>}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          className="flex-1 bg-[#535146] hover:bg-[#535146]/90"
        >
          <Check className="w-4 h-4 mr-2" />
          Save Item
        </Button>
      </div>
      </CardContent>
    </Card>
  );
}
