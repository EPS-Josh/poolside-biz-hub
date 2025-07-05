
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
    status: 'scheduled'
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      if (!user?.id) throw new Error('User not authenticated');

      const dateString = formatDateForDatabase(appointmentData.date);
      
      console.log('Creating appointment with MST date:', dateString);
      console.log('Original date object:', appointmentData.date);

      const { error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          customer_id: appointmentData.customerId || null,
          appointment_date: dateString,
          appointment_time: appointmentData.time,
          service_type: appointmentData.service,
          status: appointmentData.status,
          notes: appointmentData.notes || null
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment created successfully!');
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
          {createAppointmentMutation.isPending ? 'Creating...' : 'Create Appointment'}
        </Button>
      </div>
    </form>
  );
};
