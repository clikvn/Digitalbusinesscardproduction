import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Share2 } from "lucide-react";
import { useFieldVisibility } from "../../hooks/useFieldVisibility";
import { getColorClasses } from "../../utils/custom-groups";
import * as LucideIcons from "lucide-react";

interface FieldVisibilityPopoverProps {
  fieldPath: string;
  buttonClassName?: string;
}

export function FieldVisibilityPopover({ fieldPath, buttonClassName = "h-9 px-3" }: FieldVisibilityPopoverProps) {
  const { groups, isFieldVisible, toggleField } = useFieldVisibility();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={buttonClassName}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-3" align="end">
        <div className="space-y-2.5">
          <div className="pb-1">
            <p className="text-xs text-[#71717a] font-medium">Visible to groups:</p>
          </div>
          {groups?.map((group) => {
            const colorClasses = getColorClasses(group.color);
            const IconComponent = (LucideIcons as any)[group.icon];
            
            return (
              <label 
                key={group.id} 
                className="flex items-center gap-2 cursor-pointer hover:bg-[#f4f4f5] p-1.5 rounded transition-colors"
              >
                <Checkbox
                  checked={isFieldVisible(fieldPath, group.id)}
                  onCheckedChange={() => toggleField(fieldPath, group.id)}
                />
                <div className="flex items-center gap-2 flex-1">
                  {IconComponent && (
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${colorClasses.bg}`}>
                      <IconComponent className={`w-3 h-3 ${colorClasses.text}`} />
                    </div>
                  )}
                  <span className="text-sm">{group.label}</span>
                </div>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}