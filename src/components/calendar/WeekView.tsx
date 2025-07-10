
import React from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { getAppointmentsForDate } from '@/utils/appointmentUtils';
import { isSameDayPhoenix, getCurrentPhoenixDate } from '@/utils/phoenixTimeUtils';

interface WeekViewProps {
  currentDate: Date;
  appointments: any[];
  onDateSelect: (date: Date) => void;
  onAppointmentClick: (appointment: any, event: React.MouseEvent) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  appointments,
  onDateSelect,
  onAppointmentClick,
}) => {
  const weekStart = startOfWeek(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = getCurrentPhoenixDate();

  return (
    <div>
      {/* Week Header */}
      <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
        {days.map(day => (
          <div key={day.toString()} className="p-3 text-center bg-gray-50">
            <div className="font-medium">{format(day, 'EEE')}</div>
            <div className={`text-2xl ${isSameDayPhoenix(day, today) ? 'text-blue-600 font-bold' : 'text-gray-900'}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>
      
      {/* Week Body */}
      <div className="grid grid-cols-7 gap-0">
        {days.map(day => {
          const dayAppointments = getAppointmentsForDate(appointments, day);
          
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
                      className="bg-blue-100 text-blue-800 p-2 rounded text-sm cursor-pointer hover:bg-blue-200 transition-colors"
                      onClick={(e) => onAppointmentClick(apt, e)}
                      title={`Click to edit appointment`}
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
