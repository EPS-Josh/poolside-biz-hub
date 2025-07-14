
import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth } from 'date-fns';
import { getAppointmentsForDate } from '@/utils/appointmentUtils';
import { isSameDayPhoenix, getCurrentPhoenixDate } from '@/utils/phoenixTimeUtils';
import { useAppointmentServiceRecords } from '@/hooks/useAppointmentServiceRecords';
import { CheckCircle } from 'lucide-react';

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
  
  const { data: serviceRecordMap = {} } = useAppointmentServiceRecords(appointments);

  const rows = [];
  let days = [];
  let day = startDate;
  const today = getCurrentPhoenixDate();

  console.log('MonthView rendering, current month:', format(monthStart, 'MMMM yyyy'));
  console.log('Phoenix time now:', today);

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const dayAppointments = getAppointmentsForDate(appointments, day);
      const currentDay = new Date(day);
      const isCurrentMonth = isSameMonth(currentDay, monthStart);
      const isToday = isSameDayPhoenix(currentDay, today);
      
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
            <div className={`mb-1 sm:mb-2 leading-none ${
              isToday 
                ? 'text-primary text-xl sm:text-2xl font-bold' 
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
                    className={`text-xs px-1 sm:px-2 py-1 rounded truncate cursor-pointer transition-colors ${
                      serviceRecordMap[apt.id] 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                    }`}
                    onClick={(e) => onAppointmentClick(apt, e)}
                    title={`${apt.appointment_time} - ${customerName} - ${apt.service_type}${serviceRecordMap[apt.id] ? ' (Service Complete)' : ''}`}
                  >
                    <div className="hidden sm:flex items-center space-x-1">
                      {serviceRecordMap[apt.id] && <CheckCircle className="h-3 w-3" />}
                      <span>{apt.appointment_time} - {customerName}</span>
                    </div>
                    <div className="sm:hidden flex items-center space-x-1">
                      {serviceRecordMap[apt.id] && <CheckCircle className="h-3 w-3" />}
                      <span>{apt.appointment_time}</span>
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
