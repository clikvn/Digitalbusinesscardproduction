import React, { useState } from 'react';
import { useBusinessManagement } from '../../hooks/useBusinessManagement';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, User, Mail, Lock, Briefcase, Building, Hash } from 'lucide-react';
import { toast } from 'sonner';

interface AddEmployeeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * AddEmployeeForm - Form component for creating new employee accounts
 * Creates a new user account with 'employee' plan and links to business owner
 */
export function AddEmployeeForm({ onSuccess, onCancel }: AddEmployeeFormProps) {
  const { createEmployee, isCreatingEmployee } = useBusinessManagement();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    employeeCode: '',
    role: '',
    department: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const result = await createEmployee({
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
        employeeCode: formData.employeeCode.trim() || undefined,
        role: formData.role.trim() || undefined,
        department: formData.department.trim() || undefined,
      });

      toast.success(`Employee account created! User code: ${result.userCode}`);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating employee:', error);
      
      if (error.message?.includes('already registered')) {
        setErrors({ email: 'This email is already registered' });
      } else {
        toast.error(`Failed to create employee: ${error.message}`);
      }
    }
  };

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <User className="h-4 w-4 text-zinc-500" />
          Full Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          value={formData.name}
          onChange={handleChange('name')}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-zinc-500" />
          Email Address <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="john@company.com"
          value={formData.email}
          onChange={handleChange('email')}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
      </div>

      {/* Password */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-zinc-500" />
            Password <span className="text-red-500">*</span>
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange('password')}
            className={errors.password ? 'border-red-500' : ''}
          />
          {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            className={errors.confirmPassword ? 'border-red-500' : ''}
          />
          {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
        </div>
      </div>

      {/* Optional Fields */}
      <div className="pt-2 border-t border-zinc-200">
        <p className="text-sm text-zinc-500 mb-4">Optional Information</p>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Employee Code */}
          <div className="space-y-2">
            <Label htmlFor="employeeCode" className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-zinc-500" />
              Employee Code
            </Label>
            <Input
              id="employeeCode"
              type="text"
              placeholder="EMP001"
              value={formData.employeeCode}
              onChange={handleChange('employeeCode')}
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-zinc-500" />
              Role/Title
            </Label>
            <Input
              id="role"
              type="text"
              placeholder="Sales Manager"
              value={formData.role}
              onChange={handleChange('role')}
            />
          </div>
        </div>

        {/* Department */}
        <div className="space-y-2 mt-4">
          <Label htmlFor="department" className="flex items-center gap-2">
            <Building className="h-4 w-4 text-zinc-500" />
            Department
          </Label>
          <Input
            id="department"
            type="text"
            placeholder="Sales"
            value={formData.department}
            onChange={handleChange('department')}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isCreatingEmployee}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isCreatingEmployee}
        >
          {isCreatingEmployee ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Account...
            </>
          ) : (
            'Create Employee Account'
          )}
        </Button>
      </div>
    </form>
  );
}
