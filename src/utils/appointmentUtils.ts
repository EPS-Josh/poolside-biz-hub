
import { parseDateFromDatabase } from '@/utils/dateUtils';
import { isSameDayPhoenix } from '@/utils/phoenixTimeUtils';

export const getAppointmentsForDate = (appointments: any[], date: Date) => {
  return appointments.filter(apt => {
    const appointmentDate = parseDateFromDatabase(apt.appointment_date);
    return isSameDayPhoenix(appointmentDate, date);
  });
};
