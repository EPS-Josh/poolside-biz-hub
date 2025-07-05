
import { isSameDay } from 'date-fns';
import { parseDateFromDatabase } from '@/utils/dateUtils';

export const getAppointmentsForDate = (appointments: any[], date: Date) => {
  return appointments.filter(apt => {
    const appointmentDate = parseDateFromDatabase(apt.appointment_date);
    return isSameDay(appointmentDate, date);
  });
};
