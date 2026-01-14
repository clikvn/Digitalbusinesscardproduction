import React from 'react';
import { EmployeeWithDetails } from '../../types/database';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  MoreVertical,
  UserCheck,
  UserX,
  Settings,
  ExternalLink,
  Mail,
  Building,
  Briefcase,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EmployeeListItemProps {
  employee: EmployeeWithDetails;
  onToggleActive: () => void;
  onEdit: () => void;
  onEditPermissions: () => void;
}

/**
 * EmployeeListItem - Row-based employee display following ShareStep1 contact list style
 */
export function EmployeeListItem({
  employee,
  onToggleActive,
  onEdit,
  onEditPermissions,
}: EmployeeListItemProps) {
  const { t } = useTranslation();
  // Get initials for avatar
  const getInitials = (name: string | null): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Build subtitle from role/department/email
  const getSubtitle = (): string => {
    const parts: string[] = [];
    if (employee.role) parts.push(employee.role);
    if (employee.department) parts.push(employee.department);
    if (parts.length === 0 && employee.user_email) {
      return employee.user_email;
    }
    return parts.join(' • ') || employee.user_email || '';
  };

  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full rounded-lg hover:bg-muted transition-colors p-2 -m-2">
      {/* Contact Info - Click to Edit */}
      <button
        onClick={onEdit}
        className="flex gap-[16px] items-center flex-1 text-left min-w-0"
      >
        <div className="relative rounded-[100px] shrink-0 size-[40px]">
          <div className={`absolute inset-0 ${!employee.is_active ? 'opacity-50 grayscale-[0.5]' : ''}`}>
            {employee.avatar_url ? (
              <img
                src={employee.avatar_url}
                alt={employee.employee_name || ''}
                className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[100px] size-full"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 text-zinc-400 rounded-[100px]">
                <Users className="size-5" />
              </div>
            )}
          </div>
          {/* Status badge - Active/Inactive indicator */}
          <div 
            className={`absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-background z-20 shadow-sm ${
              employee.is_active ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
            }`}
            style={{
              backgroundColor: employee.is_active ? '#22c55e' : '#ef4444',
              filter: 'none',
              opacity: 1
            }}
            aria-label={employee.is_active ? t('employeeListItem.active') : t('employeeListItem.inactive')}
            title={employee.is_active ? t('employeeListItem.activeEmployee') : t('employeeListItem.inactiveEmployee')}
          />
        </div>
        <div className={`basis-0 content-stretch flex flex-col grow items-start justify-center min-h-px min-w-px not-italic relative shrink-0 text-foreground text-left ${!employee.is_active ? 'opacity-50' : ''}`}>
          <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 w-full">
            <p className="leading-[24px]">
              {employee.employee_name || employee.user_email || t('employeeListItem.unnamedEmployee')}
            </p>
          </div>
          <p className="[white-space-collapse:collapse] font-['Inter:Regular',sans-serif] font-normal leading-[24px] overflow-ellipsis overflow-hidden relative shrink-0 text-nowrap w-full">
            {getSubtitle()}
          </p>
        </div>
      </button>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center justify-center size-8 rounded-full hover:bg-background/80 transition-all shrink-0 active:scale-95"
            aria-label={t('employeeListItem.employeeActions')}
          >
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* View Profile */}
          {employee.user_code && (
            <>
              <DropdownMenuItem asChild>
                <a
                  href={`/${employee.user_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t('employeeListItem.viewProfile')}
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Edit Permissions */}
          <DropdownMenuItem onClick={onEditPermissions} className="cursor-pointer">
            <Settings className="h-4 w-4 mr-2" />
            {t('employeeListItem.editPermissions')}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Toggle Active */}
          <DropdownMenuItem
            onClick={onToggleActive}
            className={`cursor-pointer ${employee.is_active ? 'text-red-600 focus:text-red-600' : 'text-green-600 focus:text-green-600'}`}
          >
            {employee.is_active ? (
              <>
                <UserX className="h-4 w-4 mr-2" />
                {t('employeeListItem.deactivate')}
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                {t('employeeListItem.activate')}
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
