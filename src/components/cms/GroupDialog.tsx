import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
import { CustomGroup, GROUP_COLOR_OPTIONS, GROUP_ICON_OPTIONS } from "../../utils/custom-groups";
import { Trash2, Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import * as LucideIcons from "lucide-react";

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: CustomGroup; // If provided, we're editing; otherwise creating
  onSave: (label: string, description: string, icon: string, color: string, shareCode: string, security?: GroupSecurity) => void;
  onDelete?: () => void; // New delete callback
}

export interface GroupSecurity {
  requirePassword: boolean;
  password?: string;
  expiresAt?: number; // timestamp
  maxViews?: number;
  requireApproval: boolean;
}

export function GroupDialog({ open, onOpenChange, group, onSave, onDelete }: GroupDialogProps) {
  const { t } = useTranslation();
  const [label, setLabel] = useState(group?.label || "");
  const [description, setDescription] = useState(group?.description || "");
  const [icon, setIcon] = useState(group?.icon || "Users");
  const [color, setColor] = useState(group?.color || "blue");
  const [shareCode, setShareCode] = useState(group?.shareCode || "");
  
  // Security settings
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [requireApproval, setRequireApproval] = useState(false);

  // Validation state for share code
  const isShareCodeValid = shareCode.trim() !== "" && /^[A-Z0-9]{6,8}$/.test(shareCode);
  const showShareCodeError = shareCode.trim() !== "" && !isShareCodeValid;

  useEffect(() => {
    if (group) {
      setLabel(group.label);
      setDescription(group.description);
      setIcon(group.icon);
      setColor(group.color);
      setShareCode(group.shareCode);
      // Reset security settings when dialog opens
      setRequirePassword(false);
      setPassword("");
      setRequireApproval(false);
    } else {
      setLabel("");
      setDescription("");
      setIcon("Users");
      setColor("blue");
      setShareCode("");
      setRequirePassword(false);
      setPassword("");
      setRequireApproval(false);
    }
  }, [group, open]);

  const handleSave = () => {
    // Validate required fields and share code format
    if (!label.trim() || !shareCode.trim() || !isShareCodeValid) return;
    
    const security: GroupSecurity = {
      requirePassword,
      password: requirePassword ? password : undefined,
      requireApproval,
    };
    
    onSave(label, description, icon, color, shareCode, security);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onOpenChange(false);
    }
  };

  const renderIconPreview = () => {
    const IconComponent = (LucideIcons as any)[icon];
    return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
  };

  const selectedColor = GROUP_COLOR_OPTIONS.find(c => c.value === color) || GROUP_COLOR_OPTIONS[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{group ? t("dialogs.editGroup") : t("dialogs.createNewGroup")}</DialogTitle>
          <DialogDescription>
            {group 
              ? t("dialogs.updateGroupDetails")
              : t("dialogs.createGroupDescription")
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="group-label">{t("dialogs.groupName")} *</Label>
            <Input
              id="group-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("dialogs.groupNamePlaceholder")}
              maxLength={30}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="group-description">{t("dialogs.description")}</Label>
            <Textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("dialogs.descriptionPlaceholder")}
              rows={2}
              maxLength={150}
            />
          </div>

          {/* Share Code */}
          <div className="space-y-2">
            <Label htmlFor="share-code">{t("dialogs.shareCode")} *</Label>
            <div className="relative">
              <Input
                id="share-code"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder={t("dialogs.shareCodePlaceholder")}
                maxLength={8}
                className={`font-mono pr-10 ${
                  showShareCodeError 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : isShareCodeValid 
                    ? 'border-green-500' 
                    : ''
                }`}
              />
              {/* Validation indicator */}
              {shareCode.trim() !== "" && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isShareCodeValid ? (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              )}
            </div>
            
            {/* Help text or error message */}
            {showShareCodeError ? (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {t("dialogs.shareCodeError")}
              </p>
            ) : (
              <p className="text-xs text-[#71717a]">
                {t("dialogs.shareCodeHelp")}
              </p>
            )}
          </div>

          {/* Icon & Color - Compact Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon-select">{t("dialogs.icon")}</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger id="icon-select">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {renderIconPreview()}
                      <span className="text-sm">{icon}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {GROUP_ICON_OPTIONS.map((iconName) => {
                    const IconComponent = (LucideIcons as any)[iconName];
                    return (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center gap-2">
                          {IconComponent && <IconComponent className="w-4 h-4" />}
                          <span>{iconName}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color-select">{t("dialogs.color")}</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger id="color-select">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${selectedColor.bg} ${selectedColor.border} border-2`} />
                      <span className="text-sm">{selectedColor.label}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {GROUP_COLOR_OPTIONS.map((colorOption) => (
                    <SelectItem key={colorOption.value} value={colorOption.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${colorOption.bg} ${colorOption.border} border-2`} />
                        <span>{colorOption.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Security Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#71717a]" />
              <Label className="mb-0">{t("dialogs.securityPrivacy")}</Label>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-900">
                <strong>{t("dialogs.comingSoon")}</strong> {t("dialogs.enhancedPrivacyComingSoon")}
              </AlertDescription>
            </Alert>

            {/* Password Protection */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="password-toggle" className="text-sm">{t("dialogs.requirePassword")}</Label>
                <p className="text-xs text-[#71717a]">{t("dialogs.requirePasswordDescription")}</p>
              </div>
              <Switch
                id="password-toggle"
                checked={requirePassword}
                onCheckedChange={setRequirePassword}
                disabled
              />
            </div>

            {requirePassword && (
              <div className="ml-4 space-y-2">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("dialogs.enterPassword")}
                  disabled
                />
              </div>
            )}

            {/* Require Approval */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="approval-toggle" className="text-sm">{t("dialogs.requireApproval")}</Label>
                <p className="text-xs text-[#71717a]">{t("dialogs.requireApprovalDescription")}</p>
              </div>
              <Switch
                id="approval-toggle"
                checked={requireApproval}
                onCheckedChange={setRequireApproval}
                disabled
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {/* Delete button - only show for non-default groups */}
          {group && !group.isDefault && onDelete && (
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("dialogs.delete")}
            </Button>
          )}
          
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!label.trim() || !shareCode.trim() || !isShareCodeValid}
          >
            {group ? t("dialogs.saveChanges") : t("dialogs.createGroup")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}