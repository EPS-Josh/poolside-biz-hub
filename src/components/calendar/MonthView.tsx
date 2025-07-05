
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

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const dayAppointments = getAppointmentsForDate(appointments, day);
      const currentDay = new Date(day);

      days.push(
        <div
          key={day.toString()}
          className={`min-h-24 sm:min-h-32 p-2 border-r border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
            !isSameMonth(day, monthStart) ? 'bg-gray-100 text-gray-400' : 'bg-white'
          } ${isSameDay(day, new Date()) ? 'bg-blue-50' : ''}`}
          onClick={() => onDateSelect(currentDay)}
        >
          <div className="flex flex-col h-full">
            <div className={`text-lg sm:text-xl font-black mb-2 leading-none ${
              isSameDay(currentDay, new Date()) ? 'text-blue-600' : 
              !isSameMonth(currentDay, monthStart) ? 'text-gray-400' : 'text-gray-900'
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
                    className="text-xs bg-blue-100 text-blue-800 px-1 sm:px-2 py-1 rounded truncate cursor-pointer hover:bg-blue-200 transition-colors"
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
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Calendar Header - Days of the Week */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
          <div key={day} className="p-2 sm:p-3 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
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
