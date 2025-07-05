
import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';
import { getAppointmentsForDate } from '@/utils/appointmentUtils';

interface MonthViewProps {
  currentDate: Date;
  appointments: any[];
  onDateSelect: (date: Date) => void;
  onAppointmentClick: (appointment: any, event: React.MouseEvent) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  appointments,
  onDateSelect,
  onAppointmentClick,
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const rows = [];
  let days = [];
  let day = startDate;

  console.log('MonthView rendering, current month:', format(monthStart, 'MMMM yyyy'));

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const dayAppointments = getAppointmentsForDate(appointments, day);
      const currentDay = new Date(day);
      const isCurrentMonth = isSameMonth(currentDay, monthStart);
      const isToday = isSameDay(currentDay, new Date());
      
      console.log(`Day ${format(currentDay, 'd')}: isCurrentMonth=${isCurrentMonth}, isToday=${isToday}`);

      days.push(
        <div
          key={day.toString()}
          className={`min-h-24 sm:min-h-32 p-1 sm:p-2 border-r border-b border-border cursor-pointer hover:bg-accent ${
            !isCurrentMonth ? 'bg-muted' : 'bg-background'
          } ${isToday ? 'bg-primary/10' : ''}`}
          onClick={() => onDateSelect(currentDay)}
        >
          <div className="flex flex-col h-full">
            <div className={`mb-1 sm:mb-2 leading-none font-black ${
              isToday 
                ? 'text-primary text-xl sm:text-2xl' 
                : isCurrentMonth 
                  ? 'text-foreground text-xl sm:text-2xl' 
                  : 'text-muted-foreground text-base sm:text-lg'
            }`}>
              {format(currentDay, 'd')}
            </div>
            <div className="flex-1 space-y-1 overflow-hidden">
              {dayAppointments.map(apt => {
                const customer = apt.customers;
                const customerName = customer ? `${customer.first_name} ${customer.last_name}` : 'No Customer';
                
                return (
                  <div
                    key={apt.id}
                    className="text-xs bg-primary/10 text-primary px-1 sm:px-2 py-1 rounded truncate cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={(e) => onAppointmentClick(apt, e)}
                    title={`${apt.appointment_time} - ${customerName} - ${apt.service_type}`}
                  >
                    <div className="hidden sm:block">
                      {apt.appointment_time} - {customerName}
                    </div>
                    <div className="sm:hidden">
                      {apt.appointment_time}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div key={day.toString()} className="grid grid-cols-7">
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Calendar Header - Days of the Week */}
      <div className="grid grid-cols-7 bg-muted border-b border-border">
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
          <div key={day} className="p-2 sm:p-3 text-center font-semibold text-muted-foreground border-r border-border last:border-r-0">
            <div className="hidden sm:block text-sm">{day}</div>
            <div className="sm:hidden text-xs font-medium">{day.substring(0, 3)}</div>
          </div>
        ))}
      </div>
      {/* Calendar Body */}
      <div>{rows}</div>
    </div>
  );
};
