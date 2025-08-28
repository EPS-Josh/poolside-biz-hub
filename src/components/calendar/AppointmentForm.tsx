
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { createMSTDate, formatDateForDatabase, getCurrentMSTDate } from '@/utils/dateUtils';
import { CustomerSelect } from './CustomerSelect';
import { ServiceSelect } from './ServiceSelect';
import { DateTimeSelect } from './DateTimeSelect';
import { StatusSelect } from './StatusSelect';
import { RecurringOptions } from './RecurringOptions';

interface AppointmentFormProps {
  onSuccess: () => void;
  selectedDate?: Date | null;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  onSuccess,
  selectedDate
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    customerId: '',
    date: selectedDate || getCurrentMSTDate(),
    time: '',
    service: '',
    notes: '',
    status: 'scheduled',
    isRecurring: false,
    frequency: '',
    endDate: null as Date | null
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      if (!user?.id) throw new Error('User not authenticated');

      const appointments = [];
      const startDate = appointmentData.date;
      
      if (appointmentData.isRecurring && appointmentData.frequency && appointmentData.endDate) {
        // Generate recurring appointments
        const currentDate = new Date(startDate);
        let occurrenceNumber = 1;
        
        while (currentDate <= appointmentData.endDate) {
          const dateString = formatDateForDatabase(currentDate);
          
          appointments.push({
            user_id: user.id,
            customer_id: appointmentData.customerId || null,
            appointment_date: dateString,
            appointment_time: appointmentData.time,
            service_type: appointmentData.service,
            status: appointmentData.status,
            notes: appointmentData.notes || null,
            is_recurring: true,
            recurring_frequency: appointmentData.frequency,
            recurring_end_date: formatDateForDatabase(appointmentData.endDate),
            recurring_parent_id: occurrenceNumber === 1 ? null : undefined, // Will be set after first insert
            occurrence_number: occurrenceNumber
          });
          
          // Increment date based on frequency
          switch (appointmentData.frequency) {
            case 'daily':
              currentDate.setDate(currentDate.getDate() + 1);
              break;
            case 'weekly':
              currentDate.setDate(currentDate.getDate() + 7);
              break;
            case 'biweekly':
              currentDate.setDate(currentDate.getDate() + 14);
              break;
            case 'monthly':
              currentDate.setMonth(currentDate.getMonth() + 1);
              break;
          }
          
          occurrenceNumber++;
        }
      } else {
        // Single appointment
        const dateString = formatDateForDatabase(startDate);
        appointments.push({
          user_id: user.id,
          customer_id: appointmentData.customerId || null,
          appointment_date: dateString,
          appointment_time: appointmentData.time,
          service_type: appointmentData.service,
          status: appointmentData.status,
          notes: appointmentData.notes || null,
          is_recurring: false
        });
      }
      
      if (appointments.length === 1) {
        // Single appointment
        const { error } = await supabase
          .from('appointments')
          .insert(appointments[0]);
        if (error) throw error;
      } else {
        // Multiple appointments - insert first one to get parent ID
        const { data: firstAppt, error: firstError } = await supabase
          .from('appointments')
          .insert(appointments[0])
          .select()
          .single();
        
        if (firstError) throw firstError;
        
        // Update remaining appointments with parent ID
        const remainingAppts = appointments.slice(1).map(appt => ({
          ...appt,
          recurring_parent_id: firstAppt.id
        }));
        
        if (remainingAppts.length > 0) {
          const { error: remainingError } = await supabase
            .from('appointments')
            .insert(remainingAppts);
          
          if (remainingError) throw remainingError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(formData.isRecurring ? 'Recurring appointments created successfully!' : 'Appointment created successfully!');
      onSuccess();
    },
    onError: (error) => {
      console.error('Error creating appointment:', error);
      toast.error('Failed to create appointment');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.service || !formData.time) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (formData.isRecurring && (!formData.frequency || !formData.endDate)) {
      toast.error('Please fill in recurring frequency and end date');
      return;
    }
    
    console.log('Submitting appointment with MST date:', formData.date);
    
    createAppointmentMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomerSelect
          value={formData.customerId}
          onChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
        />

        <ServiceSelect
          value={formData.service}
          onChange={(value) => setFormData(prev => ({ ...prev, service: value }))}
        />

        <DateTimeSelect
          date={formData.date}
          time={formData.time}
          onDateChange={(date) => setFormData(prev => ({ ...prev, date }))}
          onTimeChange={(time) => setFormData(prev => ({ ...prev, time }))}
        />
      </div>

      <StatusSelect
        value={formData.status}
        onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
      />

      {/* Recurring Options */}
      <RecurringOptions
        isRecurring={formData.isRecurring}
        frequency={formData.frequency}
        endDate={formData.endDate}
        onRecurringChange={(isRecurring) => setFormData(prev => ({ ...prev, isRecurring }))}
        onFrequencyChange={(frequency) => setFormData(prev => ({ ...prev, frequency }))}
        onEndDateChange={(endDate) => setFormData(prev => ({ ...prev, endDate }))}
      />

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Add any special instructions or notes..."
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createAppointmentMutation.isPending}
        >
          {createAppointmentMutation.isPending 
            ? 'Creating...' 
            : formData.isRecurring 
              ? 'Create Recurring Service' 
              : 'Create Appointment'
          }
        </Button>
      </div>
    </form>
  );
};
