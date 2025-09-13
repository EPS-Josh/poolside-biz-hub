
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
      const { recurringOption } = appointmentData;
      
      console.log('Updating appointment with Phoenix date:', dateString);
      console.log('Recurring option:', recurringOption);

      // Handle different recurring update scenarios
      if (recurringOption === 'single' || !appointment.is_recurring) {
        // Update only this appointment
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
      } else if (recurringOption === 'future') {
        // Update this and all future appointments in the series
        const parentId = appointment.recurring_parent_id || appointment.id;
        
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
          .or(`id.eq.${appointment.id},and(recurring_parent_id.eq.${parentId},appointment_date.gte.${appointment.appointment_date})`);
        
        if (error) throw error;
      } else if (recurringOption === 'all') {
        // Update all appointments in the series
        const parentId = appointment.recurring_parent_id || appointment.id;
        
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
          .or(`id.eq.${parentId},recurring_parent_id.eq.${parentId}`);
        
        if (error) throw error;
      }
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

  const deleteAppointmentMutation = useMutation({
    mutationFn: async (deleteData: { recurringOption: 'single' | 'future' | 'all' }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { recurringOption } = deleteData;
      
      console.log('Deleting appointment with recurring option:', recurringOption);

      // Handle different recurring delete scenarios
      if (recurringOption === 'single' || !appointment.is_recurring) {
        // Delete only this appointment
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', appointment.id);
        
        if (error) throw error;
      } else if (recurringOption === 'future') {
        // Delete this and all future appointments in the series
        const parentId = appointment.recurring_parent_id || appointment.id;
        
        const { error } = await supabase
          .from('appointments')
          .delete()
          .or(`id.eq.${appointment.id},and(recurring_parent_id.eq.${parentId},appointment_date.gte.${appointment.appointment_date})`);
        
        if (error) throw error;
      } else if (recurringOption === 'all') {
        // Delete all appointments in the series
        const parentId = appointment.recurring_parent_id || appointment.id;
        
        const { error } = await supabase
          .from('appointments')
          .delete()
          .or(`id.eq.${parentId},recurring_parent_id.eq.${parentId}`);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment deleted successfully!');
      onClose();
    },
    onError: (error) => {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
    }
  });

  return { updateAppointmentMutation, deleteAppointmentMutation };
};
