
import React, { useState } from 'react';
import { useAppointments } from '@/hooks/useAppointments';
import { useCalendarNavigation } from '@/hooks/useCalendarNavigation';
import { EditAppointmentDialog } from './EditAppointmentDialog';
import { CalendarNavigationHeader } from './CalendarNavigationHeader';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';

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
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  
  const { data: appointments = [] } = useAppointments(viewType, currentDate);
  const { navigateDate } = useCalendarNavigation(viewType, currentDate, onDateChange);

  const handleAppointmentClick = (appointment: any, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setEditingAppointment(appointment);
  };

  return (
    <>
      <div>
        <CalendarNavigationHeader
          viewType={viewType}
          currentDate={currentDate}
          onNavigate={navigateDate}
        />

        {/* Calendar Content */}
        {viewType === 'month' && (
          <MonthView
            currentDate={currentDate}
            appointments={appointments}
            onDateSelect={onDateSelect}
            onAppointmentClick={handleAppointmentClick}
          />
        )}
        {viewType === 'week' && (
          <WeekView
            currentDate={currentDate}
            appointments={appointments}
            onDateSelect={onDateSelect}
            onAppointmentClick={handleAppointmentClick}
          />
        )}
        {viewType === 'day' && (
          <DayView
            currentDate={currentDate}
            appointments={appointments}
            onAppointmentClick={handleAppointmentClick}
          />
        )}
      </div>

      {/* Edit Appointment Dialog */}
      {editingAppointment && (
        <EditAppointmentDialog
          appointment={editingAppointment}
          isOpen={!!editingAppointment}
          onOpenChange={(open) => !open && setEditingAppointment(null)}
        />
      )}
    </>
  );
};
