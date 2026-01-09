import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { EmployeeWithDetails, BusinessOwnerInfo, FieldPermissionLevel } from '../types/database';

/**
 * Hook for business management functionality
 * Provides queries and mutations for managing employees
 */
export function useBusinessManagement() {
  const queryClient = useQueryClient();

  // Check if current user is business owner
  const isBusinessOwnerQuery = useQuery({
    queryKey: ['is-business-owner'],
    queryFn: api.business.isBusinessOwner,
    staleTime: 5 * 60 * 1000,
  });

  // Check if current user is employee
  const isEmployeeQuery = useQuery({
    queryKey: ['is-employee'],
    queryFn: api.business.isEmployee,
    staleTime: 5 * 60 * 1000,
  });

  // Get employees (for business owner)
  const employeesQuery = useQuery({
    queryKey: ['business-employees'],
    queryFn: api.business.getEmployees,
    enabled: isBusinessOwnerQuery.data === true,
    staleTime: 30 * 1000,
  });

  // Get business owner info (for employee)
  const businessOwnerQuery = useQuery({
    queryKey: ['my-business-owner'],
    queryFn: api.business.getBusinessOwner,
    enabled: isEmployeeQuery.data === true,
    staleTime: 5 * 60 * 1000,
  });

  // Get my field permissions (for employee)
  const fieldPermissionsQuery = useQuery({
    queryKey: ['my-field-permissions'],
    queryFn: api.business.getMyFieldPermissions,
    enabled: isEmployeeQuery.data === true,
    staleTime: 60 * 1000,
  });

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: api.business.createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-employees'] });
    },
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: ({ employeeUserId, updates }: { 
      employeeUserId: string; 
      updates: Parameters<typeof api.business.updateEmployee>[1];
    }) => api.business.updateEmployee(employeeUserId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-employees'] });
    },
  });

  // Toggle employee active status
  const toggleEmployeeActiveMutation = useMutation({
    mutationFn: ({ employeeUserId, isActive }: { employeeUserId: string; isActive: boolean }) =>
      api.business.setEmployeeActive(employeeUserId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-employees'] });
    },
  });

  // Update field permissions
  const updateFieldPermissionsMutation = useMutation({
    mutationFn: ({ employeeUserId, permissions }: { 
      employeeUserId: string; 
      permissions: Record<string, FieldPermissionLevel>;
    }) => api.business.updateFieldPermissions(employeeUserId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-employees'] });
    },
  });

  // Remove employee
  const removeEmployeeMutation = useMutation({
    mutationFn: api.business.removeEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-employees'] });
    },
  });

  return {
    // Queries
    isBusinessOwner: isBusinessOwnerQuery.data ?? false,
    isEmployee: isEmployeeQuery.data ?? false,
    employees: employeesQuery.data ?? [],
    businessOwner: businessOwnerQuery.data,
    myFieldPermissions: fieldPermissionsQuery.data ?? {},
    
    // Loading states
    isLoading: isBusinessOwnerQuery.isLoading || isEmployeeQuery.isLoading,
    isLoadingEmployees: employeesQuery.isLoading,
    
    // Mutations
    createEmployee: createEmployeeMutation.mutateAsync,
    updateEmployee: updateEmployeeMutation.mutateAsync,
    toggleEmployeeActive: toggleEmployeeActiveMutation.mutateAsync,
    updateFieldPermissions: updateFieldPermissionsMutation.mutateAsync,
    removeEmployee: removeEmployeeMutation.mutateAsync,
    
    // Mutation states
    isCreatingEmployee: createEmployeeMutation.isPending,
    isUpdatingEmployee: updateEmployeeMutation.isPending,
    isRemovingEmployee: removeEmployeeMutation.isPending,
    
    // Error states
    createEmployeeError: createEmployeeMutation.error,
    updateEmployeeError: updateEmployeeMutation.error,
    
    // Refetch functions
    refetchEmployees: employeesQuery.refetch,
  };
}

// Company fields that can be restricted by business owners
const COMPANY_FIELDS = ['personal.businessName', 'personal.title'];

/**
 * Hook for checking field editability for employees
 * Returns whether the current employee can edit a specific field
 * Note: Only company fields (businessName, title) can be restricted.
 * All other fields are always editable by employees.
 */
export function useFieldPermission(fieldPath: string) {
  const { isEmployee, myFieldPermissions } = useBusinessManagement();
  
  // If not an employee, they can edit all fields
  if (!isEmployee) {
    return { canEdit: true, permission: 'editable' as FieldPermissionLevel };
  }
  
  // If this is not a company field, it's always editable
  if (!COMPANY_FIELDS.includes(fieldPath)) {
    return { canEdit: true, permission: 'editable' as FieldPermissionLevel };
  }
  
  // Get permission for this field, default to editable if not set
  const permission = myFieldPermissions[fieldPath] ?? 'editable';
  const canEdit = permission === 'editable';
  
  return { canEdit, permission };
}

/**
 * Hook to get all field permissions at once for UI rendering
 * Note: Only company fields (businessName, title) can be restricted.
 * All other fields are always editable by employees.
 */
export function useAllFieldPermissions() {
  const { isEmployee, myFieldPermissions, isLoading } = useBusinessManagement();
  
  // Helper function to check if a field can be edited
  const canEdit = (fieldPath: string): boolean => {
    if (!isEmployee) return true;
    // If this is not a company field, it's always editable
    if (!COMPANY_FIELDS.includes(fieldPath)) {
      return true;
    }
    const permission = myFieldPermissions[fieldPath];
    return permission === undefined || permission === 'editable';
  };
  
  // Helper function to check if a field is visible
  // All fields are always visible (hidden option removed)
  const isVisible = (fieldPath: string): boolean => {
    return true;
  };
  
  // Helper function to check if a field is readonly
  const isReadonly = (fieldPath: string): boolean => {
    if (!isEmployee) return false;
    // If this is not a company field, it's never readonly
    if (!COMPANY_FIELDS.includes(fieldPath)) {
      return false;
    }
    const permission = myFieldPermissions[fieldPath];
    return permission === 'readonly';
  };
  
  return {
    isEmployee,
    permissions: myFieldPermissions,
    isLoading,
    canEdit,
    isVisible,
    isReadonly,
  };
}
