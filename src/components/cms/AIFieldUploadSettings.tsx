import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ALL_SHAREABLE_FIELDS, FIELD_LABELS } from '../../utils/group-share-settings';
import { BusinessCardData } from '../../types/business-card';
import { useBusinessCard } from '../../hooks/useBusinessCard';
import { useParams } from 'react-router-dom';

const SERVER_URL = 'https://agent-chat-widget-568865197474.europe-west1.run.app';

interface DocumentFile {
  name: string;
  displayName: string;
  mimeType: string;
  sizeBytes: number;
  createTime: string;
  updateTime: string;
  state: 'ACTIVE' | 'PENDING' | 'FAILED';
}

interface AIFieldUploadSettingsProps {
  documents: DocumentFile[] | null;
  onDocumentsChange: () => void;
}

/**
 * Get field value from business card data using field path
 */
function getFieldValue(data: BusinessCardData, fieldPath: string): string {
  const parts = fieldPath.split('.');
  let current: any = data;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return '';
    }
  }
  
  // Handle special cases
  if (fieldPath === 'portfolio') {
    // Portfolio is an array, convert to JSON array with URLs instead of base64
    if (Array.isArray(current) && current.length > 0) {
      const portfolioItems = current.map((item: any) => {
        const portfolioItem: any = {
          id: item.id || '',
          type: item.type || '',
          title: item.title || '',
          description: item.description || '',
          categoryId: item.categoryId || '',
        };
        
        // Convert images array to URLs only (skip base64)
        if (item.images && Array.isArray(item.images)) {
          portfolioItem.images = item.images.filter((img: string) => 
            img && !img.startsWith('data:image') && (img.startsWith('http://') || img.startsWith('https://'))
          );
        }
        
        // Add video/tour URLs if present
        if (item.videoUrl) portfolioItem.videoUrl = item.videoUrl;
        if (item.tourUrl) portfolioItem.tourUrl = item.tourUrl;
        
        return portfolioItem;
      });
      
      return JSON.stringify(portfolioItems, null, 2);
    }
    return '';
  }
  
  // Handle profileImage (JSON string) - extract URL only, not base64
  if (fieldPath === 'personal.profileImage') {
    if (typeof current === 'string' && current) {
      try {
        const parsed = JSON.parse(current);
        // Return the imageUrl if it's a URL, otherwise return empty
        if (parsed.imageUrl) {
          // Only return if it's a URL, not base64
          if (parsed.imageUrl.startsWith('http://') || parsed.imageUrl.startsWith('https://')) {
            return parsed.imageUrl;
          }
          // If it's base64, return empty (we don't want base64 in the document)
          return '';
        }
        return '';
      } catch {
        // If it's not JSON, check if it's a URL
        if (current.startsWith('http://') || current.startsWith('https://')) {
          return current;
        }
        return '';
      }
    }
    return '';
  }
  
  return typeof current === 'string' ? current : String(current || '');
}

/**
 * Format field value for upload
 */
function formatFieldContent(fieldPath: string, value: string): string {
  const label = FIELD_LABELS[fieldPath] || fieldPath;
  
  if (!value || value.trim() === '') {
    return '';
  }
  
  // Format based on field type
  if (fieldPath === 'portfolio') {
    // Portfolio is already JSON, just add label
    return `${label}:\n${value}`;
  } else if (fieldPath.startsWith('contact.')) {
    return `${label}: ${value}`;
  } else if (fieldPath.startsWith('socialMessaging.') || fieldPath.startsWith('socialChannels.')) {
    return `${label}: ${value}`;
  } else if (fieldPath.startsWith('profile.')) {
    return `${label}:\n${value}`;
  } else if (fieldPath === 'personal.bio') {
    return `${label}:\n${value}`;
  } else if (fieldPath === 'personal.profileImage') {
    // Profile image is just the URL
    return `${label}: ${value}`;
  } else {
    return `${label}: ${value}`;
  }
}

export function AIFieldUploadSettings({ documents, onDocumentsChange }: AIFieldUploadSettingsProps) {
  const { userCode } = useParams<{ userCode: string }>();
  const { data: businessCardData, isLoading: loadingData } = useBusinessCard(userCode);
  const [uploadingFields, setUploadingFields] = useState<Set<string>>(new Set());
  const [deletingFields, setDeletingFields] = useState<Set<string>>(new Set());
  // Map: fieldPath -> { displayName, fileUri }
  const [uploadedFieldsData, setUploadedFieldsData] = useState<Map<string, { displayName: string; fileUri: string }>>(new Map());
  
  // Build map from documents list
  useEffect(() => {
    const map = new Map<string, { displayName: string; fileUri: string }>();
    if (documents) {
      documents.forEach(doc => {
        // Check if document name matches a field path (e.g., "personal.name.txt" -> "personal.name")
        const fieldPath = doc.displayName.replace(/\.txt$/, '');
        if (ALL_SHAREABLE_FIELDS.includes(fieldPath)) {
          map.set(fieldPath, { displayName: doc.displayName, fileUri: doc.name });
        }
      });
    }
    setUploadedFieldsData(map);
  }, [documents]);
  
  const isFieldUploaded = (fieldPath: string): boolean => {
    return uploadedFieldsData.has(fieldPath);
  };
  
  const handleToggleField = async (fieldPath: string) => {
    if (!userCode || !businessCardData) {
      toast.error('Business card data not available');
      return;
    }
    
    const isUploaded = isFieldUploaded(fieldPath);
    const fieldValue = getFieldValue(businessCardData, fieldPath);
    const fieldLabel = FIELD_LABELS[fieldPath] || fieldPath;
    const documentName = `${fieldPath}.txt`;
    
    if (isUploaded) {
      // Delete document
      const uploadedData = uploadedFieldsData.get(fieldPath);
      if (!uploadedData) return;
      
      // Use fileUri for deletion
      const fileUri = uploadedData.fileUri;
      
      setDeletingFields(prev => new Set(prev).add(fieldPath));
      try {
        console.log('[AIFieldUploadSettings] Deleting document:', {
          fieldPath,
          displayName: uploadedData.displayName,
          fileUri
        });
        
        // URL encode the file URI
        const encodedFileUri = encodeURIComponent(fileUri);
        const url = `${SERVER_URL}/api/owners/${userCode}/documents/${encodedFileUri}?isOwner=true&force=true`;
        
        const response = await fetch(url, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[AIFieldUploadSettings] Delete failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          toast.success(`${fieldLabel} removed from AI search`);
          onDocumentsChange(); // Reload documents
        } else {
          toast.error(data.error?.message || 'Failed to remove field');
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to remove field. Please try again.');
      } finally {
        setDeletingFields(prev => {
          const next = new Set(prev);
          next.delete(fieldPath);
          return next;
        });
      }
    } else {
      // Upload field value
      if (!fieldValue || fieldValue.trim() === '') {
        toast.error(`${fieldLabel} is empty. Please fill it in first.`);
        return;
      }
      
      setUploadingFields(prev => new Set(prev).add(fieldPath));
      try {
        const content = formatFieldContent(fieldPath, fieldValue);
        
        const response = await fetch(
          `${SERVER_URL}/api/owners/${userCode}/documents/text`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              isOwner: 'true',
              content,
              fileName: documentName,
              mimeType: 'text/plain'
            })
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          toast.success(`${fieldLabel} added to AI search`);
          onDocumentsChange(); // Reload documents
        } else {
          toast.error(data.error?.message || 'Failed to upload field');
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload field. Please try again.');
      } finally {
        setUploadingFields(prev => {
          const next = new Set(prev);
          next.delete(fieldPath);
          return next;
        });
      }
    }
  };
  
  if (loadingData) {
    return (
      <Card className="border-[#e4e4e7]">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#c96442]" />
            <span className="ml-2 text-sm text-[#71717a]">Loading business card data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!businessCardData) {
    return (
      <Card className="border-[#e4e4e7]">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">Unable to load business card data</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Group fields by category
  const fieldCategories: Record<string, string[]> = {
    'Personal Information': ALL_SHAREABLE_FIELDS.filter(f => f.startsWith('personal.')),
    'Contact Information': ALL_SHAREABLE_FIELDS.filter(f => f.startsWith('contact.')),
    'Social Messaging': ALL_SHAREABLE_FIELDS.filter(f => f.startsWith('socialMessaging.')),
    'Social Channels': ALL_SHAREABLE_FIELDS.filter(f => f.startsWith('socialChannels.')),
    'Profile': ALL_SHAREABLE_FIELDS.filter(f => f.startsWith('profile.')),
    'Portfolio': ALL_SHAREABLE_FIELDS.filter(f => f === 'portfolio'),
  };
  
  const uploadedCount = uploadedFieldsData.size;
  const totalFields = ALL_SHAREABLE_FIELDS.length;
  
  return (
    <Card className="border-[#e4e4e7]">
      <CardHeader>
        <CardTitle>Auto-Upload Business Card Fields</CardTitle>
        <CardDescription>
          Select which fields to automatically include in AI search. When enabled, the field's current value will be uploaded and kept in sync.
        </CardDescription>
        <div className="mt-2 text-sm text-[#71717a]">
          {uploadedCount} of {totalFields} fields enabled
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(fieldCategories).map(([category, fields]) => {
          if (fields.length === 0) return null;
          
          return (
            <div key={category} className="space-y-3">
              <h4 className="font-medium text-[#3d3d3a] text-sm">{category}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fields.map((fieldPath) => {
                  const isUploaded = isFieldUploaded(fieldPath);
                  const fieldValue = getFieldValue(businessCardData, fieldPath);
                  const hasValue = fieldValue && fieldValue.trim() !== '';
                  const isUploading = uploadingFields.has(fieldPath);
                  const isDeleting = deletingFields.has(fieldPath);
                  const isLoading = isUploading || isDeleting;
                  const fieldLabel = FIELD_LABELS[fieldPath] || fieldPath;
                  
                  return (
                    <div
                      key={fieldPath}
                      className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                        isUploaded
                          ? 'border-green-200 bg-green-50'
                          : 'border-[#e4e4e7] bg-white'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={`ai-field-${fieldPath}`}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <span className="font-medium text-sm text-[#3d3d3a]">
                            {fieldLabel}
                          </span>
                          {isUploaded && (
                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                          )}
                        </Label>
                        {!hasValue && (
                          <p className="text-xs text-[#83827d] mt-1">
                            Empty field
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#c96442]" />
                        ) : (
                          <Switch
                            id={`ai-field-${fieldPath}`}
                            checked={isUploaded}
                            onCheckedChange={() => handleToggleField(fieldPath)}
                            disabled={!hasValue || isLoading}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

