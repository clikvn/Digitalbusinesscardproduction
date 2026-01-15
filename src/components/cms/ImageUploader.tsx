import React, { useRef, useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Upload, X, Image as ImageIcon, GripVertical } from "lucide-react";
import { validateImageFile } from "../../utils/file-utils";
import { toast } from "sonner@2.0.3";
import { api } from "../../lib/api";
import { getUserCode } from "../../utils/user-code";
import { useTranslation } from "react-i18next";

interface ImageUploaderProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  aspectRatio?: string;
  description?: string;
}

interface SortableImageItemProps {
  id: string;
  img: string;
  index: number;
  total: number;
  label: string;
  aspectRatio?: string;
  onRemove: (index: number) => void;
}

function SortableImageItem({ id, img, index, total, label, aspectRatio, onRemove }: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      <img
        src={img}
        alt={`${label} ${index + 1}`}
        className="w-full h-32 object-cover rounded-lg border-2 border-[#535146]/20"
        style={aspectRatio ? { aspectRatio } : undefined}
      />
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 h-6 w-6 bg-black/60 rounded flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-3 h-3 text-white" />
      </div>
      {/* Remove Button */}
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => onRemove(index)}
        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </Button>
      {/* Image Counter */}
      <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
        {index + 1}/{total}
      </div>
    </div>
  );
}

export function ImageUploader({ label, value, onChange, aspectRatio, description }: ImageUploaderProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    const newImages: string[] = [];
    let hasError = false;
    const userCode = getUserCode();

    for (const file of files) {
      const error = validateImageFile(file);
      if (error) {
        toast.error(t('imageUploader.fileError', { fileName: file.name, error }));
        hasError = true;
        continue;
      }

      try {
        const { url } = await api.storage.upload(userCode, file);
        newImages.push(url);
      } catch (error: any) {
        toast.error(t('imageUploader.failedToUpload', { 
          fileName: file.name, 
          error: error.message || t('imageUploader.unknownError', 'Unknown error') 
        }));
        console.error(error);
        hasError = true;
      }
    }

    if (newImages.length > 0) {
      onChange([...value, ...newImages]);
      if (!hasError) {
        toast.success(t('imageUploader.imagesUploadedSuccess', { 
          count: newImages.length,
          plural: newImages.length > 1 ? 's' : ''
        }));
      }
    }

    setIsUploading(false);
    
    // Reset input to allow re-uploading the same files
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const newImages = value.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleRemoveAll = () => {
    onChange([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = value.findIndex((_, i) => `image-${i}` === active.id);
      const newIndex = value.findIndex((_, i) => `image-${i}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(value, oldIndex, newIndex));
      }
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <div className="space-y-2">
        {value.length > 0 ? (
          <div className="space-y-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={value.map((_, i) => `image-${i}`)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 gap-2">
                  {value.map((img, index) => (
                    <SortableImageItem
                      key={`image-${index}`}
                      id={`image-${index}`}
                      img={img}
                      index={index}
                      total={value.length}
                      label={label}
                      aspectRatio={aspectRatio}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? t('imageUploader.uploading') : t('imageUploader.addMoreImages')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleRemoveAll}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4 mr-1" />
                {t('imageUploader.removeAll')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 border-2 border-dashed border-[#535146]/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#535146]/40 hover:bg-[#e9e6dc]/20 transition-colors"
              style={aspectRatio ? { aspectRatio } : undefined}
            >
              <ImageIcon className="w-12 h-12 text-[#535146]/30 mb-2" />
              <p className="text-sm text-[#535146] text-center">{t('imageUploader.clickToUpload')}</p>
              <p className="text-sm text-[#535146]">{t('imageUploader.selectMultiple')}</p>
              <p className="text-xs text-[#535146]/40 mt-1">{t('imageUploader.fileFormats')}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? t('imageUploader.uploading') : t('imageUploader.chooseImages')}
            </Button>
          </>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      
      {description && <p className="text-xs text-[#535146]/60">{description}</p>}
    </div>
  );
}
