
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIME_SLOTS } from './constants';

interface DateTimeSelectProps {
  date: Date;
  time: string;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: string) => void;
}

export const DateTimeSelect: React.FC<DateTimeSelectProps> = ({
  date,
  time,
  onDateChange,
  onTimeChange
}) => {
  return (
    <>
      {/* Date Selection */}
      <div className="space-y-2">
        <Label>Date * (Phoenix Time)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selectedDate) => {
                if (selectedDate) {
                  console.log('Calendar date selected (Phoenix Time):', selectedDate);
                  onDateChange(selectedDate);
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
        <Select value={time} onValueChange={onTimeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a time" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto">
            {TIME_SLOTS.map(timeSlot => (
              <SelectItem key={timeSlot} value={timeSlot}>
                {timeSlot}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};
