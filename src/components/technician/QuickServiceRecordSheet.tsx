import React, { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Camera, Image, X, Loader2, WifiOff, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { TechnicianAppointment, useOfflineServiceRecords } from '@/hooks/useTechnicianAppointments';
import { formatPhoenixDateForDatabase, getCurrentPhoenixDate } from '@/utils/phoenixTimeUtils';
import { compressImage } from '@/utils/imageCompression';

interface QuickServiceRecordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: TechnicianAppointment | null;
  onSuccess: () => void;
}

export const QuickServiceRecordSheet: React.FC<QuickServiceRecordSheetProps> = ({
  open,
  onOpenChange,
  appointment,
  onSuccess
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addToQueue } = useOfflineServiceRecords();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    work_performed: '',
    chemicals_added: '',
    technician_notes: '',
    service_status: 'completed',
  });

  const resetForm = () => {
    setFormData({
      work_performed: '',
      chemicals_added: '',
      technician_notes: '',
      service_status: 'completed',
    });
    setPhotos([]);
    setPhotoPreview([]);
  };

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    setPhotos(prev => [...prev, ...newFiles]);
    
    // Create previews
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    event.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreview(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (customerId: string): Promise<string[]> => {
    const uploadedPaths: string[] = [];
    
    for (const photo of photos) {
      // Compress the image before upload
      const compressedPhoto = await compressImage(photo);
      
      const fileExt = compressedPhoto.name.split('.').pop() || photo.name.split('.').pop();
      const fileName = `${customerId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('customer-photos')
        .upload(fileName, compressedPhoto);

      if (uploadError) {
        console.error('Photo upload error:', uploadError);
        continue;
      }

      // Save to customer_photos table with compressed file size
      await supabase.from('customer_photos').insert({
        customer_id: customerId,
        file_name: photo.name,
        file_path: fileName,
        file_size: compressedPhoto.size,
        file_type: compressedPhoto.type,
        description: 'Service record photo'
      });

      uploadedPaths.push(fileName);
    }

    return uploadedPaths;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !appointment) return;

    setLoading(true);

    const serviceRecord = {
      customer_id: appointment.customer_id,
      user_id: user.id,
      service_date: appointment.appointment_date || formatPhoenixDateForDatabase(getCurrentPhoenixDate()),
      service_time: appointment.appointment_time,
      service_type: appointment.service_type,
      work_performed: formData.work_performed || null,
      chemicals_added: formData.chemicals_added || null,
      technician_notes: formData.technician_notes || null,
      service_status: formData.service_status,
      invoicing_status: 'ready_for_qb',
    };

    try {
      // Check if online
      if (!navigator.onLine) {
        // Save to offline queue
        addToQueue({
          ...serviceRecord,
          photos: photos.map(p => ({ name: p.name, size: p.size, type: p.type }))
        });
        
        toast({
          title: 'Saved Offline',
          description: 'Service record will be synced when you\'re back online',
        });
        
        resetForm();
        onOpenChange(false);
        onSuccess();
        return;
      }

      // Upload photos first if any
      let photosPaths: string[] = [];
      if (photos.length > 0) {
        photosPaths = await uploadPhotos(appointment.customer_id);
      }

      // Create service record
      const { error } = await supabase
        .from('service_records')
        .insert({
          ...serviceRecord,
          photos_taken: photosPaths.length > 0 ? photosPaths : null
        });

      if (error) throw error;

      // Update appointment status
      await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointment.id);

      toast({
        title: 'Success',
        description: 'Service record saved successfully',
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error saving service record:', error);
      toast({
        title: 'Error',
        description: 'Failed to save service record',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  const isOffline = !navigator.onLine;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            Quick Service Record
            {isOffline && (
              <Badge variant="secondary" className="gap-1">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {appointment.customers.first_name} {appointment.customers.last_name} • {appointment.service_type}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo capture */}
          <div className="space-y-2">
            <Label>Photos</Label>
            <div className="flex gap-2">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoCapture}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoCapture}
              />
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
                Camera
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="h-4 w-4" />
                Gallery
              </Button>
            </div>
            
            {/* Photo previews */}
            {photoPreview.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {photoPreview.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="h-16 w-16 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Work performed */}
          <div className="space-y-2">
            <Label htmlFor="work_performed">Work Performed</Label>
            <Textarea
              id="work_performed"
              value={formData.work_performed}
              onChange={(e) => setFormData(prev => ({ ...prev, work_performed: e.target.value }))}
              placeholder="Describe the work completed..."
              className="min-h-[80px]"
            />
          </div>

          {/* Chemicals added */}
          <div className="space-y-2">
            <Label htmlFor="chemicals_added">Chemicals Added</Label>
            <Textarea
              id="chemicals_added"
              value={formData.chemicals_added}
              onChange={(e) => setFormData(prev => ({ ...prev, chemicals_added: e.target.value }))}
              placeholder="List chemicals and amounts..."
              className="min-h-[60px]"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="technician_notes">Notes</Label>
            <Textarea
              id="technician_notes"
              value={formData.technician_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, technician_notes: e.target.value }))}
              placeholder="Any additional notes..."
              className="min-h-[60px]"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Service Status</Label>
            <Select
              value={formData.service_status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, service_status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="requires_follow_up">Requires Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit buttons */}
          <div className="flex gap-2 pt-4 sticky bottom-0 bg-background pb-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-2"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isOffline ? (
                <WifiOff className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {loading ? 'Saving...' : isOffline ? 'Save Offline' : 'Save Record'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
