import React, { useState, useEffect } from 'react';
import { useBusinessManagement } from '../../hooks/useBusinessManagement';
import { EmployeeWithDetails } from '../../types/database';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, User, Mail, Briefcase, Building, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { useTranslation } from 'react-i18next';

interface EditEmployeeFormProps {
  employee: EmployeeWithDetails;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * EditEmployeeForm - Form component for editing employee information
 * Updates employee details and business card data
 */
export function EditEmployeeForm({ employee, onSuccess, onCancel }: EditEmployeeFormProps) {
  const { t } = useTranslation();
  const { updateEmployee, isUpdatingEmployee } = useBusinessManagement();

  const [formData, setFormData] = useState({
    name: employee.employee_name || '',
    email: employee.user_email || '',
    employeeCode: employee.employee_code || '',
    role: employee.role || '',
    department: employee.department || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingCard, setIsLoadingCard] = useState(false);

  // Load business card data if user_code exists
  useEffect(() => {
    const loadBusinessCard = async () => {
      if (employee.user_code) {
        try {
          setIsLoadingCard(true);
          const cardData = await api.card.get(employee.user_code);
          if (cardData) {
            setFormData(prev => ({
              ...prev,
              name: cardData.name || prev.name,
              email: cardData.email || prev.email,
            }));
          }
        } catch (error) {
          console.error('Error loading business card:', error);
        } finally {
          setIsLoadingCard(false);
        }
      }
    };

    loadBusinessCard();
  }, [employee.user_code]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('editEmployeeForm.nameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('editEmployeeForm.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('editEmployeeForm.invalidEmail');
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
      let cardUpdateSuccess = true;
      
      // Update employee management fields
      await updateEmployee({
        employeeUserId: employee.employee_user_id,
        updates: {
          employeeCode: formData.employeeCode.trim() || undefined,
          role: formData.role.trim() || undefined,
          department: formData.department.trim() || undefined,
        },
      });

      // Update business card if user_code exists
      if (employee.user_code) {
        try {
          const currentCard = await api.card.get(employee.user_code);
          if (currentCard) {
            await api.business.updateEmployeeCard(employee.user_code, {
              ...currentCard,
              personal: {
                ...currentCard.personal,
                name: formData.name.trim(),
              },
              contact: {
                ...currentCard.contact,
                email: formData.email.trim(),
              },
            });
          } else {
            // If card doesn't exist, create a basic one
            await api.business.updateEmployeeCard(employee.user_code, {
              personal: {
                name: formData.name.trim(),
                title: '',
                businessName: '',
                bio: '',
                profileImage: '',
              },
              contact: {
                email: formData.email.trim(),
                phone: '',
                address: '',
              },
              socialMessaging: {
                zalo: '',
                messenger: '',
                telegram: '',
                whatsapp: '',
                kakao: '',
                discord: '',
                wechat: '',
              },
              socialChannels: {
                facebook: '',
                linkedin: '',
                twitter: '',
                youtube: '',
              },
              portfolio: [],
              portfolioCategories: [],
              profile: {
                about: '',
                serviceAreas: '',
                specialties: '',
                experience: '',
                languages: '',
                certifications: '',
              },
              customLabels: {},
              groupShareSettings: {},
            });
          }
        } catch (error: any) {
          console.error('Error updating business card:', error);
          cardUpdateSuccess = false;
          toast.error(t('editEmployeeForm.failedToUpdateBusinessCard', { error: error.message }));
        }
      }

      if (cardUpdateSuccess) {
        toast.success(t('editEmployeeForm.employeeUpdatedSuccess'));
        onSuccess();
      } else {
        // Still call onSuccess to close the dialog, but user saw the error
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast.error(t('editEmployeeForm.failedToUpdateEmployee', { error: error.message }));
    }
  };

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isLoadingCard) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <User className="h-4 w-4 text-zinc-500" />
          {t('editEmployeeForm.fullName')} <span className="text-red-500">*</span>
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
          {t('editEmployeeForm.emailAddress')} <span className="text-red-500">*</span>
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

      {/* Optional Fields */}
      <div className="pt-2 border-t border-zinc-200">
        <p className="text-sm text-zinc-500 mb-4">{t('editEmployeeForm.optionalInformation')}</p>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Employee Code */}
          <div className="space-y-2">
            <Label htmlFor="employeeCode" className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-zinc-500" />
              {t('editEmployeeForm.employeeCode')}
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
              {t('editEmployeeForm.roleTitle')}
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
            {t('editEmployeeForm.department')}
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
          disabled={isUpdatingEmployee}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={isUpdatingEmployee}
        >
          {isUpdatingEmployee ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('editEmployeeForm.updating')}
            </>
          ) : (
            t('editEmployeeForm.saveChanges')
          )}
        </Button>
      </div>
    </form>
  );
}
