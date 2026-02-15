import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileImage, Upload, X, Eye, Download, Loader2 } from 'lucide-react';

interface CustomerPlanDrawing {
  id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  description?: string;
  category: string;
  created_at: string;
}

interface CustomerPlansDrawingsProps {
  customerId: string;
}

export const CustomerPlansDrawings = ({ customerId }: CustomerPlansDrawingsProps) => {
  const [documents, setDocuments] = useState<CustomerPlanDrawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<CustomerPlanDrawing | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>('plan');
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_plans_drawings')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching plans/drawings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load plans and drawings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [customerId]);

  // Generate signed URLs when documents change
  useEffect(() => {
    const generateSignedUrls = async () => {
      const urls: Record<string, string> = {};
      for (const doc of documents) {
        let storagePath = doc.file_path;
        // Extract storage path from full URL if needed
        if (storagePath.startsWith('http')) {
          const match = storagePath.match(/customer-plans-drawings\/(.+)$/);
          if (match) {
            storagePath = match[1];
          }
        }
        const { data } = await supabase.storage
          .from('customer-plans-drawings')
          .createSignedUrl(storagePath, 3600);
        if (data?.signedUrl) {
          urls[doc.id] = data.signedUrl;
        }
      }
      setSignedUrls(urls);
    };

    if (documents.length > 0) {
      generateSignedUrls();
    }
  }, [documents]);

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

        // Upload file to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('customer-plans-drawings')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Save document record to database with storage path (not public URL)
        const { error: dbError } = await supabase
          .from('customer_plans_drawings')
          .insert({
            customer_id: customerId,
            file_name: file.name,
            file_path: fileName,
            file_size: file.size,
            file_type: file.type,
            category: uploadCategory,
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
      // Extract file path from URL for storage deletion
      const urlParts = filePath.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const customerFolder = urlParts[urlParts.length - 2];
      
      if (fileName && customerFolder) {
        await supabase.storage
          .from('customer-plans-drawings')
          .remove([`${customerFolder}/${fileName}`]);
      }

      // Delete from database
      const { error } = await supabase
        .from('customer_plans_drawings')
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
        .from('customer_plans_drawings')
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

  const getCategoryDisplay = (category: string) => {
    switch (category) {
      case 'plan': return 'Plan';
      case 'print': return 'Print';
      case 'drawing': return 'Drawing';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'plan': return 'bg-blue-100 text-blue-800';
      case 'print': return 'bg-green-100 text-green-800';
      case 'drawing': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div>Loading plans and drawings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileImage className="h-5 w-5" />
          <span>Plans, Prints, Drawings</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Upload Section */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="category-select" className="block mb-2">
                Document Type
              </Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plan">Plan</SelectItem>
                  <SelectItem value="print">Print</SelectItem>
                  <SelectItem value="drawing">Drawing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="document-upload" className="block mb-2">
                Upload Documents (Max 50MB each)
              </Label>
              <Input
                id="document-upload"
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
            Supports PDF, Word documents, text files, and image formats (JPG, PNG, GIF, WebP).
          </p>
        </div>

        {/* Documents List */}
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No plans, prints, or drawings uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((document) => (
              <div key={document.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium">{document.file_name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(document.category)}`}>
                        {getCategoryDisplay(document.category)}
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
                      onClick={() => signedUrls[document.id] && window.open(signedUrls[document.id], '_blank')}
                      disabled={!signedUrls[document.id]}
                    >
                      {signedUrls[document.id] ? <Eye className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!signedUrls[document.id]}
                      onClick={() => {
                        if (signedUrls[document.id]) {
                          const link = window.document.createElement('a');
                          link.href = signedUrls[document.id];
                          link.download = document.file_name;
                          link.click();
                        }
                      }}
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