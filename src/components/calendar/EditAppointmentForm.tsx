
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SERVICES, TIME_SLOTS } from './constants';
import { CustomerSelect } from './CustomerSelect';

interface EditAppointmentFormProps {
  formData: {
    customerId: string;
    date: Date;
    time: string;
    service: string;
    notes: string;
    status: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  customers: any[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const EditAppointmentForm: React.FC<EditAppointmentFormProps> = ({
  formData,
  setFormData,
  customers,
  onSubmit,
  onCancel,
  isLoading
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Selection */}
        <CustomerSelect
          value={formData.customerId}
          onChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
        />

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
              {SERVICES.map(service => (
                <SelectItem key={service} value={service}>
                  {service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Selection */}
        <div className="space-y-2">
          <Label>Date * (Phoenix Time)</Label>
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
                    console.log('Calendar date selected for edit (Phoenix Time):', date);
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
          <Label htmlFor="time">Time * (Phoenix Time)</Label>
          <Select value={formData.time} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, time: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select a time" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto">
              {TIME_SLOTS.map(time => (
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
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? 'Updating...' : 'Update Appointment'}
        </Button>
      </div>
    </form>
  );
};
