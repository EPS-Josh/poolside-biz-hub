import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatPhoenixDateForDatabase } from '@/utils/phoenixTimeUtils';

export const useAppointmentServiceRecords = (appointments: any[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['appointment-service-records', appointments.map(apt => apt.id)],
    queryFn: async () => {
      if (!appointments.length) return {};

      // Get unique customer IDs and dates from appointments
      const appointmentData = appointments.map(apt => ({
        id: apt.id,
        customer_id: apt.customer_id,
        appointment_date: apt.appointment_date,
      }));

      // Query service records that match any of the appointments
      const { data: serviceRecords, error } = await supabase
        .from('service_records')
        .select('customer_id, service_date')
        .in('customer_id', appointmentData.map(apt => apt.customer_id).filter(Boolean));

      if (error) {
        console.error('Error fetching service records:', error);
        return {};
      }

      // Create a map of appointment ID to whether it has a service record
      const serviceRecordMap: Record<string, boolean> = {};
      
      appointmentData.forEach(apt => {
        const hasServiceRecord = serviceRecords?.some(record => 
          record.customer_id === apt.customer_id && 
          record.service_date === apt.appointment_date
        ) || false;
        
        serviceRecordMap[apt.id] = hasServiceRecord;
      });

      return serviceRecordMap;
    },
    enabled: !!user && appointments.length > 0,
  });
};