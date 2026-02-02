import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ArrowLeft, Image as ImageIcon, Loader2, Search, Expand, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { getThumbnailUrl, getFullSizeUrl } from '@/utils/storageUtils';

interface PhotoWithCustomer {
  id: string;
  file_name: string;
  file_path: string;
  description: string | null;
  created_at: string;
  customer_id: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_address: string | null;
}

const PhotoGallery = () => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<PhotoWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const [fullSizeUrls, setFullSizeUrls] = useState<Record<string, string>>({});
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithCustomer | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_photos')
        .select(`
          id,
          file_name,
          file_path,
          description,
          created_at,
          customer_id,
          customers!inner (
            first_name,
            last_name,
            address
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const photosWithCustomer: PhotoWithCustomer[] = (data || []).map((photo: any) => ({
        id: photo.id,
        file_name: photo.file_name,
        file_path: photo.file_path,
        description: photo.description,
        created_at: photo.created_at,
        customer_id: photo.customer_id,
        customer_first_name: photo.customers.first_name,
        customer_last_name: photo.customers.last_name,
        customer_address: photo.customers.address,
      }));

      // Sort by customer name
      photosWithCustomer.sort((a, b) => {
        const nameA = `${a.customer_last_name} ${a.customer_first_name}`.toLowerCase();
        const nameB = `${b.customer_last_name} ${b.customer_first_name}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setPhotos(photosWithCustomer);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate thumbnail URLs for visible photos
  useEffect(() => {
    const generateThumbnails = async () => {
      const filteredPhotos = getFilteredPhotos();
      const visiblePhotos = filteredPhotos.slice(0, 50); // Limit to first 50 for performance
      
      const urls: Record<string, string> = { ...thumbnailUrls };
      
      for (const photo of visiblePhotos) {
        if (!urls[photo.id]) {
          const url = await getThumbnailUrl('customer-photos', photo.file_path);
          if (url) {
            urls[photo.id] = url;
          }
        }
      }
      
      setThumbnailUrls(urls);
    };

    if (photos.length > 0) {
      generateThumbnails();
    }
  }, [photos, searchTerm]);

  // Load full-size URL when a photo is selected
  useEffect(() => {
    const loadFullSize = async () => {
      if (selectedPhoto && !fullSizeUrls[selectedPhoto.id]) {
        const url = await getFullSizeUrl('customer-photos', selectedPhoto.file_path);
        if (url) {
          setFullSizeUrls(prev => ({ ...prev, [selectedPhoto.id]: url }));
        }
      }
    };

    loadFullSize();
  }, [selectedPhoto]);

  const getFilteredPhotos = () => {
    if (!searchTerm) return photos;
    
    const term = searchTerm.toLowerCase();
    return photos.filter(photo => {
      const customerName = `${photo.customer_first_name} ${photo.customer_last_name}`.toLowerCase();
      const address = (photo.customer_address || '').toLowerCase();
      const fileName = photo.file_name.toLowerCase();
      const description = (photo.description || '').toLowerCase();
      
      return customerName.includes(term) || 
             address.includes(term) || 
             fileName.includes(term) ||
             description.includes(term);
    });
  };

  const filteredPhotos = getFilteredPhotos();

  // Group photos by customer
  const photosByCustomer = filteredPhotos.reduce((acc, photo) => {
    const key = `${photo.customer_last_name}, ${photo.customer_first_name}`;
    if (!acc[key]) {
      acc[key] = {
        customerId: photo.customer_id,
        photos: [],
      };
    }
    acc[key].photos.push(photo);
    return acc;
  }, {} as Record<string, { customerId: string; photos: PhotoWithCustomer[] }>);

  const sortedCustomerNames = Object.keys(photosByCustomer).sort();

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/menu')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Menu
            </Button>
            <h1 className="text-3xl font-bold text-foreground mb-2">Photo Gallery</h1>
            <p className="text-muted-foreground">
              All photos uploaded across customers ({photos.length} total)
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name, address, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {photos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">No photos uploaded yet</p>
                <p className="text-muted-foreground mt-2">
                  Photos uploaded for customers will appear here.
                </p>
              </CardContent>
            </Card>
          ) : filteredPhotos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">No matching photos</p>
                <p className="text-muted-foreground mt-2">
                  Try a different search term.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {sortedCustomerNames.map((customerName) => {
                const { customerId, photos: customerPhotos } = photosByCustomer[customerName];
                return (
                  <div key={customerId}>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xl font-semibold text-foreground">
                        {customerName}
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          ({customerPhotos.length} photos)
                        </span>
                      </h2>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/customer/${customerId}`)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Customer
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {customerPhotos.map((photo) => (
                        <Card 
                          key={photo.id} 
                          className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                          onClick={() => setSelectedPhoto(photo)}
                        >
                          <div className="relative aspect-square">
                            {thumbnailUrls[photo.id] ? (
                              <img
                                src={thumbnailUrls[photo.id]}
                                alt={photo.description || photo.file_name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center">
                              <Expand className="h-6 w-6 text-white opacity-0 hover:opacity-100" />
                            </div>
                          </div>
                          <CardContent className="p-2">
                            <p className="text-xs text-muted-foreground truncate">
                              {format(new Date(photo.created_at), 'MMM d, yyyy')}
                            </p>
                            {photo.description && (
                              <p className="text-xs truncate mt-1">{photo.description}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Image Preview Dialog */}
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
              {selectedPhoto && (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  {fullSizeUrls[selectedPhoto.id] ? (
                    <img
                      src={fullSizeUrls[selectedPhoto.id]}
                      alt={selectedPhoto.description || selectedPhoto.file_name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white p-4">
                    <h3 className="font-medium">
                      {selectedPhoto.customer_first_name} {selectedPhoto.customer_last_name}
                    </h3>
                    <p className="text-sm text-gray-300">{selectedPhoto.file_name}</p>
                    {selectedPhoto.description && (
                      <p className="text-sm text-gray-300 mt-1">{selectedPhoto.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {format(new Date(selectedPhoto.created_at), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default PhotoGallery;
