import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { TabsTrigger } from "../ui/tabs";
import { PortfolioCategory } from "../../types/business-card";

interface SortableCategoryTabProps {
  category: PortfolioCategory;
  onEdit: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function SortableCategoryTab({ category, onEdit, onDelete }: SortableCategoryTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group flex items-center ml-4"
    >
      <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-md shadow-lg border border-gray-200 z-50 px-[8px] p-[4px]">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing h-6 w-6 flex items-center justify-center hover:bg-gray-100 rounded"
        >
          <GripVertical className="w-3 h-3" />
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-gray-100"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(category.id, category.name);
          }}
        >
          <Pencil className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-gray-100 hover:text-red-600"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(category.id);
          }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      <TabsTrigger value={category.id} className="data-[state=active]:bg-white">
        {category.name}
      </TabsTrigger>
    </div>
  );
}
