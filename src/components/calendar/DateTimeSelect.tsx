
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
          <PopoverContent className="w-auto p-0 z-[9999] pointer-events-auto" align="start">
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

      {/* Time Selection - native select for mobile touch scroll support */}
      <div className="space-y-2">
        <Label htmlFor="time">Time * (Phoenix Time)</Label>
        <select
          id="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="" disabled>Select a time</option>
          {TIME_SLOTS.map(timeSlot => (
            <option key={timeSlot} value={timeSlot}>
              {timeSlot}
            </option>
          ))}
        </select>
      </div>
    </>
  );
};
