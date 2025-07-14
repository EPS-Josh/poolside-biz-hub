
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ServiceRecordForm } from '@/components/ServiceRecordForm';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { formatDateForDatabase } from '@/utils/dateUtils';

interface AppointmentServiceRecordFormProps {
  appointmentId: string;
  customerId: string;
  appointmentDate: string;
  appointmentTime: string;
  onServiceRecordCreated?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AppointmentServiceRecordForm: React.FC<AppointmentServiceRecordFormProps> = ({
  appointmentId,
  customerId,
  appointmentDate,
  appointmentTime,
  onServiceRecordCreated,
  isOpen,
  onOpenChange
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;

  const handleServiceRecordCreated = () => {
    setOpen(false);
    onServiceRecordCreated?.();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return format(date, 'h:mm a');
    } catch (error) {
      return timeString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span>Add Service Record</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Service Record for Appointment</span>
          </DialogTitle>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(appointmentDate)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{formatTime(appointmentTime)}</span>
            </div>
          </div>
        </DialogHeader>
        
        <ServiceRecordForm
          customerId={customerId}
          onSuccess={handleServiceRecordCreated}
        />
      </DialogContent>
    </Dialog>
  );
};
