
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { parseDateFromDatabase } from '@/utils/dateUtils';
import { convertTimeToInput } from '@/utils/timeUtils';
import { EditAppointmentForm } from './EditAppointmentForm';
import { useEditAppointment } from '@/hooks/useEditAppointment';

interface EditAppointmentDialogProps {
  appointment: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditAppointmentDialog: React.FC<EditAppointmentDialogProps> = ({
  appointment,
  isOpen,
  onOpenChange
}) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    customerId: appointment.customer_id || '',
    date: parseDateFromDatabase(appointment.appointment_date),
    time: convertTimeToInput(appointment.appointment_time),
    service: appointment.service_type,
    notes: appointment.notes || '',
    status: appointment.status
  });

  // Fetch customers for the dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name, address, city, state')
        .order('first_name');
      
      if (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user
  });

  const { updateAppointmentMutation } = useEditAppointment(appointment, () => onOpenChange(false));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.service || !formData.time) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    console.log('Form data before update:', {
      ...formData,
      dateInfo: {
        year: formData.date.getFullYear(),
        month: formData.date.getMonth() + 1,
        day: formData.date.getDate(),
        toString: formData.date.toString(),
        toISOString: formData.date.toISOString()
      }
    });
    
    updateAppointmentMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
        </DialogHeader>
        <EditAppointmentForm
          formData={formData}
          setFormData={setFormData}
          customers={customers}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isLoading={updateAppointmentMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};
