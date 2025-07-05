
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';

interface CalendarNavigationHeaderProps {
  viewType: 'month' | 'week' | 'day';
  currentDate: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export const CalendarNavigationHeader: React.FC<CalendarNavigationHeaderProps> = ({
  viewType,
  currentDate,
  onNavigate,
}) => {
  const getTitle = () => {
    switch (viewType) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        return `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`;
      case 'day':
        return format(currentDate, 'MMMM d, yyyy');
      default:
        return '';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <Button variant="outline" size="sm" onClick={() => onNavigate('prev')}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <h2 className="text-lg sm:text-xl font-semibold text-center">
        {getTitle()}
      </h2>
      
      <Button variant="outline" size="sm" onClick={() => onNavigate('next')}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
