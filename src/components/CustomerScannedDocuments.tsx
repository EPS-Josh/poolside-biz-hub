import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, X, Eye, Download } from 'lucide-react';

interface CustomerScannedDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  description?: string;
  document_type?: string;
  created_at: string;
}

interface CustomerScannedDocumentsProps {
  customerId: string;
}

export const CustomerScannedDocuments = ({ customerId }: CustomerScannedDocumentsProps) => {
  const [documents, setDocuments] = useState<CustomerScannedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<CustomerScannedDocument | null>(null);
  const [uploadDocumentType, setUploadDocumentType] = useState<string>('other');
  const { toast } = useToast();

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_scanned_documents')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching scanned documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scanned documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [customerId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of files) {
        // Check file size (limit to 50MB for documents)
        if (file.size > 50 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 50MB.`);
        }

        // Check file type - allow common document and image formats
        const allowedTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'text/plain'
        ];

        if (!allowedTypes.includes(file.type)) {
          throw new Error(`File ${file.name} is not a supported format. Please use PDF, images, or document files.`);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${customerId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        // Upload file to storage (private bucket)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('customer-scanned-documents')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get signed URL for private access
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('customer-scanned-documents')
          .createSignedUrl(fileName, 3600); // 1 hour expiry

        if (urlError) {
          throw new Error(`Failed to create access URL: ${urlError.message}`);
        }

        // Save document record to database with the file path (not signed URL)
        const { error: dbError } = await supabase
          .from('customer_scanned_documents')
          .insert({
            customer_id: customerId,
            file_name: file.name,
            file_path: fileName, // Store the file path, not the signed URL
            file_size: file.size,
            file_type: file.type,
            document_type: uploadDocumentType,
          });

        if (dbError) {
          throw new Error(`Database save failed: ${dbError.message}`);
        }
      }

      toast({
        title: 'Success',
        description: `${files.length} document(s) uploaded successfully`,
      });

      fetchDocuments();
    } catch (error: any) {
      console.error('Error uploading documents:', error);
      const errorMessage = error?.message || 'Failed to upload documents';
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteDocument = async (documentId: string, filePath: string) => {
    try {
      // Delete from storage
      await supabase.storage
        .from('customer-scanned-documents')
        .remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('customer_scanned_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const updateDocumentDescription = async (documentId: string, description: string) => {
    try {
      const { error } = await supabase
        .from('customer_scanned_documents')
        .update({ description })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Document description updated',
      });

      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? { ...doc, description } : doc
      ));
    } catch (error) {
      console.error('Error updating document description:', error);
      toast({
        title: 'Error',
        description: 'Failed to update description',
        variant: 'destructive',
      });
    }
  };

  const getDocumentTypeDisplay = (type?: string) => {
    switch (type) {
      case 'contract': return 'Contract';
      case 'invoice': return 'Invoice';
      case 'permit': return 'Permit';
      case 'other': return 'Other';
      default: return 'Other';
    }
  };

  const getDocumentTypeColor = (type?: string) => {
    switch (type) {
      case 'contract': return 'bg-blue-100 text-blue-800';
      case 'invoice': return 'bg-green-100 text-green-800';
      case 'permit': return 'bg-yellow-100 text-yellow-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDocument = async (document: CustomerScannedDocument) => {
    try {
      // Create a new signed URL for viewing
      const { data: signedUrlData, error } = await supabase.storage
        .from('customer-scanned-documents')
        .createSignedUrl(document.file_path, 3600); // 1 hour expiry

      if (error) {
        throw error;
      }

      if (signedUrlData?.signedUrl) {
        window.open(signedUrlData.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error creating signed URL:', error);
      toast({
        title: 'Error',
        description: 'Failed to access document',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadDocument = async (document: CustomerScannedDocument) => {
    try {
      // Create a new signed URL for downloading
      const { data: signedUrlData, error } = await supabase.storage
        .from('customer-scanned-documents')
        .createSignedUrl(document.file_path, 3600);

      if (error) {
        throw error;
      }

      if (signedUrlData?.signedUrl) {
        const link = window.document.createElement('a');
        link.href = signedUrlData.signedUrl;
        link.download = document.file_name;
        link.click();
      }
    } catch (error) {
      console.error('Error creating download URL:', error);
      toast({
        title: 'Error',
        description: 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div>Loading scanned documents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Scanned Documents</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Upload Section */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="document-type-select" className="block mb-2">
                Document Type
              </Label>
              <Select value={uploadDocumentType} onValueChange={setUploadDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="permit">Permit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="scanned-document-upload" className="block mb-2">
                Upload Documents (Max 50MB each)
              </Label>
              <Input
                id="scanned-document-upload"
                type="file"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="cursor-pointer"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button disabled={uploading}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Documents'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Supports PDF, Word documents, text files, and image formats. Documents are stored securely.
          </p>
        </div>

        {/* Documents List */}
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No scanned documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((document) => (
              <div key={document.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium">{document.file_name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${getDocumentTypeColor(document.document_type)}`}>
                        {getDocumentTypeDisplay(document.document_type)}
                      </span>
                    </div>
                    <Input
                      placeholder="Add description..."
                      value={document.description || ''}
                      onChange={(e) => updateDocumentDescription(document.id, e.target.value)}
                      className="text-sm mb-2"
                    />
                    <p className="text-xs text-gray-500">
                      {new Date(document.created_at).toLocaleDateString()}
                      {document.file_size && ` • ${Math.round(document.file_size / 1024)} KB`}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocument(document)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDocument(document)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteDocument(document.id, document.file_path)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};