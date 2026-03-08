import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImagePlus, Trash2, Loader2, Image as ImageIcon, FolderOpen, Check, Pencil } from 'lucide-react';
import { compressImage } from '@/utils/imageCompression';
import { applyWatermark } from '@/utils/watermarkUtils';
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
  signedUrl?: string;
}

export const SplashPhotoManager: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<SplashPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Caption editing
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [captionValue, setCaptionValue] = useState('');
  const [savingCaption, setSavingCaption] = useState(false);

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

  const extractStoragePath = (filePath: string) => {
    // file_path may be a full URL or a relative path
    const marker = '/customer-photos/';
    const idx = filePath.indexOf(marker);
    if (idx !== -1) return filePath.substring(idx + marker.length);
    return filePath;
  };

  const getCustomerPhotoUrl = async (filePath: string) => {
    const relativePath = extractStoragePath(filePath);
    const { data } = await supabase.storage.from('customer-photos').createSignedUrl(relativePath, 3600);
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
          fileToUpload = await applyWatermark(fileToUpload);
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

      toast({ title: 'Photos uploaded', description: 'Splash page photos updated with watermark.' });
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

  // Caption editing
  const startEditCaption = (photo: SplashPhoto) => {
    setEditingCaptionId(photo.id);
    setCaptionValue(photo.description || '');
  };

  const saveCaption = async () => {
    if (!editingCaptionId) return;
    setSavingCaption(true);
    try {
      const { error } = await supabase
        .from('splash_photos')
        .update({ description: captionValue || null })
        .eq('id', editingCaptionId);
      if (error) throw error;
      toast({ title: 'Caption saved' });
      setEditingCaptionId(null);
      fetchPhotos();
    } catch (err: any) {
      toast({ title: 'Failed to save caption', description: err.message, variant: 'destructive' });
    } finally {
      setSavingCaption(false);
    }
  };

  // Open picker and load customer photos
  const openCustomerPhotoPicker = async () => {
    setPickerOpen(true);
    setSelectedIds(new Set());
    setSearchTerm('');
    setLoadingCustomerPhotos(true);
    await fetchCustomerPhotos('');
    setLoadingCustomerPhotos(false);
  };

  const fetchCustomerPhotos = async (term: string) => {
    try {
      let results: any[] = [];

      if (term.trim()) {
        // First, find customer IDs matching the search name
        const { data: matchingCustomers } = await supabase
          .from('customers')
          .select('id')
          .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`);

        const matchingCustomerIds = (matchingCustomers || []).map(c => c.id);

        // Fetch photos by matching customer IDs
        if (matchingCustomerIds.length > 0) {
          const { data: customerNamePhotos } = await supabase
            .from('customer_photos')
            .select('id, file_path, file_name, description, customer_id, customers(first_name, last_name)')
            .in('customer_id', matchingCustomerIds)
            .order('created_at', { ascending: false })
            .limit(200);
          if (customerNamePhotos) results = customerNamePhotos as any[];
        }

        // Also fetch photos matching file_name or description
        const { data: textMatchPhotos } = await supabase
          .from('customer_photos')
          .select('id, file_path, file_name, description, customer_id, customers(first_name, last_name)')
          .or(`file_name.ilike.%${term}%,description.ilike.%${term}%`)
          .order('created_at', { ascending: false })
          .limit(200);

        if (textMatchPhotos) {
          const existingIds = new Set(results.map(r => r.id));
          for (const p of textMatchPhotos) {
            if (!existingIds.has(p.id)) {
              results.push(p);
              existingIds.add(p.id);
            }
          }
        }
      } else {
        // No search term - load recent photos
        const { data } = await supabase
          .from('customer_photos')
          .select('id, file_path, file_name, description, customer_id, customers(first_name, last_name)')
          .order('created_at', { ascending: false })
          .limit(200);
        if (data) results = data as any[];
      }

      const photosWithUrls = await Promise.all(
        results.map(async (p: any) => {
          const url = await getCustomerPhotoUrl(p.file_path);
          return { ...p, signedUrl: url };
        })
      );
      setCustomerPhotos(photosWithUrls);
    } catch (err) {
      console.error('Error fetching customer photos:', err);
    }
  };

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setLoadingCustomerPhotos(true);
      await fetchCustomerPhotos(value);
      setLoadingCustomerPhotos(false);
    }, 400);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Copy selected customer photos to splash-photos bucket (with watermark)
  const handleAddFromCustomer = async () => {
    if (selectedIds.size === 0) return;
    setAddingFromCustomer(true);

    try {
      const selected = customerPhotos.filter(p => selectedIds.has(p.id));
      for (const photo of selected) {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('customer-photos')
          .download(photo.file_path);
        if (downloadError || !fileData) throw downloadError || new Error('Download failed');

        // Apply watermark
        const ext = photo.file_name.split('.').pop() || 'jpg';
        const tempFile = new File([fileData], photo.file_name, { type: fileData.type || 'image/jpeg' });
        const watermarked = await applyWatermark(tempFile);

        const newPath = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('splash-photos')
          .upload(newPath, watermarked);
        if (uploadError) throw uploadError;

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

      toast({ title: `${selectedIds.size} photo(s) added with watermark` });
      setPickerOpen(false);
      fetchPhotos();
    } catch (err: any) {
      console.error('Error adding customer photos:', err);
      toast({ title: 'Failed to add photos', description: err.message, variant: 'destructive' });
    } finally {
      setAddingFromCustomer(false);
    }
  };

  // Photos are already filtered server-side
  const filteredCustomerPhotos = customerPhotos;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Splash Page Photos
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Photos are automatically watermarked with the company name &amp; logo.
          </p>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group rounded-md overflow-hidden border border-border">
                  <div className="aspect-square">
                    <img
                      src={getPublicUrl(photo.file_path)}
                      alt={photo.description || photo.file_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Caption display/edit */}
                  <div className="p-1.5 bg-card">
                    {editingCaptionId === photo.id ? (
                      <div className="flex gap-1">
                        <Input
                          value={captionValue}
                          onChange={e => setCaptionValue(e.target.value)}
                          placeholder="Add caption..."
                          className="h-7 text-xs"
                          onKeyDown={e => e.key === 'Enter' && saveCaption()}
                        />
                        <Button size="sm" className="h-7 px-2 text-xs" onClick={saveCaption} disabled={savingCaption}>
                          {savingCaption ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditCaption(photo)}
                        className="w-full flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
                      >
                        <Pencil className="h-3 w-3 shrink-0" />
                        <span className="truncate">{photo.description || 'Add caption...'}</span>
                      </button>
                    )}
                  </div>
                  {/* Delete button */}
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
            onChange={e => handleSearchChange(e.target.value)}
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
