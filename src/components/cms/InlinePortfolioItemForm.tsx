import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { X, Check } from "lucide-react";
import { PortfolioItem, PortfolioItemType as ItemType } from "../../types/business-card";
import { ImageUploader } from "./ImageUploader";
import { useTranslation } from "react-i18next";

interface InlinePortfolioItemFormProps {
  item: PortfolioItem;
  onSave: (item: PortfolioItem) => void;
  onCancel: () => void;
}

export function InlinePortfolioItemForm({ item, onSave, onCancel }: InlinePortfolioItemFormProps) {
  const { t } = useTranslation();
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
      newErrors.title = t('portfolioForm.titleRequired');
    }

    // Validate based on type
    if (currentItem.type === 'images' && (!currentItem.images || currentItem.images.length === 0)) {
      newErrors.images = t('portfolioForm.imagesRequired');
    } else if (currentItem.type === 'video' && !currentItem.videoUrl?.trim()) {
      newErrors.videoUrl = t('portfolioForm.videoUrlRequired');
    } else if (currentItem.type === 'virtual-tour' && !currentItem.tourUrl?.trim()) {
      newErrors.tourUrl = t('portfolioForm.virtualTourUrlRequired');
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
        <label className="text-sm text-[#71717a] block mb-2">{t('portfolioForm.type')} *</label>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={currentItem.type === 'images' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('images')}
            className={currentItem.type === 'images' ? 'bg-[#535146] hover:bg-[#535146]/90' : ''}
          >
            {t('portfolioForm.images')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={currentItem.type === 'video' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('video')}
            className={currentItem.type === 'video' ? 'bg-[#535146] hover:bg-[#535146]/90' : ''}
          >
            {t('portfolioForm.video')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={currentItem.type === 'virtual-tour' ? 'default' : 'outline'}
            onClick={() => handleTypeChange('virtual-tour')}
            className={currentItem.type === 'virtual-tour' ? 'bg-[#535146] hover:bg-[#535146]/90' : ''}
          >
            {t('portfolioForm.virtualTour')}
          </Button>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-sm font-medium block mb-2">{t('portfolioForm.title')} *</label>
        <Input
          value={currentItem.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder={t('portfolioForm.projectTitlePlaceholder')}
          className="h-10"
        />
        {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium block mb-2">{t('portfolioForm.description')}</label>
        <Input
          value={currentItem.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder={t('portfolioForm.describeProjectPlaceholder')}
          className="h-10"
        />
      </div>

      {/* Type-specific fields */}
      {currentItem.type === 'images' && (
        <div>
          <ImageUploader
            label={`${t('portfolioForm.projectImages')} *`}
            value={currentItem.images || []}
            onChange={(value) => handleChange('images', value)}
            description={t('portfolioForm.uploadImagesDescription')}
            aspectRatio="16/9"
          />
          {errors.images && <p className="text-sm text-red-600 mt-1">{errors.images}</p>}
        </div>
      )}

      {currentItem.type === 'video' && (
        <div>
          <label className="text-sm font-medium block mb-2">{t('portfolioForm.videoUrl')} *</label>
          <Input
            value={currentItem.videoUrl || ''}
            onChange={(e) => handleChange('videoUrl', e.target.value)}
            placeholder={t('portfolioForm.videoUrlPlaceholder')}
          />
          <p className="text-xs text-[#71717a] mt-1">{t('portfolioForm.videoUrlDescription')}</p>
          {errors.videoUrl && <p className="text-sm text-red-600 mt-1">{errors.videoUrl}</p>}
        </div>
      )}

      {currentItem.type === 'virtual-tour' && (
        <div>
          <label className="text-sm font-medium block mb-2">{t('portfolioForm.virtualTourUrl')} *</label>
          <Input
            value={currentItem.tourUrl || ''}
            onChange={(e) => handleChange('tourUrl', e.target.value)}
            placeholder={t('portfolioForm.virtualTourUrlPlaceholder')}
          />
          <p className="text-xs text-[#71717a] mt-1">{t('portfolioForm.virtualTourUrlDescription')}</p>
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
          {t('portfolioForm.cancel')}
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          className="flex-1 bg-[#535146] hover:bg-[#535146]/90"
        >
          <Check className="w-4 h-4 mr-2" />
          {t('portfolioForm.saveItem')}
        </Button>
      </div>
      </CardContent>
    </Card>
  );
}
