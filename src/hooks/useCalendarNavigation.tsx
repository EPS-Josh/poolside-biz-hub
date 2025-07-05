
import { addMonths, subMonths, addWeeks, subWeeks, addDays } from 'date-fns';

export const useCalendarNavigation = (
  viewType: 'month' | 'week' | 'day',
  currentDate: Date,
  onDateChange: (date: Date) => void
) => {
  const navigateDate = (direction: 'prev' | 'next') => {
    let newDate: Date;
    
    switch (viewType) {
      case 'month':
        newDate = direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
        break;
      case 'week':
        newDate = direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1);
        break;
      case 'day':
        newDate = direction === 'next' ? addDays(currentDate, 1) : addDays(currentDate, -1);
        break;
      default:
        return;
    }
    
    onDateChange(newDate);
  };

  return { navigateDate };
};
