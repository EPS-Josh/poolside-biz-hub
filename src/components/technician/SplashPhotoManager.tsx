import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImagePlus, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import compressImage from '@/utils/imageCompression';

interface SplashPhoto {
  id: string;
  file_name: string;
  file_path: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

export const SplashPhotoManager: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<SplashPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPhotos = async () => {
    const { data, error } = await supabase
      .from('splash_photos')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data) setPhotos(data);
    setLoading(false);
  };

  useEffect(() => { fetchPhotos(); }, []);

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from('splash-photos').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        let fileToUpload: File = file;
        
        // Compress if image
        if (file.type.startsWith('image/')) {
          const compressed = await compressImage(file);
          fileToUpload = compressed;
        }

        const ext = fileToUpload.name.split('.').pop();
        const filePath = `${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('splash-photos')
          .upload(filePath, fileToUpload);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('splash_photos')
          .insert({
            file_name: file.name,
            file_path: filePath,
            display_order: photos.length,
          });

        if (dbError) throw dbError;
      }

      toast({ title: 'Photos uploaded', description: 'Splash page photos updated.' });
      fetchPhotos();
    } catch (err: any) {
      console.error('Upload error:', err);
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (photo: SplashPhoto) => {
    setDeletingId(photo.id);
    try {
      const { error: storageError } = await supabase.storage
        .from('splash-photos')
        .remove([photo.file_path]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('splash_photos')
        .delete()
        .eq('id', photo.id);
      if (dbError) throw dbError;

      toast({ title: 'Photo removed' });
      fetchPhotos();
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Splash Page Photos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload */}
        <div>
          <Label htmlFor="splash-upload" className="sr-only">Upload photos</Label>
          <input
            ref={fileInputRef}
            id="splash-upload"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><ImagePlus className="h-4 w-4" /> Add Photos</>
            )}
          </Button>
        </div>

        {/* Photo grid */}
        {loading ? (
          <div className="text-sm text-muted-foreground text-center py-4">Loading...</div>
        ) : photos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No splash photos yet. The default image will be shown.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group rounded-md overflow-hidden aspect-square">
                <img
                  src={getPublicUrl(photo.file_path)}
                  alt={photo.description || photo.file_name}
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(photo)}
                  disabled={deletingId === photo.id}
                >
                  {deletingId === photo.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
