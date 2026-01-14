import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { getColorClasses, CustomGroup } from "../../utils/custom-groups";
import { DEFAULT_VISIBLE_FIELDS } from "../../utils/group-share-settings";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { GroupDialog } from "./GroupDialog";
import { toast } from "sonner@2.0.3";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useParams } from "react-router-dom";
import { useSettings } from "../../hooks/useSettings";
import { useTranslation } from "react-i18next";

export function GroupConfiguration() {
  const { t } = useTranslation();
  const { userCode } = useParams<{ userCode: string }>();
  const { settings: cloudSettings, customGroups: groups, saveGroups, saveSettings, saveAll } = useSettings(userCode);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CustomGroup | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<CustomGroup | undefined>();
  
  const getShareUrl = (groupId: string): string => {
    const baseUrl = window.location.origin;
    const group = groups.find(g => g.id === groupId);
    const shareCode = group?.shareCode || groupId;
    const code = userCode || 'myclik'; 
    return `${baseUrl}/${code}/${shareCode}`;
  };

  const handleCreate = () => {
    setEditingGroup(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (group: CustomGroup) => {
    setEditingGroup(group);
    setDialogOpen(true);
  };

  // Helper to generate random code
  const generateShareCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters[randomIndex];
    }
    return code;
  };

  const handleSave = async (label: string, description: string, icon: string, color: string, shareCode: string) => {
    const newGroups = [...groups];
    
    if (editingGroup) {
      // Update existing group
      const index = newGroups.findIndex(g => g.id === editingGroup.id);
      if (index !== -1) {
        newGroups[index] = { 
          ...newGroups[index], 
          label, 
          description, 
          icon, 
          color, 
          shareCode 
        };
        
        try {
          await saveGroups(newGroups);
          toast.success(t('groupConfiguration.groupUpdated'));
        } catch (e) {
          // toast handled in hook
          return;
        }
      }
    } else {
      // Check if shareCode exists
      if (shareCode && newGroups.some(g => g.shareCode === shareCode)) {
        toast.error(t('groupConfiguration.shareCodeExists'));
        return;
      }

      // Create new group
      const newGroup: CustomGroup = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        label,
        description,
        icon,
        color,
        isDefault: false,
        createdAt: Date.now(),
        shareCode: shareCode || generateShareCode(),
      };
      
      newGroups.push(newGroup);
      
      try {
        // Initialize settings for new group
        const newSettings = { ...cloudSettings };
        newSettings[newGroup.id] = [...DEFAULT_VISIBLE_FIELDS];
        
        await saveAll(newSettings, newGroups);
        toast.success(t('groupConfiguration.groupCreated'));
      } catch (e) {
        return;
      }
    }
    
    setEditingGroup(undefined);
  };

  const handleDeleteClick = (group: CustomGroup) => {
    if (group.isDefault) {
      toast.error(t('groupConfiguration.defaultGroupsCannotDelete'));
      return;
    }
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (groupToDelete) {
      const newGroups = groups.filter(g => g.id !== groupToDelete.id);
      
      try {
        // Also need to clean up settings for this group
        const newSettings = { ...cloudSettings };
        if (newSettings[groupToDelete.id]) {
          delete newSettings[groupToDelete.id];
          // Use saveAll to atomically update both
          await saveAll(newSettings, newGroups);
        } else {
          await saveGroups(newGroups);
        }
        
        toast.success(t('groupConfiguration.groupDeleted'));
      } catch (e) {
        // error
      }
      
      setGroupToDelete(undefined);
    }
  };

  const handleDeleteFromDialog = async () => {
    if (editingGroup && !editingGroup.isDefault) {
      setGroupToDelete(editingGroup);
      setDeleteDialogOpen(true);
      setDialogOpen(false);
    }
  };

  const getVisibleCount = (groupId: string): number => {
    return cloudSettings[groupId]?.length || 0;
  };

  const renderIcon = (iconName: string, className: string = "w-5 h-5") => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className={className} /> : null;
  };

  return (
    <>
      <div className="space-y-4">
        {/* Add Group Button */}
        <div className="flex justify-end">
          <Button onClick={handleCreate} size="sm" className="shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            {t('groupConfiguration.addGroup')}
          </Button>
        </div>

        {/* Groups List */}
        <div className="space-y-2">
          {groups.map((group) => {
            const colorClasses = getColorClasses(group.color);
            const visibleCount = getVisibleCount(group.id);
            
            return (
              <div
                key={group.id}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 ${colorClasses.bg} ${colorClasses.border} transition-all`}
              >
                {/* Icon */}
                <div className={`${colorClasses.text} shrink-0`}>
                  {renderIcon(group.icon, "w-5 h-5")}
                </div>

                {/* Group Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-medium truncate">{group.label}</h4>
                    <a 
                      href={getShareUrl(group.id)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-mono"
                    >
                      {group.shareCode}
                    </a>
                  </div>
                  <p className="text-xs text-[#71717a] truncate">
                    {group.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleEdit(group)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {!group.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteClick(group)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {groups.length === 0 && (
          <div className="text-center py-8 text-[#71717a]">
            <p className="mb-2">{t('groupConfiguration.noGroupsYet')}</p>
            <Button onClick={handleCreate} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {t('groupConfiguration.createFirstGroup')}
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <GroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        group={editingGroup}
        onSave={handleSave}
        onDelete={handleDeleteFromDialog}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('groupConfiguration.deleteGroup')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('groupConfiguration.deleteGroupDescription', { name: groupToDelete?.label })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('groupConfiguration.deleteGroupAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}