import React, { useState } from 'react';
import { ShareStep1 } from './ShareStep1';
import { ShareStep2 } from './ShareStep2';
import { Contact } from '../../types/contacts';
import { useSettings } from '../../hooks/useSettings';
import { useContacts } from '../../hooks/useContacts';
import { useParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import { useTranslation } from 'react-i18next';

interface ShareManagerProps {
  onMenu: () => void;
}

export function ShareManager({ onMenu }: ShareManagerProps) {
  const { t } = useTranslation();
  const { userCode } = useParams<{ userCode: string }>();
  const { customGroups: groups } = useSettings(userCode);
  const { contacts, saveContacts, isSaving } = useContacts(userCode);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();

  // Form state for add/edit contact
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
    group: 'public'
  });

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setStep(2);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      notes: contact.notes || '',
      group: contact.group || 'public'
    });
    setIsEditDialogOpen(true);
  };

  const handleShareGroup = (groupId: string) => {
    // Find the group details from hook data
    const group = groups.find(g => g.id === groupId);
    
    // Create a virtual contact representing the group
    const groupContact: Contact = {
      id: `group-${groupId}`,
      name: group?.label || groupId,
      title: 'Contact Group',
      avatar: '', // Will use default avatar
      group: groupId,
      createdAt: Date.now(),
      isGroupShare: true,
    };
    
    setSelectedContact(groupContact);
    setStep(2);
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setSelectedContact(undefined);
  };

  const handleAddContact = () => {
    // Reset form and open dialog
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      notes: '',
      group: 'public'
    });
    setIsAddDialogOpen(true);
  };

  const handleSaveContact = async () => {
    if (!formData.name.trim()) {
      toast.error(t('shareManager.nameRequired'));
      return;
    }

    try {
      // Create new contact with auto-generated code
      const newContact: Contact = {
        id: crypto.randomUUID(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        notes: formData.notes,
        title: formData.company || 'Contact',
        avatar: '',
        group: formData.group,
        contactCode: crypto.randomUUID().substring(0, 8),
        createdAt: Date.now()
      };

      // Save to database
      await saveContacts([...contacts, newContact]);
      
      toast.success(t('shareManager.contactAddedSuccess'));
      setIsAddDialogOpen(false);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        notes: '',
        group: 'public'
      });
    } catch (error) {
      toast.error(t('shareManager.failedToAddContact'));
      console.error('Error adding contact:', error);
    }
  };

  const handleUpdateContact = async () => {
    if (!formData.name.trim()) {
      toast.error(t('shareManager.nameRequired'));
      return;
    }

    try {
      // Update existing contact
      const updatedContact: Contact = {
        id: editingContact?.id || '',
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        notes: formData.notes,
        title: formData.company || 'Contact',
        avatar: '',
        group: formData.group,
        contactCode: editingContact?.contactCode || '',
        createdAt: editingContact?.createdAt || Date.now()
      };

      // Save to database
      const updatedContacts = contacts.map(contact => 
        contact.id === updatedContact.id ? updatedContact : contact
      );
      await saveContacts(updatedContacts);
      
      toast.success(t('shareManager.contactUpdatedSuccess'));
      setIsEditDialogOpen(false);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        notes: '',
        group: 'public'
      });
    } catch (error) {
      toast.error(t('shareManager.failedToUpdateContact'));
      console.error('Error updating contact:', error);
    }
  };

  if (step === 1) {
    return (
      <>
        <ShareStep1
          onAddContact={handleAddContact}
          onSelectContact={handleSelectContact}
          onEditContact={handleEditContact}
          onShareGroup={handleShareGroup}
        />

        {/* Add Contact Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-4 sm:p-6">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>{t('shareManager.addContact')}</DialogTitle>
              <DialogDescription>
                {t('shareManager.addContactDescription')}
              </DialogDescription>
            </DialogHeader>

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto flex-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
              <div className="space-y-4 py-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">{t('shareManager.name')} *</Label>
                  <Input
                    id="name"
                    placeholder={t('shareManager.namePlaceholder')}
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">{t('shareManager.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('shareManager.emailPlaceholder')}
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('shareManager.phone')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t('shareManager.phonePlaceholder')}
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                {/* Company */}
                <div className="space-y-2">
                  <Label htmlFor="company">{t('shareManager.company')}</Label>
                  <Input
                    id="company"
                    placeholder={t('shareManager.companyPlaceholder')}
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>

                {/* Group */}
                <div className="space-y-2">
                  <Label htmlFor="group">{t('shareManager.shareGroup')} *</Label>
                  <Select
                    value={formData.group}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, group: value }))}
                  >
                    <SelectTrigger id="group">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">{t('shareManager.notes')}</Label>
                  <Textarea
                    id="notes"
                    placeholder={t('shareManager.notesPlaceholder')}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Info Box */}
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="text-muted-foreground">
                    {t('shareManager.trackingCodeInfo')}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSaveContact} disabled={isSaving}>
                {isSaving ? t('shareManager.adding') : t('shareManager.addContact')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Contact Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-4 sm:p-6">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>{t('shareManager.editContact')}</DialogTitle>
              <DialogDescription>
                {t('shareManager.editContactDescription')}
              </DialogDescription>
            </DialogHeader>

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto flex-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
              <div className="space-y-4 py-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="edit-name">{t('shareManager.name')} *</Label>
                  <Input
                    id="edit-name"
                    placeholder={t('shareManager.namePlaceholder')}
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="edit-email">{t('shareManager.email')}</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    placeholder={t('shareManager.emailPlaceholder')}
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">{t('shareManager.phone')}</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    placeholder={t('shareManager.phonePlaceholder')}
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                {/* Company */}
                <div className="space-y-2">
                  <Label htmlFor="edit-company">{t('shareManager.company')}</Label>
                  <Input
                    id="edit-company"
                    placeholder={t('shareManager.companyPlaceholder')}
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>

                {/* Group */}
                <div className="space-y-2">
                  <Label htmlFor="edit-group">{t('shareManager.shareGroup')} *</Label>
                  <Select
                    value={formData.group}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, group: value }))}
                  >
                    <SelectTrigger id="edit-group">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">{t('shareManager.notes')}</Label>
                  <Textarea
                    id="edit-notes"
                    placeholder={t('shareManager.notesPlaceholder')}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Info Box */}
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="text-muted-foreground">
                    {t('shareManager.trackingCodeInfo')}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={handleUpdateContact} disabled={isSaving}>
                {isSaving ? t('shareManager.updating') : t('shareManager.editContact')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <ShareStep2
      onBack={handleBackToStep1}
      onMenu={onMenu}
      selectedContact={selectedContact}
    />
  );
}