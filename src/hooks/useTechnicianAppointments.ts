import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, addDays } from 'date-fns';
import { getCurrentPhoenixDate, formatPhoenixDateForDatabase } from '@/utils/phoenixTimeUtils';
import { useEffect, useCallback } from 'react';

export interface TechnicianAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  status: string;
  notes?: string;
  customer_id: string;
  customers: {
    id: string;
    first_name: string;
    last_name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    phone: string;
    email: string;
    latitude: number | null;
    longitude: number | null;
  };
}

const OFFLINE_STORAGE_KEY = 'technician_appointments_cache';

// Save appointments to localStorage for offline access
const saveToOfflineCache = (date: string, appointments: TechnicianAppointment[]) => {
  try {
    const cache = JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) || '{}');
    cache[date] = {
      appointments,
      cachedAt: new Date().toISOString()
    };
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('Failed to save to offline cache:', e);
  }
};

// Load appointments from localStorage for offline access
const loadFromOfflineCache = (date: string): { appointments: TechnicianAppointment[], cachedAt: string } | null => {
  try {
    const cache = JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) || '{}');
    return cache[date] || null;
  } catch (e) {
    console.error('Failed to load from offline cache:', e);
    return null;
  }
};

export const useTechnicianAppointments = (showTomorrow: boolean = false) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const phoenixToday = getCurrentPhoenixDate();
  const targetDate = showTomorrow ? addDays(phoenixToday, 1) : phoenixToday;
  const dateString = formatPhoenixDateForDatabase(targetDate);

  const query = useQuery({
    queryKey: ['technician-appointments', dateString, user?.id],
    queryFn: async (): Promise<TechnicianAppointment[]> => {
      if (!user) return [];

      // First, check if there's a route for this technician on this date
      const { data: routes } = await supabase
        .from('daily_routes')
        .select(`
          id,
          route_stops (
            id,
            stop_order,
            status,
            notes,
            customer_id,
            appointment_id
          )
        `)
        .eq('technician_user_id', user.id)
        .eq('route_date', dateString)
        .limit(1);

      // If a route exists, use route stops to build the appointment list
      if (routes && routes.length > 0 && routes[0].route_stops?.length > 0) {
        const routeStops = routes[0].route_stops.sort((a: any, b: any) => a.stop_order - b.stop_order);
        const appointmentIds = routeStops
          .map((stop: any) => stop.appointment_id)
          .filter((id: string | null) => id !== null);

        if (appointmentIds.length > 0) {
          const { data: appointmentsData, error } = await supabase
            .from('appointments')
            .select(`
              id,
              appointment_date,
              appointment_time,
              service_type,
              status,
              notes,
              customer_id,
              customers!customer_id (
                id,
                first_name,
                last_name,
                address,
                city,
                state,
                zip_code,
                phone,
                email,
                latitude,
                longitude
              )
            `)
            .in('id', appointmentIds);

          if (error) {
            console.error('Error fetching route appointments:', error);
            throw error;
          }

          // Sort appointments by route stop order
          const appointmentMap = new Map((appointmentsData || []).map(a => [a.id, a]));
          const orderedAppointments = routeStops
            .filter((stop: any) => stop.appointment_id && appointmentMap.has(stop.appointment_id))
            .map((stop: any) => appointmentMap.get(stop.appointment_id)) as TechnicianAppointment[];

          saveToOfflineCache(dateString, orderedAppointments);
          return orderedAppointments;
        }
      }

      // Fallback: No route exists, use original logic
      const { data: assignments } = await supabase
        .from('technician_customer_assignments')
        .select('customer_id')
        .eq('technician_user_id', user.id);

      const assignedCustomerIds = assignments?.map(a => a.customer_id) || [];

      let appointmentQuery = supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          service_type,
          status,
          notes,
          customer_id,
          customers!customer_id (
            id,
            first_name,
            last_name,
            address,
            city,
            state,
            zip_code,
            phone,
            email,
            latitude,
            longitude
          )
        `)
        .eq('appointment_date', dateString)
        .order('appointment_time');

      if (assignedCustomerIds.length > 0) {
        appointmentQuery = appointmentQuery.in('customer_id', assignedCustomerIds);
      } else {
        appointmentQuery = appointmentQuery.eq('user_id', user.id);
      }

      const { data, error } = await appointmentQuery;

      if (error) {
        console.error('Error fetching technician appointments:', error);
        throw error;
      }

      const appointments = (data || []) as TechnicianAppointment[];
      
      saveToOfflineCache(dateString, appointments);
      
      return appointments;
    },
    enabled: !!user,
    staleTime: 30000, // Consider data fresh for 30 seconds
    placeholderData: () => {
      // Use cached data as placeholder while loading
      const cached = loadFromOfflineCache(dateString);
      return cached?.appointments || [];
    }
  });

  // Refresh function for pull-to-refresh
  const refresh = useCallback(() => {
    return queryClient.invalidateQueries({ 
      queryKey: ['technician-appointments', dateString, user?.id] 
    });
  }, [queryClient, dateString, user?.id]);

  // Check if we're using cached data (offline mode)
  const cachedData = loadFromOfflineCache(dateString);
  const isOffline = !navigator.onLine;
  const lastCachedAt = cachedData?.cachedAt;

  return {
    ...query,
    refresh,
    isOffline,
    lastCachedAt,
    dateString,
    targetDate
  };
};

// Hook for offline service record queue
export const useOfflineServiceRecords = () => {
  const QUEUE_KEY = 'offline_service_records_queue';

  const addToQueue = (serviceRecord: any) => {
    try {
      const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      queue.push({
        ...serviceRecord,
        queuedAt: new Date().toISOString(),
        id: crypto.randomUUID()
      });
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      return true;
    } catch (e) {
      console.error('Failed to add to offline queue:', e);
      return false;
    }
  };

  const getQueue = () => {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  };

  const removeFromQueue = (id: string) => {
    try {
      const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      const filtered = queue.filter((item: any) => item.id !== id);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to remove from queue:', e);
    }
  };

  const clearQueue = () => {
    localStorage.removeItem(QUEUE_KEY);
  };

  return { addToQueue, getQueue, removeFromQueue, clearQueue };
};
