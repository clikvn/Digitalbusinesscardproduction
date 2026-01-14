import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertCircle, Loader2, Trash2, RefreshCw, File } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { buildCMSUrl } from '../../utils/user-code';
import { AIFieldUploadSettings } from './AIFieldUploadSettings';
import { ALL_SHAREABLE_FIELDS } from '../../utils/group-share-settings';
import { useTranslation } from 'react-i18next';

const SERVER_URL = 'https://agent-chat-widget-568865197474.europe-west1.run.app';

interface UploadResult {
  success: boolean;
  data?: {
    fileUri: string;
    fileName: string;
    fileSearchStore: string;
    ownerId: string;
    uploadedAt: number;
    contentLength?: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface DocumentFile {
  name: string;
  displayName: string;
  mimeType: string;
  sizeBytes: number;
  createTime: string;
  updateTime: string;
  state: 'ACTIVE' | 'PENDING' | 'FAILED';
  error?: string;
}

interface DocumentsList {
  ownerId: string;
  storeName: string;
  files: DocumentFile[];
  totalCount: number;
}

export function FileUploadPage() {
  const { t } = useTranslation();
  const { userCode } = useParams<{ userCode: string }>();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [textFileName, setTextFileName] = useState('');
  const [documents, setDocuments] = useState<DocumentsList | null>(null);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [deletingFileUri, setDeletingFileUri] = useState<string | null>(null); // Using documentName for deletion

  if (!userCode) {
    return null;
  }

  // Load documents on mount and after uploads
  useEffect(() => {
    loadDocuments();
  }, [userCode]);

  const loadDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const url = `${SERVER_URL}/api/owners/${userCode}/documents?isOwner=true`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.data);
        console.log(`Total documents: ${data.data.totalCount}`);
      } else {
        console.error('Failed to load documents:', data.error);
        // If store doesn't exist yet, that's okay - just set empty list
        if (data.error?.code !== 'NOT_FOUND') {
          toast.error(data.error?.message || t('fileUploadPage.failedToLoadDocuments'));
        } else {
          // Store doesn't exist yet - set empty documents
          setDocuments({
            ownerId: userCode,
            storeName: '',
            files: [],
            totalCount: 0
          });
        }
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      // Don't show error toast on initial load if store doesn't exist
      // Set empty documents on error
      setDocuments({
        ownerId: userCode,
        storeName: '',
        files: [],
        totalCount: 0
      });
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleDeleteDocument = async (documentName: string, displayName: string) => {
    if (!confirm(t('fileUploadPage.areYouSureDelete', { displayName }))) {
      return;
    }

    setDeletingFileUri(documentName);
    try {
      // Find the file object to get fileUri (file.name)
      const file = documents?.files.find(f => f.displayName === displayName || f.name === documentName);
      const fileUri = file?.name;
      
      if (!fileUri) {
        throw new Error('File URI not found');
      }
      
      console.log('[FileUploadPage] Deleting document:', {
        displayName,
        fileUri
      });
      
      // Use fileUri for deletion
      const encodedFileUri = encodeURIComponent(fileUri);
      const url = `${SERVER_URL}/api/owners/${userCode}/documents/${encodedFileUri}?isOwner=true&force=true`;
      
      const response = await fetch(url, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[FileUploadPage] Delete failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success(t('fileUploadPage.deletedSuccessfully', { displayName }));
        // Reload documents list
        await loadDocuments();
      } else {
        toast.error(data.error?.message || t('fileUploadPage.failedToDeleteDocument'));
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : t('fileUploadPage.failedToDeleteDocumentTryAgain'));
    } finally {
      setDeletingFileUri(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return dateString;
    }
  };

  const getStateBadgeColor = (state: string): string => {
    switch (state) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (100 MB max)
      if (file.size > 100 * 1024 * 1024) {
        toast.error(t('fileUploadPage.fileSizeExceedsLimit'));
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error(t('fileUploadPage.pleaseSelectFile'));
      return;
    }

    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('isOwner', 'true');

    try {
      const response = await fetch(
        `${SERVER_URL}/api/owners/${userCode}/documents`,
        {
          method: 'POST',
          body: formData
        }
      );

      const data: UploadResult = await response.json();
      setUploadResult(data);

      if (data.success) {
        toast.success(t('fileUploadPage.fileUploadedSuccessfully', { fileName: data.data?.fileName || '' }));
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Reload documents list
        await loadDocuments();
      } else {
        toast.error(data.error?.message || t('fileUploadPage.uploadFailedGeneric'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('fileUploadPage.failedToUploadFileTryAgain'));
      setUploadResult({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } finally {
      setUploading(false);
    }
  };

  const handleTextUpload = async () => {
    if (!textContent.trim()) {
      toast.error(t('fileUploadPage.pleaseEnterTextContent'));
      return;
    }

    // Check content size (10 MB max)
    const contentSize = new Blob([textContent]).size;
    if (contentSize > 10 * 1024 * 1024) {
      toast.error('Text content exceeds 10 MB limit');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const response = await fetch(
        `${SERVER_URL}/api/owners/${userCode}/documents/text`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isOwner: 'true',
            content: textContent,
            fileName: textFileName || undefined,
            mimeType: 'text/plain'
          })
        }
      );

      const data: UploadResult = await response.json();
      setUploadResult(data);

      if (data.success) {
        toast.success(`Text content uploaded successfully!`);
        setTextContent('');
        setTextFileName('');
        // Reload documents list
        await loadDocuments();
      } else {
        toast.error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload text. Please try again.');
      setUploadResult({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col gap-6 p-4 md:p-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate(buildCMSUrl(userCode))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('fileUploadPage.backToStudio')}
          </Button>
          <h1 className="text-2xl font-semibold text-[#3d3d3a]">{t('fileUploadPage.personalAIFileUpload')}</h1>
          <p className="text-sm text-[#71717a] mt-2">
            {t('fileUploadPage.uploadDocumentsDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File Upload Card */}
          <Card className="border-[#e4e4e7]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                {t('fileUploadPage.uploadFile')}
              </CardTitle>
              <CardDescription>
                {t('fileUploadPage.uploadFileDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  id="file-input"
                  type="file"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  accept=".pdf,.doc,.docx,.txt,.html,.xls,.xlsx"
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-sm text-[#71717a] mt-2">
                    {t('fileUploadPage.selected')} {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
              <Button
                onClick={handleFileUpload}
                disabled={!selectedFile || uploading}
                className="w-full bg-[#c96442] hover:bg-[#b85838]"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('fileUploadPage.uploading')}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {t('fileUploadPage.uploadFile')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Text Upload Card */}
          <Card className="border-[#e4e4e7]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('fileUploadPage.uploadText')}
              </CardTitle>
              <CardDescription>
                {t('fileUploadPage.uploadTextDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder={t('fileUploadPage.fileNameOptional')}
                  value={textFileName}
                  onChange={(e) => setTextFileName(e.target.value)}
                  disabled={uploading}
                  className="mb-2"
                />
                <Textarea
                  placeholder={t('fileUploadPage.enterTextContent')}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  disabled={uploading}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-[#71717a] mt-1">
                  {(new Blob([textContent]).size / 1024).toFixed(2)} KB
                </p>
              </div>
              <Button
                onClick={handleTextUpload}
                disabled={!textContent.trim() || uploading}
                className="w-full bg-[#c96442] hover:bg-[#b85838]"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('fileUploadPage.uploading')}
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    {t('fileUploadPage.uploadText')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Upload Result */}
        {uploadResult && (
          <Card className={`border-[#e4e4e7] ${uploadResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <CardContent className="pt-6 pb-6">
              {uploadResult.success ? (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">{t('fileUploadPage.uploadSuccessful')}</p>
                    {uploadResult.data && (
                      <div className="mt-2 text-sm text-green-800 space-y-1">
                        <p>File: {uploadResult.data.fileName}</p>
                        <p>Store: {uploadResult.data.fileSearchStore}</p>
                        {uploadResult.data.contentLength && (
                          <p>Content Length: {uploadResult.data.contentLength} characters</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900">{t('fileUploadPage.uploadFailed')}</p>
                    {uploadResult.error && (
                      <p className="mt-1 text-sm text-red-800">
                        {uploadResult.error.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Documents List */}
        <Card className="border-[#e4e4e7]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <File className="w-5 h-5" />
                  {t('fileUploadPage.uploadedDocuments')}
                </CardTitle>
                <CardDescription>
                  {(() => {
                    // Count only manual documents (exclude field-related ones)
                    const manualCount = documents?.files.filter(file => {
                      const fieldPath = file.displayName.replace(/\.txt$/, '');
                      return !ALL_SHAREABLE_FIELDS.includes(fieldPath);
                    }).length || 0;
                    return documents ? `${manualCount} manually uploaded document${manualCount !== 1 ? 's' : ''} (${documents.totalCount} total including fields)` : 'Your manually uploaded documents';
                  })()}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadDocuments}
                disabled={loadingDocuments}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingDocuments ? 'animate-spin' : ''}`} />
                {t('fileUploadPage.refresh')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingDocuments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#c96442]" />
                <span className="ml-2 text-sm text-[#71717a]">Loading documents...</span>
              </div>
            ) : (() => {
              // Filter out field-related documents (managed by toggle switches)
              const manualDocuments = documents?.files.filter(file => {
                // Check if document name matches a field path (e.g., "personal.name.txt" -> "personal.name")
                const fieldPath = file.displayName.replace(/\.txt$/, '');
                return !ALL_SHAREABLE_FIELDS.includes(fieldPath);
              }) || [];
              
              return manualDocuments.length > 0 ? (
                <div className="space-y-3">
                  {manualDocuments.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center justify-between p-4 border border-[#e4e4e7] rounded-lg hover:bg-[#faf9f5] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-[#71717a] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#3d3d3a] truncate">
                              {file.displayName}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-sm text-[#71717a]">
                              <span>{formatFileSize(file.sizeBytes)}</span>
                              <span>•</span>
                              <span>{file.mimeType}</span>
                              <span>•</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStateBadgeColor(file.state)}`}>
                                {file.state}
                              </span>
                            </div>
                            <p className="text-xs text-[#71717a] mt-1">
                              {t('fileUploadPage.uploaded')} {formatDate(file.createTime)}
                            </p>
                            {file.error && (
                              <p className="text-xs text-red-600 mt-1">
                                Error: {file.error}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(file.displayName, file.displayName)}
                        disabled={deletingFileUri === file.displayName || deletingFileUri === file.name}
                        className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title={t('fileUploadPage.delete')}
                      >
                        {deletingFileUri === file.displayName ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-[#83827d] mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-[#71717a]">No manually uploaded documents</p>
                  <p className="text-xs text-[#83827d] mt-1">{t('fileUploadPage.noDocumentsYet')}</p>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Auto-Upload Field Settings - Moved to bottom */}
        <AIFieldUploadSettings
          documents={documents?.files || null}
          onDocumentsChange={loadDocuments}
        />
      </div>
    </div>
  );
}

