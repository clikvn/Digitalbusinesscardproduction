import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { GripVertical, Edit, Copy, Trash2, Image, Video, Globe } from "lucide-react";
import { PortfolioItem } from "../../types/business-card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";

interface SortablePortfolioItemProps {
  item: PortfolioItem;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: PortfolioItem) => void;
}

export function SortablePortfolioItem({ item, onEdit, onDelete, onDuplicate }: SortablePortfolioItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none',
  };

  const getTypeIcon = () => {
    switch (item.type) {
      case 'images':
        return <Image className="w-4 h-4 text-[#535146]/60" />;
      case 'video':
        return <Video className="w-4 h-4 text-[#535146]/60" />;
      case 'virtual-tour':
        return <Globe className="w-4 h-4 text-[#535146]/60" />;
      default:
        return <Image className="w-4 h-4 text-[#535146]/60" />;
    }
  };

  const getThumbnail = () => {
    if (item.type === 'images' && item.images && item.images.length > 0) {
      return (
        <div className="relative">
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-16 h-16 object-cover rounded"
          />
          {item.images.length > 1 && (
            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
              {item.images.length}
            </div>
          )}
        </div>
      );
    }
    
    // For video and virtual tour, show icon placeholder
    return (
      <div className="w-16 h-16 flex items-center justify-center bg-[#f4f4f5] rounded">
        {getTypeIcon()}
      </div>
    );
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="border-[#e4e4e7] shadow-sm hover:shadow-md transition-shadow"
    >
      <CardContent className="py-[8px] p-[8px]">
        <div className="flex items-start gap-3 pt-[8px] pr-[0px] pb-[0px] pl-[8px]">
          <div className="flex flex-col gap-1">
            {getThumbnail()}
            <p className="text-xs text-[#535146]/60 text-center">
              {item.type === 'images' && 'Images'}
              {item.type === 'video' && 'Video'}
              {item.type === 'virtual-tour' && 'Virtual Tour'}
            </p>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-[#535146] truncate">
              {item.title || "Untitled"}
            </h4>
            {item.description && (
              <p className="text-sm text-[#535146]/60 line-clamp-2 mt-1">
                {item.description}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1 flex-shrink-0">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-[#e9e6dc]/30 rounded transition-colors"
              style={{ touchAction: 'none' }}
            >
              <GripVertical className="w-5 h-5 text-[#535146]/40" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(item)}
              className="h-8 w-8 px-[8px] py-[0px]"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 px-[8px] py-[0px]">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Portfolio Item?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete "{item.title || 'this item'}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(item.id)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
