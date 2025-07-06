
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [formData, setFormData] = useState({
    customerId: appointment.customer_id || '',
    date: parseDateFromDatabase(appointment.appointment_date),
    time: convertTimeToInput(appointment.appointment_time),
    service: appointment.service_type,
    notes: appointment.notes || '',
    status: appointment.status
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
          customers={[]} // No longer needed since CustomerSelect handles its own data
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isLoading={updateAppointmentMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};
