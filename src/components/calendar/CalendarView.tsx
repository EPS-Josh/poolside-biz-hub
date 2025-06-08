import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CalendarViewProps {
  viewType: 'month' | 'week' | 'day';
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onDateSelect: (date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  viewType,
  currentDate,
  onDateChange,
  onDateSelect,
}) => {
  const { user } = useAuth();

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', viewType, currentDate],
    queryFn: async () => {
      // Calculate date range based on view type
      let startDate: Date;
      let endDate: Date;

      switch (viewType) {
        case 'month':
          startDate = startOfWeek(startOfMonth(currentDate));
          endDate = endOfWeek(endOfMonth(currentDate));
          break;
        case 'week':
          startDate = startOfWeek(currentDate);
          endDate = endOfWeek(currentDate);
          break;
        case 'day':
          startDate = currentDate;
          endDate = currentDate;
          break;
        default:
          startDate = currentDate;
          endDate = currentDate;
      }

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          customers (
            first_name,
            last_name
          )
        `)
        .gte('appointment_date', format(startDate, 'yyyy-MM-dd'))
        .lte('appointment_date', format(endDate, 'yyyy-MM-dd'))
        .order('appointment_date')
        .order('appointment_time');
      
      if (error) {
        console.error('Error fetching appointments:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user
  });

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

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.appointment_date), date)
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dayAppointments = getAppointmentsForDate(day);

        days.push(
          <div
            key={day.toString()}
            className={`min-h-24 p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
              !isSameMonth(day, monthStart) ? 'bg-gray-100 text-gray-400' : 'bg-white'
            } ${isSameDay(day, new Date()) ? 'bg-blue-50' : ''}`}
            onClick={() => onDateSelect(day)}
          >
            <div className="font-medium mb-1">{format(day, 'd')}</div>
            <div className="space-y-1">
              {dayAppointments.map(apt => {
                const customer = apt.customers;
                const customerName = customer ? `${customer.first_name} ${customer.last_name}` : 'No Customer';
                
                return (
                  <div
                    key={apt.id}
                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded truncate"
                  >
                    {apt.appointment_time} - {customerName}
                  </div>
                );
              })}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-0">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div>
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center font-medium text-gray-500 bg-gray-50">
              {day}
            </div>
          ))}
        </div>
        {/* Calendar Body */}
        <div>{rows}</div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div>
        {/* Week Header */}
        <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
          {days.map(day => (
            <div key={day.toString()} className="p-3 text-center bg-gray-50">
              <div className="font-medium">{format(day, 'EEE')}</div>
              <div className={`text-2xl ${isSameDay(day, new Date()) ? 'text-blue-600 font-bold' : 'text-gray-900'}`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        
        {/* Week Body */}
        <div className="grid grid-cols-7 gap-0">
          {days.map(day => {
            const dayAppointments = getAppointmentsForDate(day);
            
            return (
              <div
                key={day.toString()}
                className="min-h-96 p-2 border-r border-gray-200 cursor-pointer hover:bg-gray-50"
                onClick={() => onDateSelect(day)}
              >
                <div className="space-y-2">
                  {dayAppointments.map(apt => {
                    const customer = apt.customers;
                    const customerName = customer ? `${customer.first_name} ${customer.last_name}` : 'No Customer';
                    
                    return (
                      <div
                        key={apt.id}
                        className="bg-blue-100 text-blue-800 p-2 rounded text-sm"
                      >
                        <div className="font-medium">{apt.appointment_time}</div>
                        <div>{customerName}</div>
                        <div className="text-xs">{apt.service_type}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDate(currentDate);

    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h2>
        </div>

        <div className="space-y-4">
          {dayAppointments.length > 0 ? (
            dayAppointments.map(apt => {
              const customer = apt.customers;
              const customerName = customer ? `${customer.first_name} ${customer.last_name}` : 'No Customer';
              
              return (
                <div
                  key={apt.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-lg">{customerName}</div>
                      <div className="text-gray-600">{apt.service_type}</div>
                      <div className="text-sm text-gray-500">{apt.appointment_time}</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      apt.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {apt.status}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-gray-500">
              No appointments scheduled for this day
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Navigation Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-xl font-semibold">
          {viewType === 'month' && format(currentDate, 'MMMM yyyy')}
          {viewType === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`}
          {viewType === 'day' && format(currentDate, 'MMMM d, yyyy')}
        </h2>
        
        <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Content */}
      {viewType === 'month' && renderMonthView()}
      {viewType === 'week' && renderWeekView()}
      {viewType === 'day' && renderDayView()}
    </div>
  );
};
