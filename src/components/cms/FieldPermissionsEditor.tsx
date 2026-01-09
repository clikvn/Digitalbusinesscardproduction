import React, { useState } from 'react';
import { FieldPermissionLevel, EmployeeWithDetails } from '../../types/database';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  Building2,
  Briefcase,
  Loader2,
  Users
} from 'lucide-react';

interface FieldPermissionsEditorProps {
  currentPermissions: Record<string, FieldPermissionLevel>;
  filteredEmployees: EmployeeWithDetails[];
  allEmployees: EmployeeWithDetails[];
  onSave: (permissions: Record<string, FieldPermissionLevel>, employeeIds?: string[]) => Promise<void>;
  onCancel: () => void;
}

// Define company-related fields that business owners can control
// Note: Employee personal information (avatar, social, bio, contact, profile, portfolio) 
// is always controlled by the employee and cannot be restricted by business owners.
const FIELD_GROUPS = [
  {
    id: 'company',
    label: 'Company Information',
    icon: Building2,
    fields: [
      { path: 'personal.businessName', label: 'Company Name' },
      { path: 'personal.title', label: 'Professional Title' },
    ],
  },
];

const PERMISSION_OPTIONS: { value: FieldPermissionLevel; label: string; description: string }[] = [
  { value: 'editable', label: 'Editable', description: 'Employee can edit this field' },
  { value: 'readonly', label: 'Read Only', description: 'Employee can view but not edit' },
];

/**
 * FieldPermissionsEditor - UI for configuring which fields employees can edit
 */
export function FieldPermissionsEditor({
  currentPermissions,
  filteredEmployees,
  allEmployees,
  onSave,
  onCancel,
}: FieldPermissionsEditorProps) {
  const [permissions, setPermissions] = useState<Record<string, FieldPermissionLevel>>(
    currentPermissions || {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [applyToFiltered, setApplyToFiltered] = useState(false);
  const [applyToAllBusiness, setApplyToAllBusiness] = useState(false);
  
  // Count how many employees will be affected
  const affectedCount = applyToAllBusiness 
    ? allEmployees.length 
    : applyToFiltered 
      ? filteredEmployees.length 
      : 1;
  
  // Handle checkbox changes - make them mutually exclusive
  const handleApplyToFilteredChange = (checked: boolean) => {
    setApplyToFiltered(checked);
    if (checked) {
      setApplyToAllBusiness(false);
    }
  };
  
  const handleApplyToAllBusinessChange = (checked: boolean) => {
    setApplyToAllBusiness(checked);
    if (checked) {
      setApplyToFiltered(false);
    }
  };

  const handlePermissionChange = (fieldPath: string, value: FieldPermissionLevel) => {
    setPermissions(prev => {
      const newPermissions = { ...prev };
      if (value === 'editable') {
        // Remove from permissions if editable (default)
        delete newPermissions[fieldPath];
      } else {
        newPermissions[fieldPath] = value;
      }
      return newPermissions;
    });
  };

  const getPermission = (fieldPath: string): FieldPermissionLevel => {
    return permissions[fieldPath] || 'editable';
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const employeeIds = applyToAllBusiness
        ? allEmployees.map(emp => emp.employee_user_id)
        : applyToFiltered
          ? filteredEmployees.map(emp => emp.employee_user_id)
          : undefined;
      await onSave(permissions, employeeIds);
    } finally {
      setIsSaving(false);
    }
  };

  const getPermissionBadgeColor = (permission: FieldPermissionLevel): string => {
    switch (permission) {
      case 'editable':
        return 'bg-green-100 text-green-700';
      case 'readonly':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-zinc-100 text-zinc-700';
    }
  };

  // Count non-editable fields
  const restrictedCount = Object.keys(permissions).length;

  return (
    <div className="flex flex-col gap-3 sm:gap-4 overflow-hidden" style={{ maxHeight: 'calc(100dvh - 8rem)' }}>
      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 sm:space-y-4 pr-1">
        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900">
              Company Information Permissions
            </p>
            <p className="text-xs sm:text-sm text-blue-700">
              Configure permissions for company-related fields only. Employee personal information 
              (avatar, social media, bio, contact details, profile, portfolio) is always controlled 
              by the employee and cannot be restricted.
            </p>
            {restrictedCount > 0 && (
              <p className="text-xs sm:text-sm text-blue-600">
                <span className="font-medium">
                  {restrictedCount} field{restrictedCount !== 1 ? 's' : ''} restricted
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Apply to All Options */}
        {(filteredEmployees.length > 1 || allEmployees.length > 1) && (
          <div className="space-y-2">
            {/* Apply to Filtered Employees */}
            {filteredEmployees.length > 1 && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="apply-to-filtered"
                    checked={applyToFiltered}
                    onCheckedChange={(checked) => handleApplyToFilteredChange(checked === true)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-0.5">
                    <Label 
                      htmlFor="apply-to-filtered" 
                      className="text-xs sm:text-sm font-medium text-zinc-900 cursor-pointer flex items-center gap-2"
                    >
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 text-zinc-500" />
                      Apply to all employees in current filter
                    </Label>
                    <p className="text-xs text-zinc-600">
                      This will apply the same permissions to all {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} 
                      {' '}currently shown in the list (after filters).
                    </p>
                    {applyToFiltered && (
                      <p className="text-xs font-medium text-blue-700">
                        ⚠️ {affectedCount} employee{affectedCount !== 1 ? 's' : ''} will be affected
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Apply to All Business Employees */}
            {allEmployees.length > 1 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="apply-to-all-business"
                    checked={applyToAllBusiness}
                    onCheckedChange={(checked) => handleApplyToAllBusinessChange(checked === true)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-0.5">
                    <Label 
                      htmlFor="apply-to-all-business" 
                      className="text-xs sm:text-sm font-medium text-amber-900 cursor-pointer flex items-center gap-2"
                    >
                      <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                      Apply to all employees in business
                    </Label>
                    <p className="text-xs text-amber-700">
                      This will apply the same permissions to all {allEmployees.length} employee{allEmployees.length !== 1 ? 's' : ''} 
                      {' '}in your business, regardless of current filters.
                    </p>
                    {applyToAllBusiness && (
                      <p className="text-xs font-medium text-amber-800">
                        ⚠️ {affectedCount} employee{affectedCount !== 1 ? 's' : ''} will be affected
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Field Groups */}
        <div className="space-y-3">
        {FIELD_GROUPS.map((group) => (
          <div key={group.id} className="space-y-3">
            {/* Group Header */}
            <div className="flex items-center gap-2">
              <group.icon className="h-4 w-4 text-zinc-500" />
              <h4 className="font-medium text-zinc-900">{group.label}</h4>
            </div>

            {/* Fields */}
            <div className="space-y-2 pl-6">
              {group.fields.map((field) => {
                const currentPermission = getPermission(field.path);
                return (
                  <div
                    key={field.path}
                    className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-zinc-200"
                  >
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-normal text-zinc-700">
                        {field.label}
                      </Label>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getPermissionBadgeColor(currentPermission)}`}
                      >
                        {currentPermission}
                      </Badge>
                    </div>
                    <Select
                      value={currentPermission}
                      onValueChange={(value: FieldPermissionLevel) => 
                        handlePermissionChange(field.path, value)
                      }
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERMISSION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="flex-shrink-0 space-y-2 pt-2 border-t border-zinc-200">
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPermissions({})}
            disabled={restrictedCount === 0}
            className="text-xs sm:text-sm"
          >
            Allow All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allReadonly: Record<string, FieldPermissionLevel> = {};
              FIELD_GROUPS.forEach(group => {
                group.fields.forEach(field => {
                  allReadonly[field.path] = 'readonly';
                });
              });
              setPermissions(allReadonly);
            }}
            className="text-xs sm:text-sm"
          >
            Set All Read Only
          </Button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 sm:gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            size="sm"
            className="sm:size-default"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="sm:size-default"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">{(applyToAllBusiness || applyToFiltered) ? `Saving for ${affectedCount} employees...` : 'Saving...'}</span>
                <span className="sm:hidden">Saving...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">{(applyToAllBusiness || applyToFiltered) ? `Save for ${affectedCount} Employees` : 'Save Permissions'}</span>
                <span className="sm:hidden">Save</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
