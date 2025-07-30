
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, X, Image as ImageIcon, Expand } from 'lucide-react';

interface CustomerPhoto {
  id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  description?: string;
  created_at: string;
}

interface CustomerPhotosProps {
  customerId: string;
}

export const CustomerPhotos = ({ customerId }: CustomerPhotosProps) => {
  const [photos, setPhotos] = useState<CustomerPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<CustomerPhoto | null>(null);
  const { toast } = useToast();

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_photos')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast({
        title: 'Error',
        description: 'Failed to load photos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [customerId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    console.log('Starting photo upload for', files.length, 'files');

    try {
      for (const file of files) {
        console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);
        
        // Check file size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not a valid image.`);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${customerId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        console.log('Uploading to storage:', fileName);

        // Upload file to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('customer-photos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        console.log('Upload successful:', uploadData);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('customer-photos')
          .getPublicUrl(fileName);

        console.log('Public URL:', publicUrl);

        // Save photo record to database
        const { error: dbError } = await supabase
          .from('customer_photos')
          .insert({
            customer_id: customerId,
            file_name: file.name,
            file_path: publicUrl,
            file_size: file.size,
            file_type: file.type,
          });

        if (dbError) {
          console.error('Database insert error:', dbError);
          throw new Error(`Database save failed: ${dbError.message}`);
        }

        console.log('Photo record saved to database');
      }

      toast({
        title: 'Success',
        description: `${files.length} photo(s) uploaded successfully`,
      });

      // Refresh photos
      fetchPhotos();
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      const errorMessage = error?.message || 'Failed to upload photos';
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDeletePhoto = async (photoId: string, filePath: string) => {
    try {
      // Extract file path from URL for storage deletion
      const fileName = filePath.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('customer-photos')
          .remove([`${customerId}/${fileName}`]);
      }

      // Delete from database
      const { error } = await supabase
        .from('customer_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Photo deleted successfully',
      });

      // Refresh photos
      fetchPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete photo',
        variant: 'destructive',
      });
    }
  };

  const updatePhotoDescription = async (photoId: string, description: string) => {
    try {
      const { error } = await supabase
        .from('customer_photos')
        .update({ description })
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Photo description updated',
      });

      // Update local state
      setPhotos(prev => prev.map(photo => 
        photo.id === photoId ? { ...photo, description } : photo
      ));
    } catch (error) {
      console.error('Error updating photo description:', error);
      toast({
        title: 'Error',
        description: 'Failed to update description',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div>Loading photos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Camera className="h-5 w-5" />
          <span>Customer Photos</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Upload Section */}
        <div className="mb-6">
          <Label htmlFor="photo-upload" className="block mb-2">
            Upload Photos (Max 10MB each)
          </Label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Input
              id="photo-upload"
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.gif,.webp"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="flex-1 cursor-pointer"
              capture="environment"
            />
            <Button disabled={uploading} className="w-full sm:w-auto">
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Supports JPG, PNG, GIF, WebP formats. Tap to select from gallery or take photo.
          </p>
        </div>

        {/* Photos Grid */}
        {photos.length === 0 ? (
          <div className="text-center py-8">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No photos uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="border rounded-lg overflow-hidden">
                <div className="relative group">
                  <img
                    src={photo.file_path}
                    alt={photo.file_name}
                    className="w-full h-48 object-cover cursor-pointer transition-opacity hover:opacity-90"
                    onClick={() => setSelectedPhoto(photo)}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center cursor-pointer"
                       onClick={() => setSelectedPhoto(photo)}>
                    <Expand className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo.id, photo.file_path);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium mb-2">{photo.file_name}</p>
                  <Input
                    placeholder="Add description..."
                    value={photo.description || ''}
                    onChange={(e) => updatePhotoDescription(photo.id, e.target.value)}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(photo.created_at).toLocaleDateString()}
                    {photo.file_size && ` • ${Math.round(photo.file_size / 1024)} KB`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Image Preview Dialog */}
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
            {selectedPhoto && (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <img
                  src={selectedPhoto.file_path}
                  alt={selectedPhoto.file_name}
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4">
                  <h3 className="font-medium">{selectedPhoto.file_name}</h3>
                  {selectedPhoto.description && (
                    <p className="text-sm text-gray-300 mt-1">{selectedPhoto.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(selectedPhoto.created_at).toLocaleDateString()}
                    {selectedPhoto.file_size && ` • ${Math.round(selectedPhoto.file_size / 1024)} KB`}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
