import React, { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Camera, Image, X, Loader2, WifiOff, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { TechnicianAppointment, useOfflineServiceRecords } from '@/hooks/useTechnicianAppointments';
import { formatPhoenixDateForDatabase, getCurrentPhoenixDate } from '@/utils/phoenixTimeUtils';
import { ServiceRecordWizard } from '@/components/ServiceRecordWizard';

interface TechnicianServiceRecordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: TechnicianAppointment | null;
  onSuccess: () => void;
}

interface PartUsed {
  inventoryItemId: string;
  quantity: number;
  itemName: string;
  unitPrice: number | null;
}

export const TechnicianServiceRecordSheet: React.FC<TechnicianServiceRecordSheetProps> = ({
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
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([]);
  const [hasStandaloneSpa, setHasStandaloneSpa] = useState(false);
  
  const currentPhoenixDate = getCurrentPhoenixDate();
  const [formData, setFormData] = useState({
    service_date: formatPhoenixDateForDatabase(currentPhoenixDate),
    service_time: '',
    service_type: '',
    technician_name: '',
    work_performed: '',
    chemicals_added: '',
    equipment_serviced: '',
    customer_notes: '',
    technician_notes: '',
    next_service_date: '',
    total_time_minutes: '',
    service_status: 'completed',
    invoicing_status: 'ready_for_qb',
    needs_follow_up: false,
    follow_up_notes: '',
    follow_up_date: '',
    before_readings: {
      total_hardness: '',
      total_chlorine_bromine: '',
      free_chlorine: '',
      ph: '',
      total_alkalinity: '',
      cyanuric_acid: ''
    },
    after_readings: {
      total_hardness: '',
      total_chlorine_bromine: '',
      free_chlorine: '',
      ph: '',
      total_alkalinity: '',
      cyanuric_acid: ''
    },
    spa_before_readings: {
      total_hardness: '',
      total_chlorine_bromine: '',
      free_chlorine: '',
      ph: '',
      total_alkalinity: '',
      cyanuric_acid: ''
    },
    spa_after_readings: {
      total_hardness: '',
      total_chlorine_bromine: '',
      free_chlorine: '',
      ph: '',
      total_alkalinity: '',
      cyanuric_acid: ''
    }
  });

  // Update form data when appointment changes
  useEffect(() => {
    if (appointment) {
      setFormData(prev => ({
        ...prev,
        service_date: appointment.appointment_date || formatPhoenixDateForDatabase(getCurrentPhoenixDate()),
        service_time: appointment.appointment_time || '',
        service_type: appointment.service_type || '',
      }));
    }
  }, [appointment]);

  // Fetch customer service details to check spa type
  useEffect(() => {
    const fetchSpaType = async () => {
      if (!appointment?.customer_id) return;
      
      const { data } = await supabase
        .from('customer_service_details')
        .select('spa_type')
        .eq('customer_id', appointment.customer_id)
        .maybeSingle();
      
      if (data?.spa_type === 'Standalone' || data?.spa_type === 'Hot Tub') {
        setHasStandaloneSpa(true);
      }
    };
    fetchSpaType();
  }, [appointment?.customer_id]);

  const resetForm = () => {
    const resetPhoenixDate = getCurrentPhoenixDate();
    setFormData({
      service_date: appointment?.appointment_date || formatPhoenixDateForDatabase(resetPhoenixDate),
      service_time: appointment?.appointment_time || '',
      service_type: appointment?.service_type || '',
      technician_name: '',
      work_performed: '',
      chemicals_added: '',
      equipment_serviced: '',
      customer_notes: '',
      technician_notes: '',
      next_service_date: '',
      total_time_minutes: '',
      service_status: 'completed',
      invoicing_status: 'ready_for_qb',
      needs_follow_up: false,
      follow_up_notes: '',
      follow_up_date: '',
      before_readings: { total_hardness: '', total_chlorine_bromine: '', free_chlorine: '', ph: '', total_alkalinity: '', cyanuric_acid: '' },
      after_readings: { total_hardness: '', total_chlorine_bromine: '', free_chlorine: '', ph: '', total_alkalinity: '', cyanuric_acid: '' },
      spa_before_readings: { total_hardness: '', total_chlorine_bromine: '', free_chlorine: '', ph: '', total_alkalinity: '', cyanuric_acid: '' },
      spa_after_readings: { total_hardness: '', total_chlorine_bromine: '', free_chlorine: '', ph: '', total_alkalinity: '', cyanuric_acid: '' }
    });
    setPartsUsed([]);
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
      const fileExt = photo.name.split('.').pop();
      const fileName = `${customerId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('customer-photos')
        .upload(fileName, photo);

      if (uploadError) {
        console.error('Photo upload error:', uploadError);
        continue;
      }

      // Save to customer_photos table
      await supabase.from('customer_photos').insert({
        customer_id: customerId,
        file_name: photo.name,
        file_path: fileName,
        file_size: photo.size,
        file_type: photo.type,
        description: 'Service record photo'
      });

      uploadedPaths.push(fileName);
    }

    return uploadedPaths;
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateReadings = (type: 'before_readings' | 'after_readings' | 'spa_before_readings' | 'spa_after_readings', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !appointment) return;

    setLoading(true);

    const serviceRecord = {
      customer_id: appointment.customer_id,
      user_id: user.id,
      service_date: formData.service_date,
      service_time: formData.service_time || null,
      service_type: formData.service_type,
      technician_name: formData.technician_name || null,
      work_performed: formData.work_performed || null,
      chemicals_added: formData.chemicals_added || null,
      equipment_serviced: formData.equipment_serviced || null,
      customer_notes: formData.customer_notes || null,
      technician_notes: formData.technician_notes || null,
      next_service_date: formData.next_service_date || null,
      total_time_minutes: formData.total_time_minutes ? parseInt(formData.total_time_minutes) : null,
      service_status: formData.service_status,
      before_readings: { ...formData.before_readings, ...(hasStandaloneSpa ? { spa: formData.spa_before_readings } : {}) },
      after_readings: { ...formData.after_readings, ...(hasStandaloneSpa ? { spa: formData.spa_after_readings } : {}) },
      parts_used: partsUsed.length > 0 ? JSON.parse(JSON.stringify(partsUsed)) : null,
      invoicing_status: formData.invoicing_status,
      needs_follow_up: formData.needs_follow_up,
      follow_up_notes: formData.follow_up_notes || null,
      follow_up_date: formData.follow_up_date || null
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
      <SheetContent side="bottom" className="h-[95vh] overflow-y-auto p-0">
        <div className="p-4 border-b sticky top-0 bg-background z-10">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2">
              Service Record
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

          {/* Photo capture section - always visible at top */}
          <div className="mt-4 space-y-2">
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
        </div>

        <div className="p-4">
          <ServiceRecordWizard
            formData={formData}
            updateFormData={updateFormData}
            updateReadings={updateReadings}
            partsUsed={partsUsed}
            onPartsUsedChange={setPartsUsed}
            hasStandaloneSpa={hasStandaloneSpa}
            loading={loading}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            submitButtonContent={
              loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : isOffline ? (
                <>
                  <WifiOff className="h-4 w-4 mr-2" />
                  Save Offline
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Record
                </>
              )
            }
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};
