import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
    date: selectedDate || new Date(),
    time: '',
    service: '',
    notes: '',
    status: 'scheduled'
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

  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Format date as YYYY-MM-DD in local timezone
      const localDateString = format(appointmentData.date, 'yyyy-MM-dd');
      
      console.log('Creating appointment with date:', localDateString);

      const { error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          customer_id: appointmentData.customerId || null,
          appointment_date: localDateString,
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

  const services = [
    'Weekly Pool Cleaning',
    'Chemical Balancing',
    'Equipment Repair',
    'Pool Opening',
    'Pool Closing',
    'Equipment Installation',
    'Emergency Service'
  ];

  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.service || !formData.time) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    console.log('Form data before submission:', {
      ...formData,
      dateString: format(formData.date, 'yyyy-MM-dd')
    });
    
    createAppointmentMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Selection */}
        <div className="space-y-2">
          <Label htmlFor="customer">Customer</Label>
          <Select value={formData.customerId} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, customerId: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select a customer (optional)" />
            </SelectTrigger>
            <SelectContent>
              {customers.map(customer => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.first_name} {customer.last_name} - {customer.address}, {customer.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Service Selection */}
        <div className="space-y-2">
          <Label htmlFor="service">Service *</Label>
          <Select value={formData.service} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, service: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select a service" />
            </SelectTrigger>
            <SelectContent>
              {services.map(service => (
                <SelectItem key={service} value={service}>
                  {service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Selection */}
        <div className="space-y-2">
          <Label>Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={(date) => {
                  if (date) {
                    console.log('Date selected:', date);
                    console.log('Date formatted:', format(date, 'yyyy-MM-dd'));
                    setFormData(prev => ({ ...prev, date }));
                  }
                }}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Selection */}
        <div className="space-y-2">
          <Label htmlFor="time">Time *</Label>
          <Select value={formData.time} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, time: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select a time" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map(time => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => 
          setFormData(prev => ({ ...prev, status: value }))
        }>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
