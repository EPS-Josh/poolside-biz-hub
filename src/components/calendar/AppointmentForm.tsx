
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppointmentFormProps {
  onSuccess: () => void;
  selectedDate?: Date | null;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  onSuccess,
  selectedDate
}) => {
  const [formData, setFormData] = useState({
    customerId: '',
    date: selectedDate || new Date(),
    time: '',
    service: '',
    notes: '',
    status: 'scheduled'
  });

  // Mock customers data - in real app, this would come from your backend
  const customers = [
    { id: '1', name: 'John Smith', address: '123 Main St' },
    { id: '2', name: 'Jane Doe', address: '456 Oak Ave' },
    { id: '3', name: 'Bob Johnson', address: '789 Pine Rd' }
  ];

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
    
    // Here you would typically save to your backend
    console.log('Creating appointment:', formData);
    
    // Show success message
    alert('Appointment created successfully!');
    
    // Call success callback
    onSuccess();
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
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map(customer => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} - {customer.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Service Selection */}
        <div className="space-y-2">
          <Label htmlFor="service">Service</Label>
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
          <Label>Date</Label>
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
                onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Selection */}
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
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
        <Button type="submit">
          Create Appointment
        </Button>
      </div>
    </form>
  );
};
