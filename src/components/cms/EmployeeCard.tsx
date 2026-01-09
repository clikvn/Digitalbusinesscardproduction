import React from 'react';
import { EmployeeWithDetails } from '../../types/database';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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
  Hash
} from 'lucide-react';

interface EmployeeCardProps {
  employee: EmployeeWithDetails;
  onToggleActive: () => void;
  onEditPermissions: () => void;
}

/**
 * EmployeeCard - Card component displaying employee info with actions
 */
export function EmployeeCard({
  employee,
  onToggleActive,
  onEditPermissions,
}: EmployeeCardProps) {
  // Get initials for avatar
  const getInitials = (name: string | null): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className={`transition-opacity ${!employee.is_active ? 'opacity-60' : ''}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          {/* Avatar */}
          <Avatar className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium text-sm">
              {getInitials(employee.employee_name)}
            </AvatarFallback>
          </Avatar>

          {/* Employee Info - Wraps on mobile, row on desktop */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Name & Status */}
            <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <h4 className="font-medium text-zinc-900 truncate text-sm sm:text-base">
                {employee.employee_name || 'Unnamed Employee'}
              </h4>
              <Badge 
                variant={employee.is_active ? 'default' : 'secondary'}
                className={`text-xs flex items-center gap-1.5 flex-shrink-0 ${employee.is_active 
                  ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                  : 'bg-red-100 text-red-700 hover:bg-red-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${employee.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {employee.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Email - Visible on all screens */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-500 min-w-0 max-w-full sm:max-w-[200px] lg:max-w-[250px]">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{employee.user_email}</span>
            </div>

            {/* Role - Visible on all screens */}
            {employee.role && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-600 min-w-0 max-w-[150px] sm:max-w-[150px] lg:max-w-[180px]">
                <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{employee.role}</span>
              </div>
            )}

            {/* Department - Visible on all screens */}
            {employee.department && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-600 min-w-0 max-w-[150px] sm:max-w-[150px] lg:max-w-[180px]">
                <Building className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{employee.department}</span>
              </div>
            )}

            {/* Employee Code - Visible on tablet+ */}
            {employee.employee_code && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-600 font-mono min-w-0 max-w-[100px] xl:max-w-[120px]">
                <Hash className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{employee.employee_code}</span>
              </div>
            )}

            {/* Created Date - Visible on tablet+ */}
            <div className="hidden sm:flex items-center text-xs text-zinc-400 flex-shrink-0 ml-auto sm:ml-0">
              <span>{formatDate(employee.created_at)}</span>
            </div>

            {/* User Code - Visible on desktop+ */}
            {employee.user_code && (
              <div className="hidden lg:flex items-center text-xs font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded flex-shrink-0">
                {employee.user_code}
              </div>
            )}
          </div>

          {/* Actions Menu */}
          <div className="flex-shrink-0 self-end sm:self-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                  <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 sm:w-56">
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
                        View Profile
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Edit Permissions */}
                <DropdownMenuItem onClick={onEditPermissions} className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Permissions
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Toggle Active */}
                <DropdownMenuItem 
                  onClick={onToggleActive}
                  className={`cursor-pointer ${employee.is_active ? 'text-red-600 focus:text-red-600' : ''}`}
                >
                  {employee.is_active ? (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
