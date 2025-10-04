import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCustomerData } from '@/hooks/useCustomerData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Image as ImageIcon, Loader2, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface Photo {
  id: string;
  file_name: string;
  file_path: string;
  description?: string;
  created_at: string;
}

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  description?: string;
  category?: string;
  created_at: string;
}

const ClientPortalPhotos = () => {
  const navigate = useNavigate();
  const { customer, loading: customerLoading } = useCustomerData();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customer) {
      fetchMedia();
    }
  }, [customer]);

  const fetchMedia = async () => {
    if (!customer) return;

    try {
      const [photosResult, docsResult] = await Promise.all([
        supabase
          .from('customer_photos')
          .select('*')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('customer_plans_drawings')
          .select('*')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false }),
      ]);

      if (photosResult.error) throw photosResult.error;
      if (docsResult.error) throw docsResult.error;

      setPhotos(photosResult.data || []);
      setDocuments(docsResult.data || []);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage
      .from('customer-photos')
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const getDocumentUrl = (path: string) => {
    const { data } = supabase.storage
      .from('customer-plans-drawings')
      .getPublicUrl(path);
    return data.publicUrl;
  };

  if (customerLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/client-portal')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Portal
          </Button>
          <h1 className="text-2xl font-bold">Photos & Documents</h1>
          <p className="text-muted-foreground">View media from your service visits</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="photos">
              <ImageIcon className="h-4 w-4 mr-2" />
              Photos ({photos.length})
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Documents ({documents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="mt-6">
            {photos.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">No photos available</p>
                  <p className="text-muted-foreground mt-2">
                    Photos from your service visits will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden">
                    <img
                      src={getPublicUrl(photo.file_path)}
                      alt={photo.description || photo.file_name}
                      className="w-full h-48 object-cover"
                    />
                    <CardContent className="p-4">
                      <p className="text-sm font-medium">{photo.file_name}</p>
                      {photo.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {photo.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(photo.created_at), 'MMM d, yyyy')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            {documents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">No documents available</p>
                  <p className="text-muted-foreground mt-2">
                    Plans, drawings, and other documents will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.file_name}</p>
                            {doc.description && (
                              <p className="text-sm text-muted-foreground">{doc.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(doc.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getDocumentUrl(doc.file_path), '_blank')}
                        >
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ClientPortalPhotos;
