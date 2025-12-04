import React, { useState } from "react";
import { useForm } from "react-hook-form@7.55.0";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ImageUploader } from "./ImageUploader";
import { AIAssistant } from "./AIAssistant";
import { PortfolioItem, PortfolioCategory } from "../../types/business-card";

interface PortfolioItemEditorProps {
  item: PortfolioItem;
  categories: PortfolioCategory[];
  onSave: (item: PortfolioItem) => void;
  onCancel: () => void;
}

export function PortfolioItemEditor({ item, categories, onSave, onCancel }: PortfolioItemEditorProps) {
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
      form.setError('title', { message: 'Title is required' });
      return;
    }
    if (!currentItem.images || currentItem.images.length === 0) {
      form.setError('images', { message: 'At least one image is required' });
      return;
    }
    if (!currentItem.categoryId) {
      form.setError('categoryId', { message: 'Category is required' });
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
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleChange('title', e.target.value);
                    }}
                    placeholder="Project title"
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
                <FormLabel>Category *</FormLabel>
                <Select
                  value={currentItem.categoryId}
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleChange('categoryId', value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No categories available
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
                  Choose which category this item belongs to
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
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleChange('description', e.target.value);
                    }}
                    placeholder="Describe this project..."
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
        label="Project Images *"
        value={currentItem.images || []}
        onChange={(value) => handleChange('images', value)}
        description="Upload one or more images for this portfolio item"
        aspectRatio="16/9"
      />

      <AIAssistant
        fieldLabel="Description"
        currentValue={currentItem.description}
        onApply={(value) => handleChange('description', value)}
      />

      <div className="flex gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} className="flex-1 bg-[#535146] hover:bg-[#535146]/90">
          Save Item
        </Button>
      </div>
    </div>
  );
}
