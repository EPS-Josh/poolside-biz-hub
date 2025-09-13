
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { parseDateFromDatabase } from '@/utils/dateUtils';
import { convertTimeToInput } from '@/utils/timeUtils';
import { EditAppointmentForm } from './EditAppointmentForm';
import { RecurringAppointmentOptions } from './RecurringAppointmentOptions';
import { useEditAppointment } from '@/hooks/useEditAppointment';
import { Trash2 } from 'lucide-react';

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

  const [recurringUpdateOption, setRecurringUpdateOption] = useState<'single' | 'future' | 'all'>('single');
  const [recurringDeleteOption, setRecurringDeleteOption] = useState<'single' | 'future' | 'all'>('single');
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);

  const isRecurring = appointment.is_recurring || appointment.recurring_parent_id;

  const { updateAppointmentMutation, deleteAppointmentMutation } = useEditAppointment(appointment, () => onOpenChange(false));

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
    
    updateAppointmentMutation.mutate({ 
      ...formData, 
      recurringOption: isRecurring ? recurringUpdateOption : 'single' 
    });
  };

  const handleDelete = () => {
    if (!showDeleteOptions && isRecurring) {
      setShowDeleteOptions(true);
      return;
    }
    
    deleteAppointmentMutation.mutate({
      recurringOption: isRecurring ? recurringDeleteOption : 'single'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Edit Appointment
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={updateAppointmentMutation.isPending || deleteAppointmentMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {showDeleteOptions && isRecurring && (
            <RecurringAppointmentOptions
              value={recurringDeleteOption}
              onChange={setRecurringDeleteOption}
              action="delete"
            />
          )}
          
          {isRecurring && !showDeleteOptions && (
            <RecurringAppointmentOptions
              value={recurringUpdateOption}
              onChange={setRecurringUpdateOption}
              action="update"
            />
          )}
          
          {!showDeleteOptions && (
            <EditAppointmentForm
              formData={formData}
              setFormData={setFormData}
              customers={[]} // No longer needed since CustomerSelect handles its own data
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
              isLoading={updateAppointmentMutation.isPending}
            />
          )}
          
          {showDeleteOptions && (
            <div className="flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowDeleteOptions(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteAppointmentMutation.isPending}
              >
                {deleteAppointmentMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
