import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CalendarIcon, 
  Plus, 
  Route, 
  Wand2, 
  ChevronRight,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  useDailyRoutes, 
  useGenerateRouteFromAppointments,
  useApproveRoute,
  useDeleteRoute,
  DailyRoute 
} from '@/hooks/useDailyRoutes';
import { DailyRouteCard } from './DailyRouteCard';
import { RouteBuilder } from './RouteBuilder';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Technician {
  id: string;
  email: string;
  full_name: string | null;
}

export const DailyRouteManager: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
  const [showRouteBuilder, setShowRouteBuilder] = useState(false);
  const [editingRoute, setEditingRoute] = useState<DailyRoute | null>(null);

  // Fetch technicians
  const { data: technicians = [], isLoading: loadingTechnicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: async (): Promise<Technician[]> => {
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'technician');

      if (rolesError) throw rolesError;

      const technicianUserIds = userRoles?.map(r => r.user_id) || [];

      if (technicianUserIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', technicianUserIds);

      if (profilesError) throw profilesError;

      return profiles as Technician[];
    }
  });

  const technicianFilter = selectedTechnician === 'all' ? undefined : selectedTechnician;
  const { data: routes = [], isLoading: loadingRoutes, refetch } = useDailyRoutes(selectedDate, technicianFilter);

  const generateRoute = useGenerateRouteFromAppointments();
  const approveRoute = useApproveRoute();
  const deleteRoute = useDeleteRoute();

  const handleGenerateRoute = async (technicianId: string) => {
    await generateRoute.mutateAsync({ date: selectedDate, technicianId });
  };

  const handleApproveRoute = async (routeId: string) => {
    await approveRoute.mutateAsync(routeId);
  };

  const handleDeleteRoute = async (routeId: string) => {
    await deleteRoute.mutateAsync(routeId);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'completed':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  if (showRouteBuilder) {
    return (
      <RouteBuilder
        date={selectedDate}
        technicians={technicians}
        editingRoute={editingRoute}
        onClose={() => {
          setShowRouteBuilder(false);
          setEditingRoute(null);
          refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[240px] justify-start text-left font-normal',
                  !selectedDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'EEEE, MMM d, yyyy') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Technician Filter */}
          <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Technicians" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Technicians</SelectItem>
              {technicians.map((tech) => (
                <SelectItem key={tech.id} value={tech.id}>
                  {tech.full_name || tech.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowRouteBuilder(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Build Route
          </Button>
        </div>
      </div>

      {/* Routes List */}
      {loadingRoutes ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : routes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Routes for This Date</h3>
            <p className="text-muted-foreground mb-6">
              Create a route manually or auto-generate from appointments
            </p>
            
            {selectedTechnician !== 'all' ? (
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowRouteBuilder(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Build Manually
                </Button>
                <Button
                  onClick={() => handleGenerateRoute(selectedTechnician)}
                  disabled={generateRoute.isPending}
                  className="gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Generate from Appointments
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a technician to create or generate a route
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {routes.map((route) => (
            <DailyRouteCard
              key={route.id}
              route={route}
              technicians={technicians}
              onApprove={handleApproveRoute}
              onDelete={handleDeleteRoute}
              onEdit={(route) => {
                setEditingRoute(route);
                setShowRouteBuilder(true);
              }}
              isApproving={approveRoute.isPending}
              isDeleting={deleteRoute.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
};
