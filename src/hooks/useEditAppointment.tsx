
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatPhoenixDateForDatabase } from '@/utils/phoenixTimeUtils';
import { convertTo24Hour } from '@/utils/timeUtils';

export const useEditAppointment = (appointment: any, onClose: () => void) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const updateAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      if (!user?.id) throw new Error('User not authenticated');

      const dateString = formatPhoenixDateForDatabase(appointmentData.date);
      const time24Hour = convertTo24Hour(appointmentData.time);
      
      console.log('Updating appointment with Phoenix date:', dateString);
      console.log('Original date object:', appointmentData.date);
      console.log('Time being saved (24-hour):', time24Hour);
      console.log('Original time (12-hour):', appointmentData.time);

      const { error } = await supabase
        .from('appointments')
        .update({
          customer_id: appointmentData.customerId || null,
          appointment_date: dateString,
          appointment_time: time24Hour,
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
