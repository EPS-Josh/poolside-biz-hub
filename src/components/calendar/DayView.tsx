
import React from 'react';
import { format } from 'date-fns';
import { getAppointmentsForDate } from '@/utils/appointmentUtils';
import { QuickStatusChange, getStatusColor } from './QuickStatusChange';

interface DayViewProps {
  currentDate: Date;
  appointments: any[];
  onAppointmentClick: (appointment: any) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  appointments,
  onAppointmentClick,
}) => {
  const dayAppointments = getAppointmentsForDate(appointments, currentDate);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {format(currentDate, 'EEEE, MMMM d, yyyy')} (Phoenix Time)
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
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onAppointmentClick(apt)}
                title="Click to edit appointment"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-lg">{customerName}</div>
                    <div className="text-gray-600">{apt.service_type}</div>
                    <div className="text-sm text-gray-500">{apt.appointment_time}</div>
                  </div>
                  <QuickStatusChange appointmentId={apt.id} currentStatus={apt.status}>
                    <button
                      className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${getStatusColor(apt.status)}`}
                      title="Click to change status"
                    >
                      {apt.status}
                    </button>
                  </QuickStatusChange>
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
