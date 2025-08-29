
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useAppointments = (viewType: 'month' | 'week' | 'day', currentDate: Date) => {
  const { user } = useAuth();

  return useQuery({
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
          customers!customer_id (
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
};
