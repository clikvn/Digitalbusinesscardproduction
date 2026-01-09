import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useBusinessManagement } from '../../hooks/useBusinessManagement';
import { EmployeeWithDetails } from '../../types/database';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import {
  Users,
  Plus,
  RefreshCw,
  Building2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { AddEmployeeForm } from './AddEmployeeForm';
import { EditEmployeeForm } from './EditEmployeeForm';
import { EmployeeListItem } from './EmployeeListItem';
import { FieldPermissionsEditor } from './FieldPermissionsEditor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Badge } from '../ui/badge';
import { Building, Check, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { getUserCode } from '../../utils/user-code';
import { api } from '../../lib/api';
import { validateImageFile } from '../../utils/file-utils';
import { supabase } from '../../lib/supabase-client';

/**
 * EmployeeManager - Main component for business owners to manage employees
 * UI Style: Adapted from ShareStep1/ShareManager contact list
 * Features:
 * - List all employees with status
 * - Create new employee accounts
 * - Toggle active/inactive
 * - Configure field permissions
 */
export function EmployeeManager() {
  const {
    isBusinessOwner,
    employees,
    isLoading,
    isLoadingEmployees,
    refetchEmployees,
    toggleEmployeeActive,
    updateFieldPermissions,
  } = useBusinessManagement();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithDetails | null>(null);
  const [showPermissionsEditor, setShowPermissionsEditor] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [businessOwnerBusinessName, setBusinessOwnerBusinessName] = useState<string>('');
  const [businessOwnerAddress, setBusinessOwnerAddress] = useState<string>('');
  const [businessOwnerBio, setBusinessOwnerBio] = useState<string>('');
  const [brandLogo, setBrandLogo] = useState<string>('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showLogoUploadConfirm, setShowLogoUploadConfirm] = useState(false);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);

  // Load business owner's business name and logo
  useEffect(() => {
    const loadBusinessOwnerData = async () => {
      if (isBusinessOwner) {
        try {
          const userCode = getUserCode();
          if (userCode) {
            // Load business card data (includes logo_url from transformer)
            const businessCard = await api.card.get(userCode);
            if (businessCard) {
              if (businessCard.personal.businessName) {
                setBusinessOwnerBusinessName(businessCard.personal.businessName);
              }
              if (businessCard.contact?.address) {
                setBusinessOwnerAddress(businessCard.contact.address);
              }
              if (businessCard.personal.bio) {
                setBusinessOwnerBio(businessCard.personal.bio);
              }
            }
            
            // Always load logo_url directly from database (bypasses cache)
            const { data: dbCard, error: logoError } = await supabase
              .from('business_cards')
              .select('logo_url')
              .eq('user_code', userCode)
              .maybeSingle();
            
            if (logoError) {
              console.error('Error loading logo:', logoError);
            } else if (dbCard?.logo_url) {
              setBrandLogo(dbCard.logo_url);
            } else {
              // Clear logo if none exists
              setBrandLogo('');
            }
          }
        } catch (error) {
          console.error('Error loading business owner data:', error);
        }
      }
    };
    loadBusinessOwnerData();
  }, [isBusinessOwner, employees.length]); // Reload when employees list changes (indicates tab is active)

  // Get unique departments from employees
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    employees.forEach(emp => {
      if (emp.department && emp.department.trim()) {
        deptSet.add(emp.department.trim());
      }
    });
    return Array.from(deptSet).sort();
  }, [employees]);

  // Filter employees based on search, status, and department
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    // Filter by status
    if (selectedStatus === 'active') {
      filtered = filtered.filter(e => e.is_active);
    } else if (selectedStatus === 'inactive') {
      filtered = filtered.filter(e => !e.is_active);
    }

    // Filter by departments (multi-select)
    if (selectedDepartments.length > 0) {
      filtered = filtered.filter(e => e.department && selectedDepartments.includes(e.department));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        e =>
          e.employee_name?.toLowerCase().includes(query) ||
          e.user_email?.toLowerCase().includes(query) ||
          e.role?.toLowerCase().includes(query) ||
          e.department?.toLowerCase().includes(query) ||
          e.employee_code?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [employees, selectedStatus, selectedDepartments, searchQuery]);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollFilters = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 120;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const targetScroll = direction === 'left'
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });

      setTimeout(updateScrollButtons, 300);
    }
  };

  // Don't render if user is not a business owner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isBusinessOwner) {
    return (
      <Card className="border-dashed border-border">
        <CardContent className="py-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Business Plan Required</h3>
          <p className="text-sm text-muted-foreground">
            Upgrade to a Business Plan to manage employee accounts.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleToggleActive = async (employee: EmployeeWithDetails) => {
    try {
      await toggleEmployeeActive({
        employeeUserId: employee.employee_user_id,
        isActive: !employee.is_active,
      });
      toast.success(
        employee.is_active
          ? `${employee.employee_name || 'Employee'} has been deactivated`
          : `${employee.employee_name || 'Employee'} has been activated`
      );
    } catch (error: any) {
      toast.error(`Failed to update employee status: ${error.message}`);
    }
  };

  const handleEditEmployee = (employee: EmployeeWithDetails) => {
    setSelectedEmployee(employee);
    setShowEditForm(true);
  };

  const handleEditPermissions = (employee: EmployeeWithDetails) => {
    setSelectedEmployee(employee);
    setShowPermissionsEditor(true);
  };

  const handleSavePermissions = async (
    permissions: Record<string, 'editable' | 'readonly'>,
    employeeIds?: string[]
  ) => {
    if (!selectedEmployee && !employeeIds) return;

    try {
      const targetEmployeeIds = employeeIds || [selectedEmployee!.employee_user_id];
      const totalCount = targetEmployeeIds.length;

      // Check if businessName or title are being set to readonly
      const businessNameReadonly = permissions['personal.businessName'] === 'readonly';
      const titleReadonly = permissions['personal.title'] === 'readonly';
      const needsRepopulation = businessNameReadonly || titleReadonly;

      // Get business owner's business name if we need to repopulate
      let businessOwnerBusinessName = '';
      if (needsRepopulation && businessNameReadonly) {
        try {
          const userCode = getUserCode();
          if (userCode) {
            const businessOwnerCard = await api.card.get(userCode);
            if (businessOwnerCard) {
              businessOwnerBusinessName = businessOwnerCard.personal.businessName || '';
            }
          }
        } catch (error) {
          console.warn('Could not load business owner card data:', error);
        }
      }

      // Update permissions for all target employees in the database
      const updatePromises = targetEmployeeIds.map(employeeUserId =>
        updateFieldPermissions({
          employeeUserId,
          permissions,
        })
      );

      // Wait for all permission updates to complete
      await Promise.all(updatePromises);

      // If fields are set to readonly, repopulate them
      if (needsRepopulation) {
        const repopulatePromises = targetEmployeeIds.map(async (employeeUserId) => {
          try {
            // Find employee's user_code and role from business_management
            const employee = employees.find(emp => emp.employee_user_id === employeeUserId);
            if (employee?.user_code) {
              // Get current employee card
              const employeeCard = await api.card.get(employee.user_code);
              if (employeeCard) {
                // Update with business owner's business name and employee's role as title
                const updatedCard = {
                  ...employeeCard,
                  personal: {
                    ...employeeCard.personal,
                    ...(businessNameReadonly && businessOwnerBusinessName ? { businessName: businessOwnerBusinessName } : {}),
                    ...(titleReadonly && employee.role ? { title: employee.role } : {}),
                  },
                };
                
                // Update employee card
                await api.business.updateEmployeeCard(employee.user_code, updatedCard);
              }
            }
          } catch (error) {
            console.warn(`Could not repopulate card for employee ${employeeUserId}:`, error);
            // Don't throw - permission update succeeded, repopulation is secondary
          }
        });

        await Promise.all(repopulatePromises);
      }

      // Refresh the employee list to show updated permissions
      await refetchEmployees();

      toast.success(
        totalCount === 1
          ? 'Field permissions updated successfully'
          : `Field permissions updated for ${totalCount} employees`
      );
      setShowPermissionsEditor(false);
      setSelectedEmployee(null);
    } catch (error: any) {
      console.error('Error updating field permissions:', error);
      toast.error(`Failed to update permissions: ${error.message}`);
    }
  };

  const handleEmployeeCreated = () => {
    setShowAddForm(false);
    refetchEmployees();
  };

  const handleEmployeeUpdated = () => {
    setShowEditForm(false);
    setSelectedEmployee(null);
    refetchEmployees();
  };

  const handleLogoClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Validate file first
        const error = validateImageFile(file);
        if (error) {
          toast.error(error);
          return;
        }
        // Show confirmation dialog
        setPendingLogoFile(file);
        setShowLogoUploadConfirm(true);
      }
    };
    input.click();
  };

  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    setShowLogoUploadConfirm(false);
    try {
      const userCode = getUserCode();
      if (!userCode) {
        throw new Error('User code not found');
      }

      // Upload logo
      const { url } = await api.storage.upload(userCode, file);
      
      // Update logo_url column in database
      const { error: updateError } = await supabase
        .from('business_cards')
        .update({ logo_url: url })
        .eq('user_code', userCode);
      
      if (updateError) {
        throw updateError;
      }
      
      // Update state immediately
      setBrandLogo(url);
      toast.success('Brand logo uploaded successfully');
      setPendingLogoFile(null);
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(`Failed to upload logo: ${error.message}`);
      setPendingLogoFile(null);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const activeCount = employees.filter(e => e.is_active).length;
  const inactiveCount = employees.filter(e => !e.is_active).length;

  // Status filter cards config
  const statusFilters = [
    {
      id: 'all' as const,
      label: 'All',
      count: employees.length,
      icon: Users,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
    },
    {
      id: 'active' as const,
      label: 'Active',
      count: activeCount,
      icon: UserCheck,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
    },
    {
      id: 'inactive' as const,
      label: 'Inactive',
      count: inactiveCount,
      icon: UserX,
      bgColor: 'bg-zinc-50',
      borderColor: 'border-zinc-200',
      textColor: 'text-zinc-600',
    },
  ];

  return (
    <div className="bg-background content-stretch flex flex-col items-start relative size-full overflow-hidden">
      {/* Employee Management Content */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start px-[0px] w-full px-[0px] py-[16px]">

          {/* Business Info Container - Logo, Title, Address, and Bio */}
          <div className="w-full flex flex-col gap-4 py-4 px-4 bg-white rounded-lg border border-zinc-200 shadow-sm">
            {/* First Row: Logo, Title, and Address */}
            <div className="w-full flex flex-row items-center gap-6">
              {/* Logo */}
              <div className="flex-shrink-0">
                <div className="relative group">
                  {brandLogo ? (
                    <button
                      onClick={handleLogoClick}
                      className="relative cursor-pointer group"
                      title="Click to change logo"
                    >
                      <img
                        src={brandLogo}
                        alt="Brand Logo"
                        className="h-16 max-w-[150px] object-contain transition-opacity group-hover:opacity-80"
                        style={{ maxWidth: '150px', width: 'auto', height: '64px' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                        <Upload className="h-5 w-5 text-white" />
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={handleLogoClick}
                      disabled={isUploadingLogo}
                      className="flex flex-col items-center justify-center gap-2 size-[80px] border-2 border-dashed border-zinc-300 rounded-lg hover:border-primary hover:bg-zinc-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isUploadingLogo ? (
                        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                      ) : (
                        <>
                          <ImageIcon className="h-5 w-5 text-zinc-400" />
                          <span className="text-xs text-zinc-500">Upload Logo</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Title and Address Container - Responsive: address below title when screen < 1000px */}
              <div className="flex-1 flex flex-col min-[1000px]:flex-row min-[1000px]:items-center gap-2 min-[1000px]:gap-6 min-w-0">
                {/* Title */}
                {businessOwnerBusinessName && (
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-semibold text-foreground">
                      {businessOwnerBusinessName}
                    </h1>
                  </div>
                )}

                {/* Address */}
                {businessOwnerAddress && (
                  <div className="text-sm text-muted-foreground min-w-0">
                    <span className="break-words">{businessOwnerAddress}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Header Text */}
          <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-muted-foreground text-center w-full">
            <p className="leading-[20px]">
              Manage your team's digital business cards or{' '}
              <button
                onClick={() => setShowAddForm(true)}
                className="underline hover:text-foreground transition-colors"
              >
                Add new employee
              </button>
              {' '}to your team
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-background box-border content-stretch flex flex-col gap-2 relative rounded-[12px] shrink-0 w-full py-[8px] px-[12px] py-[4px]">
            <div aria-hidden="true" className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[12px]" />
            
            {/* Search Input Row */}
            <div className="flex gap-[8px] items-center relative">
              <div className="basis-0 grow h-[39px] min-h-px min-w-px relative shrink-0">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-[39px] items-center overflow-clip px-0 relative rounded-[inherit] w-full px-[0px] py-[8px] py-[4px]">
                  <Search className="w-[20px] h-[20px] text-foreground" strokeWidth={1.5} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="flex-1 bg-transparent outline-none font-['Inter:Medium',sans-serif] font-medium text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              {(searchQuery || selectedDepartments.length > 0) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDepartments([]);
                  }}
                  className="p-1 hover:bg-muted/50 rounded-full transition-colors shrink-0"
                  aria-label="Clear filters"
                >
                  <X className="size-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <button 
                    className={`relative shrink-0 size-[20px] hover:opacity-70 transition-opacity ${selectedDepartments.length > 0 ? 'text-primary' : ''}`}
                    aria-label="Filter by department"
                  >
                    <Filter className="w-[20px] h-[20px] text-foreground" strokeWidth={1.5} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <div className="space-y-1">
                    <div className="px-2 py-1.5 text-sm font-semibold text-foreground">Filter by Department</div>
                    {departments.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No departments</div>
                    ) : (
                      departments.map((dept) => {
                        const isSelected = selectedDepartments.includes(dept);
                        return (
                          <button
                            key={dept}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedDepartments(prev => prev.filter(d => d !== dept));
                              } else {
                                setSelectedDepartments(prev => [...prev, dept]);
                              }
                            }}
                            className={`w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors flex items-center gap-2 ${
                              isSelected ? 'bg-accent font-medium' : ''
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-primary border-primary' : 'border-border'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            <Building className="w-4 h-4 shrink-0" />
                            <span className="truncate flex-1">{dept}</span>
                          </button>
                        );
                      })
                    )}
                    {selectedDepartments.length > 0 && (
                      <div className="pt-2 border-t">
                        <button
                          onClick={() => {
                            setSelectedDepartments([]);
                          }}
                          className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors text-muted-foreground"
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Selected Department Tags */}
            {selectedDepartments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-2">
                {selectedDepartments.map((dept) => (
                  <Badge
                    key={dept}
                    variant="secondary"
                    className="flex items-center gap-1.5 px-2 py-1 text-xs"
                  >
                    <Building className="w-3 h-3" />
                    <span>{dept}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDepartments(prev => prev.filter(d => d !== dept));
                      }}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                      aria-label={`Remove ${dept} filter`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter Cards with Chevron Navigation */}
          <div className="relative w-full">
            {/* Left Chevron */}
            {canScrollLeft && (
              <button
                onClick={() => scrollFilters('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-muted p-2 rounded-lg shadow-sm transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" strokeWidth={2} />
              </button>
            )}

            {/* Scrollable Container */}
            <div
              ref={scrollContainerRef}
              onScroll={updateScrollButtons}
              className="flex gap-[8px] items-stretch overflow-x-auto scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {statusFilters.map(filter => {
                const IconComponent = filter.icon;
                const isActive = selectedStatus === filter.id;

                return (
                  <button
                    key={filter.id}
                    onClick={(e) => {
                      setSelectedStatus(selectedStatus === filter.id ? 'all' : filter.id);
                      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }}
                    className={`box-border content-stretch flex flex-col items-start p-[12px] relative rounded-[12px] shrink-0 w-[100px] h-[70px] transition-all ${isActive ? 'ring-2 ring-inset ring-primary' : ''
                      } ${filter.bgColor} ${filter.borderColor} border-2`}
                  >
                    {/* Icon and Title Row */}
                    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full">
                      <IconComponent className={`w-4 h-4 ${filter.textColor} shrink-0`} />
                      <div className={`flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 ${filter.textColor} text-xs`}>
                        <p className="leading-[20px] truncate">{filter.label}</p>
                      </div>
                    </div>
                    {/* Count */}
                    <div className="h-[32px] relative shrink-0 w-full">
                      <div className="absolute bottom-0 flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] left-0 not-italic text-foreground text-nowrap top-0 tracking-[-0.144px]">
                        <p className="leading-[32px] whitespace-pre">{filter.count}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Chevron */}
            {canScrollRight && (
              <button
                onClick={() => scrollFilters('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-muted p-2 rounded-lg shadow-sm transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5 text-foreground" strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Employee List */}
          <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full mt-4">
            {filteredEmployees.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground w-full">
                {searchQuery ? (
                  <div className="flex flex-col items-center">
                    <Search className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-[15px] font-medium">No results found matching your search</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-primary text-sm font-bold mt-2 hover:underline"
                    >
                      Clear search
                    </button>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="flex flex-col items-center px-6">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Employees Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-[240px]">
                      Start building your team by adding your first employee.
                    </p>
                    <Button onClick={() => setShowAddForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Employee
                    </Button>
                  </div>
                ) : (
                  <p className="text-[15px] font-medium text-muted-foreground">No employees in this category</p>
                )}
              </div>
            ) : (
              filteredEmployees.map((employee) => (
                <EmployeeListItem
                  key={employee.id}
                  employee={employee}
                  onToggleActive={() => handleToggleActive(employee)}
                  onEdit={() => handleEditEmployee(employee)}
                  onEditPermissions={() => handleEditPermissions(employee)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Employee Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <AddEmployeeForm
            onSuccess={handleEmployeeCreated}
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <EditEmployeeForm
              employee={selectedEmployee}
              onSuccess={handleEmployeeUpdated}
              onCancel={() => {
                setShowEditForm(false);
                setSelectedEmployee(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Field Permissions Dialog */}
      <Dialog open={showPermissionsEditor} onOpenChange={setShowPermissionsEditor}>
        <DialogContent className="sm:max-w-[600px] max-h-[calc(100dvh-2rem)] sm:max-h-[80vh] overflow-hidden flex flex-col p-4 sm:p-6">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-base sm:text-lg pr-6">
              Edit Permissions{selectedEmployee?.employee_name ? ` - ${selectedEmployee.employee_name}` : ''}
            </DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <FieldPermissionsEditor
              currentPermissions={selectedEmployee.field_permissions}
              filteredEmployees={filteredEmployees}
              allEmployees={employees}
              onSave={handleSavePermissions}
              onCancel={() => {
                setShowPermissionsEditor(false);
                setSelectedEmployee(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Logo Upload Confirmation Dialog */}
      <AlertDialog open={showLogoUploadConfirm} onOpenChange={setShowLogoUploadConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upload New Logo</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to upload a new logo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingLogoFile(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingLogoFile) {
                  handleLogoUpload(pendingLogoFile);
                }
              }}
            >
              Upload
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
