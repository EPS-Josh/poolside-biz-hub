import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export interface RouteStop {
  id: string;
  route_id: string;
  appointment_id: string | null;
  customer_id: string;
  stop_order: number;
  estimated_arrival_time: string | null;
  estimated_duration_minutes: number | null;
  status: string;
  actual_arrival_time: string | null;
  actual_departure_time: string | null;
  notes: string | null;
  customer?: {
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
  appointment?: {
    id: string;
    service_type: string;
    appointment_time: string;
    notes: string | null;
  };
}

export interface DailyRoute {
  id: string;
  route_date: string;
  technician_user_id: string;
  status: string;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  total_estimated_distance_miles: number | null;
  total_estimated_duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  stops?: RouteStop[];
  technician?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export interface RouteChangeRequest {
  id: string;
  route_id: string;
  requested_by: string;
  request_type: string;
  request_data: Record<string, unknown>;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
}

export const useDailyRoutes = (date: Date, technicianId?: string) => {
  const { user } = useAuth();
  const dateString = format(date, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['daily-routes', dateString, technicianId],
    queryFn: async (): Promise<DailyRoute[]> => {
      let query = supabase
        .from('daily_routes')
        .select(`
          *,
          stops:route_stops(
            *,
            customer:customers(*),
            appointment:appointments(id, service_type, appointment_time, notes)
          )
        `)
        .eq('route_date', dateString)
        .order('created_at', { ascending: false });

      if (technicianId) {
        query = query.eq('technician_user_id', technicianId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Sort stops by stop_order
      return (data || []).map(route => ({
        ...route,
        stops: (route.stops || []).sort((a: any, b: any) => a.stop_order - b.stop_order)
      })) as DailyRoute[];
    },
    enabled: !!user,
  });
};

export const useDailyRoute = (routeId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['daily-route', routeId],
    queryFn: async (): Promise<DailyRoute | null> => {
      const { data, error } = await supabase
        .from('daily_routes')
        .select(`
          *,
          stops:route_stops(
            *,
            customer:customers(*),
            appointment:appointments(id, service_type, appointment_time, notes)
          )
        `)
        .eq('id', routeId)
        .single();

      if (error) throw error;

      return {
        ...data,
        stops: (data.stops || []).sort((a: any, b: any) => a.stop_order - b.stop_order)
      } as DailyRoute;
    },
    enabled: !!user && !!routeId,
  });
};

export const useCreateDailyRoute = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      date, 
      technicianId, 
      stops 
    }: { 
      date: Date; 
      technicianId: string; 
      stops: { customerId: string; appointmentId?: string }[] 
    }) => {
      const dateString = format(date, 'yyyy-MM-dd');

      // Create the route
      const { data: route, error: routeError } = await supabase
        .from('daily_routes')
        .insert({
          route_date: dateString,
          technician_user_id: technicianId,
          created_by: user?.id,
          status: 'pending'
        })
        .select()
        .single();

      if (routeError) throw routeError;

      // Create the stops
      if (stops.length > 0) {
        const stopsToInsert = stops.map((stop, index) => ({
          route_id: route.id,
          customer_id: stop.customerId,
          appointment_id: stop.appointmentId || null,
          stop_order: index + 1,
          status: 'pending' as const
        }));

        const { error: stopsError } = await supabase
          .from('route_stops')
          .insert(stopsToInsert);

        if (stopsError) throw stopsError;
      }

      return route;
    },
    onSuccess: (_, variables) => {
      const dateString = format(variables.date, 'yyyy-MM-dd');
      queryClient.invalidateQueries({ queryKey: ['daily-routes', dateString] });
      toast({
        title: 'Route Created',
        description: 'Daily route has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create route',
        variant: 'destructive',
      });
    }
  });
};

export const useGenerateRouteFromAppointments = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      date, 
      technicianId 
    }: { 
      date: Date; 
      technicianId: string;
    }) => {
      const dateString = format(date, 'yyyy-MM-dd');

      // Check if route already exists
      const { data: existingRoute } = await supabase
        .from('daily_routes')
        .select('id')
        .eq('route_date', dateString)
        .eq('technician_user_id', technicianId)
        .single();

      if (existingRoute) {
        throw new Error('A route already exists for this date and technician');
      }

      // Get technician's assigned customers
      const { data: assignments } = await supabase
        .from('technician_customer_assignments')
        .select('customer_id')
        .eq('technician_user_id', technicianId);

      const assignedCustomerIds = assignments?.map(a => a.customer_id) || [];

      // Fetch appointments for this date
      let appointmentsQuery = supabase
        .from('appointments')
        .select(`
          id,
          customer_id,
          appointment_time,
          service_type,
          customers!customer_id (
            id,
            first_name,
            last_name,
            address,
            latitude,
            longitude
          )
        `)
        .eq('appointment_date', dateString)
        .order('appointment_time');

      if (assignedCustomerIds.length > 0) {
        appointmentsQuery = appointmentsQuery.in('customer_id', assignedCustomerIds);
      }

      const { data: appointments, error: appointmentsError } = await appointmentsQuery;

      if (appointmentsError) throw appointmentsError;

      if (!appointments || appointments.length === 0) {
        throw new Error('No appointments found for this date');
      }

      // Create the route
      const { data: route, error: routeError } = await supabase
        .from('daily_routes')
        .insert({
          route_date: dateString,
          technician_user_id: technicianId,
          created_by: user?.id,
          status: 'pending'
        })
        .select()
        .single();

      if (routeError) throw routeError;

      // Create stops from appointments (ordered by appointment time)
      const stopsToInsert = appointments.map((apt, index) => ({
        route_id: route.id,
        customer_id: apt.customer_id,
        appointment_id: apt.id,
        stop_order: index + 1,
        estimated_arrival_time: apt.appointment_time,
        status: 'pending' as const
      }));

      const { error: stopsError } = await supabase
        .from('route_stops')
        .insert(stopsToInsert);

      if (stopsError) throw stopsError;

      return route;
    },
    onSuccess: (_, variables) => {
      const dateString = format(variables.date, 'yyyy-MM-dd');
      queryClient.invalidateQueries({ queryKey: ['daily-routes', dateString] });
      toast({
        title: 'Route Generated',
        description: 'Route has been generated from scheduled appointments.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate route',
        variant: 'destructive',
      });
    }
  });
};

export const useUpdateRouteStopOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      routeId, 
      stops 
    }: { 
      routeId: string; 
      stops: { id: string; stop_order: number }[] 
    }) => {
      // Update each stop's order
      for (const stop of stops) {
        const { error } = await supabase
          .from('route_stops')
          .update({ stop_order: stop.stop_order })
          .eq('id', stop.id);

        if (error) throw error;
      }

      return { routeId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['daily-route', result.routeId] });
      queryClient.invalidateQueries({ queryKey: ['daily-routes'] });
      toast({
        title: 'Order Updated',
        description: 'Stop order has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update stop order',
        variant: 'destructive',
      });
    }
  });
};

export const useApproveRoute = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (routeId: string) => {
      const { data, error } = await supabase
        .from('daily_routes')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', routeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-routes'] });
      toast({
        title: 'Route Approved',
        description: 'The route has been approved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve route',
        variant: 'destructive',
      });
    }
  });
};

export const useDeleteRoute = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (routeId: string) => {
      const { error } = await supabase
        .from('daily_routes')
        .delete()
        .eq('id', routeId);

      if (error) throw error;
      return { routeId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-routes'] });
      toast({
        title: 'Route Deleted',
        description: 'The route has been deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete route',
        variant: 'destructive',
      });
    }
  });
};

export const useSubmitChangeRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      routeId, 
      requestType, 
      requestData 
    }: { 
      routeId: string; 
      requestType: string;
      requestData: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from('route_change_requests')
        .insert([{
          route_id: routeId,
          requested_by: user?.id as string,
          request_type: requestType,
          request_data: requestData as any,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-change-requests'] });
      toast({
        title: 'Request Submitted',
        description: 'Your change request has been submitted for approval.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit change request',
        variant: 'destructive',
      });
    }
  });
};

export const usePendingChangeRequests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['route-change-requests', 'pending'],
    queryFn: async (): Promise<RouteChangeRequest[]> => {
      const { data, error } = await supabase
        .from('route_change_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RouteChangeRequest[];
    },
    enabled: !!user,
  });
};
