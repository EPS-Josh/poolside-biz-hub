import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImagePlus, Trash2, Loader2, Image as ImageIcon, FolderOpen, Check } from 'lucide-react';
import { compressImage } from '@/utils/imageCompression';
import { cn } from '@/lib/utils';

interface SplashPhoto {
  id: string;
  file_name: string;
  file_path: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

interface CustomerPhoto {
  id: string;
  file_path: string;
  file_name: string;
  description: string | null;
  customer_id: string;
  customers?: { first_name: string; last_name: string } | null;
}

export const SplashPhotoManager: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<SplashPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Customer photos picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customerPhotos, setCustomerPhotos] = useState<CustomerPhoto[]>([]);
  const [loadingCustomerPhotos, setLoadingCustomerPhotos] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addingFromCustomer, setAddingFromCustomer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const getCustomerPhotoUrl = async (filePath: string) => {
    const { data } = await supabase.storage.from('customer-photos').createSignedUrl(filePath, 3600);
    return data?.signedUrl || '';
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        let fileToUpload: File = file;
        if (file.type.startsWith('image/')) {
          fileToUpload = await compressImage(file);
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

  // Open picker and load customer photos
  const openCustomerPhotoPicker = async () => {
    setPickerOpen(true);
    setSelectedIds(new Set());
    setSearchTerm('');
    setLoadingCustomerPhotos(true);

    const { data, error } = await supabase
      .from('customer_photos')
      .select('id, file_path, file_name, description, customer_id, customers(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!error && data) {
      // Generate signed URLs for previews
      const photosWithUrls = await Promise.all(
        data.map(async (p: any) => {
          const url = await getCustomerPhotoUrl(p.file_path);
          return { ...p, signedUrl: url };
        })
      );
      setCustomerPhotos(photosWithUrls);
    }
    setLoadingCustomerPhotos(false);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Copy selected customer photos to splash-photos bucket
  const handleAddFromCustomer = async () => {
    if (selectedIds.size === 0) return;
    setAddingFromCustomer(true);

    try {
      const selected = customerPhotos.filter(p => selectedIds.has(p.id));
      for (const photo of selected) {
        // Download from customer-photos bucket
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('customer-photos')
          .download(photo.file_path);
        if (downloadError || !fileData) throw downloadError || new Error('Download failed');

        // Upload to splash-photos bucket
        const ext = photo.file_name.split('.').pop() || 'jpg';
        const newPath = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('splash-photos')
          .upload(newPath, fileData);
        if (uploadError) throw uploadError;

        // Insert DB record
        const customerName = photo.customers
          ? `${photo.customers.first_name} ${photo.customers.last_name}`
          : '';
        const { error: dbError } = await supabase
          .from('splash_photos')
          .insert({
            file_name: photo.file_name,
            file_path: newPath,
            description: photo.description || (customerName ? `From ${customerName}` : null),
            display_order: photos.length,
          });
        if (dbError) throw dbError;
      }

      toast({ title: `${selectedIds.size} photo(s) added to splash page` });
      setPickerOpen(false);
      fetchPhotos();
    } catch (err: any) {
      console.error('Error adding customer photos:', err);
      toast({ title: 'Failed to add photos', description: err.message, variant: 'destructive' });
    } finally {
      setAddingFromCustomer(false);
    }
  };

  const filteredCustomerPhotos = customerPhotos.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name = p.customers ? `${p.customers.first_name} ${p.customers.last_name}`.toLowerCase() : '';
    return name.includes(term) || (p.description || '').toLowerCase().includes(term) || p.file_name.toLowerCase().includes(term);
  });

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Splash Page Photos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload buttons */}
          <div className="flex gap-2">
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
              className="flex-1 gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
              ) : (
                <><ImagePlus className="h-4 w-4" /> Upload New</>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={openCustomerPhotoPicker}
            >
              <FolderOpen className="h-4 w-4" /> From Customers
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

      {/* Customer Photo Picker Dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select from Customer Photos</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Search by customer name or description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <ScrollArea className="h-[400px]">
            {loadingCustomerPhotos ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCustomerPhotos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No customer photos found.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 p-1">
                {filteredCustomerPhotos.map((photo: any) => {
                  const isSelected = selectedIds.has(photo.id);
                  return (
                    <button
                      key={photo.id}
                      onClick={() => toggleSelection(photo.id)}
                      className={cn(
                        'relative rounded-md overflow-hidden aspect-square border-2 transition-all',
                        isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-muted-foreground/30'
                      )}
                    >
                      <img
                        src={photo.signedUrl}
                        alt={photo.description || photo.file_name}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      {photo.customers && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                          {photo.customers.first_name} {photo.customers.last_name}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} selected
            </span>
            <Button
              onClick={handleAddFromCustomer}
              disabled={selectedIds.size === 0 || addingFromCustomer}
              className="gap-2"
            >
              {addingFromCustomer ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
              ) : (
                <>Add to Splash Page</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
