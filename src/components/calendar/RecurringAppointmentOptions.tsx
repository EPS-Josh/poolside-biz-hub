import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CalendarDays, Repeat } from 'lucide-react';

interface RecurringAppointmentOptionsProps {
  value: 'single' | 'future' | 'all';
  onChange: (value: 'single' | 'future' | 'all') => void;
  action: 'update' | 'delete';
}

export const RecurringAppointmentOptions: React.FC<RecurringAppointmentOptionsProps> = ({
  value,
  onChange,
  action
}) => {
  const actionText = action === 'update' ? 'update' : 'delete';
  const ActionText = action === 'update' ? 'Update' : 'Delete';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="h-4 w-4" />
          Recurring Appointment
        </CardTitle>
        <CardDescription>
          This appointment is part of a recurring series. How would you like to {actionText} it?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={value} onValueChange={onChange} className="space-y-4">
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="single" id="single" className="mt-1" />
            <div className="space-y-1">
              <Label htmlFor="single" className="flex items-center gap-2 font-medium">
                <Calendar className="h-4 w-4" />
                {ActionText} only this occurrence
              </Label>
              <p className="text-sm text-muted-foreground">
                Only this specific appointment will be {action === 'update' ? 'modified' : 'removed'}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="future" id="future" className="mt-1" />
            <div className="space-y-1">
              <Label htmlFor="future" className="flex items-center gap-2 font-medium">
                <CalendarDays className="h-4 w-4" />
                {ActionText} this and future occurrences
              </Label>
              <p className="text-sm text-muted-foreground">
                This appointment and all future ones in the series will be {action === 'update' ? 'modified' : 'removed'}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="all" id="all" className="mt-1" />
            <div className="space-y-1">
              <Label htmlFor="all" className="flex items-center gap-2 font-medium">
                <Repeat className="h-4 w-4" />
                {ActionText} all occurrences
              </Label>
              <p className="text-sm text-muted-foreground">
                All appointments in this recurring series will be {action === 'update' ? 'modified' : 'removed'}
              </p>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};