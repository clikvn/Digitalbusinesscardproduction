import React, { useState } from "react";
import { useForm } from "react-hook-form@7.55.0";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ImageUploader } from "./ImageUploader";
import { PortfolioItem, PortfolioCategory } from "../../types/business-card";
import { useTranslation } from "react-i18next";

interface PortfolioItemEditorProps {
  item: PortfolioItem;
  categories: PortfolioCategory[];
  onSave: (item: PortfolioItem) => void;
  onCancel: () => void;
}

export function PortfolioItemEditor({ item, categories, onSave, onCancel }: PortfolioItemEditorProps) {
  const { t } = useTranslation();
  const [currentItem, setCurrentItem] = useState(item);

  const form = useForm({
    defaultValues: item,
    values: currentItem,
  });

  const handleChange = (field: keyof PortfolioItem, value: string | string[]) => {
    setCurrentItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (!currentItem.title.trim()) {
      form.setError('title', { message: t('portfolioForm.titleRequired') });
      return;
    }
    if (!currentItem.images || currentItem.images.length === 0) {
      form.setError('images', { message: t('portfolioForm.imagesRequired') });
      return;
    }
    if (!currentItem.categoryId) {
      form.setError('categoryId', { message: t('portfolioForm.categoryRequired') });
      return;
    }
    onSave(currentItem);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('portfolioForm.title')} *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleChange('title', e.target.value);
                    }}
                    placeholder={t('portfolioForm.projectTitlePlaceholder')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('portfolioForm.category')} *</FormLabel>
                <Select
                  value={currentItem.categoryId}
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleChange('categoryId', value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('portfolioForm.selectCategory')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {t('portfolioForm.noCategoriesAvailable')}
                      </SelectItem>
                    ) : (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t('portfolioForm.chooseCategoryDescription')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('portfolioForm.description')}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleChange('description', e.target.value);
                    }}
                    placeholder={t('portfolioForm.describeProjectPlaceholder')}
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>

      <ImageUploader
        label={`${t('portfolioForm.projectImages')} *`}
        value={currentItem.images || []}
        onChange={(value) => handleChange('images', value)}
        description={t('portfolioForm.uploadImagesDescription')}
        aspectRatio="16/9"
      />

      <div className="flex gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          {t('portfolioForm.cancel')}
        </Button>
        <Button type="button" onClick={handleSubmit} className="flex-1 bg-[#535146] hover:bg-[#535146]/90">
          {t('portfolioForm.saveItem')}
        </Button>
      </div>
    </div>
  );
}
