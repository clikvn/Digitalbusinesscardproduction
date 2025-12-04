import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getUserCode, setUserCode, generatePublicProfileUrl } from '../../utils/user-code';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export function UserCodeSettings() {
  const [userCode, setUserCodeState] = useState(getUserCode());
  const [isEditing, setIsEditing] = useState(false);
  const [tempCode, setTempCode] = useState(userCode);
  const [copied, setCopied] = useState(false);

  const profileUrl = generatePublicProfileUrl();

  const handleSave = () => {
    // Validate user code (alphanumeric only, 3-20 chars)
    const isValid = /^[a-z0-9]{3,20}$/.test(tempCode);
    
    if (!isValid) {
      toast.error('User code must be 3-20 characters (lowercase letters and numbers only)');
      return;
    }

    setUserCode(tempCode);
    setUserCodeState(tempCode);
    setIsEditing(false);
    toast.success('User code updated successfully');
  };

  const handleCancel = () => {
    setTempCode(userCode);
    setIsEditing(false);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success('URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  return (
    null
  );
}