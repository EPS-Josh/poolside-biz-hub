
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDateForDatabase } from '@/utils/dateUtils';

export const useEditAppointment = (appointment: any, onClose: () => void) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const updateAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      if (!user?.id) throw new Error('User not authenticated');

      const dateString = formatDateForDatabase(appointmentData.date);
      
      console.log('Updating appointment with MST date:', dateString);
      console.log('Original date object:', appointmentData.date);
      console.log('Time being saved:', appointmentData.time);

      const { error } = await supabase
        .from('appointments')
        .update({
          customer_id: appointmentData.customerId || null,
          appointment_date: dateString,
          appointment_time: appointmentData.time,
          service_type: appointmentData.service,
          status: appointmentData.status,
          notes: appointmentData.notes || null
        })
        .eq('id', appointment.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment updated successfully!');
      onClose();
    },
    onError: (error) => {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
  });

  return { updateAppointmentMutation };
};
