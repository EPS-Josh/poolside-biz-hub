import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  GripVertical, 
  MapPin, 
  Search, 
  Wand2,
  Plus,
  X,
  Loader2,
  Save,
  Navigation
} from 'lucide-react';
import { format } from 'date-fns';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  useCreateDailyRoute, 
  useUpdateRouteStopOrder,
  DailyRoute 
} from '@/hooks/useDailyRoutes';
import { useToast } from '@/hooks/use-toast';

interface Technician {
  id: string;
  email: string;
  full_name: string | null;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number | null;
  longitude: number | null;
}

interface RouteBuilderProps {
  date: Date;
  technicians: Technician[];
  editingRoute: DailyRoute | null;
  onClose: () => void;
}

interface SelectedStop {
  id: string;
  customerId: string;
  customerName: string;
  address: string;
  appointmentId?: string;
}

export const RouteBuilder: React.FC<RouteBuilderProps> = ({
  date,
  technicians,
  editingRoute,
  onClose
}) => {
  const { toast } = useToast();
  const [selectedTechnician, setSelectedTechnician] = useState<string>(
    editingRoute?.technician_user_id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStops, setSelectedStops] = useState<SelectedStop[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const createRoute = useCreateDailyRoute();
  const updateStopOrder = useUpdateRouteStopOrder();

  // Fetch customers (preferring those assigned to selected technician)
  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers-for-route', selectedTechnician],
    queryFn: async (): Promise<Customer[]> => {
      let query = supabase
        .from('customers')
        .select('id, first_name, last_name, address, city, state, zip_code, latitude, longitude')
        .order('last_name');

      if (selectedTechnician) {
        // Get assigned customers first
        const { data: assignments } = await supabase
          .from('technician_customer_assignments')
          .select('customer_id')
          .eq('technician_user_id', selectedTechnician);

        const assignedIds = assignments?.map(a => a.customer_id) || [];

        if (assignedIds.length > 0) {
          // Fetch assigned customers
          const { data, error } = await supabase
            .from('customers')
            .select('id, first_name, last_name, address, city, state, zip_code, latitude, longitude')
            .in('id', assignedIds)
            .order('last_name');

          if (error) throw error;
          return data as Customer[];
        }
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!selectedTechnician
  });

  // Fetch appointments for the date
  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments-for-route', format(date, 'yyyy-MM-dd'), selectedTechnician],
    queryFn: async () => {
      const dateString = format(date, 'yyyy-MM-dd');
      
      let query = supabase
        .from('appointments')
        .select('id, customer_id, appointment_time, service_type')
        .eq('appointment_date', dateString)
        .order('appointment_time');

      if (selectedTechnician) {
        const { data: assignments } = await supabase
          .from('technician_customer_assignments')
          .select('customer_id')
          .eq('technician_user_id', selectedTechnician);

        const assignedIds = assignments?.map(a => a.customer_id) || [];
        if (assignedIds.length > 0) {
          query = query.in('customer_id', assignedIds);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTechnician
  });

  // Initialize stops from editing route
  useEffect(() => {
    if (editingRoute?.stops) {
      setSelectedStops(
        editingRoute.stops.map(stop => ({
          id: stop.id,
          customerId: stop.customer_id,
          customerName: `${stop.customer?.first_name} ${stop.customer?.last_name}`,
          address: `${stop.customer?.address}, ${stop.customer?.city}`,
          appointmentId: stop.appointment_id || undefined
        }))
      );
    }
  }, [editingRoute]);

  const filteredCustomers = customers.filter(c => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    const address = c.address?.toLowerCase() || '';
    return fullName.includes(searchLower) || address.includes(searchLower);
  });

  const handleAddStop = (customer: Customer) => {
    // Check if already added
    if (selectedStops.some(s => s.customerId === customer.id)) {
      toast({
        title: 'Already Added',
        description: 'This customer is already in the route.',
        variant: 'destructive'
      });
      return;
    }

    // Check for appointment on this date
    const appointment = appointments.find(a => a.customer_id === customer.id);

    setSelectedStops([...selectedStops, {
      id: crypto.randomUUID(),
      customerId: customer.id,
      customerName: `${customer.first_name} ${customer.last_name}`,
      address: `${customer.address}, ${customer.city}`,
      appointmentId: appointment?.id
    }]);
  };

  const handleRemoveStop = (stopId: string) => {
    setSelectedStops(selectedStops.filter(s => s.id !== stopId));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(selectedStops);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSelectedStops(items);
  };

  const handleOptimizeRoute = async () => {
    if (selectedStops.length < 2) {
      toast({
        title: 'Not Enough Stops',
        description: 'Need at least 2 stops to optimize.',
      });
      return;
    }

    setIsOptimizing(true);

    try {
      // Get coordinates for all stops
      const stopsWithCoords = selectedStops.map(stop => {
        const customer = customers.find(c => c.id === stop.customerId);
        return {
          ...stop,
          latitude: customer?.latitude,
          longitude: customer?.longitude
        };
      }).filter(s => s.latitude && s.longitude);

      if (stopsWithCoords.length < 2) {
        toast({
          title: 'Missing Coordinates',
          description: 'Not enough customers have GPS coordinates for optimization.',
          variant: 'destructive'
        });
        return;
      }

      // Call the calculate-route-distance edge function
      const { data, error } = await supabase.functions.invoke('calculate-route-distance', {
        body: {
          coordinates: stopsWithCoords.map(s => ({
            latitude: s.latitude,
            longitude: s.longitude
          })),
          optimize: true
        }
      });

      if (error) throw error;

      if (data?.optimizedOrder) {
        // Reorder stops based on optimization
        const optimizedStops = data.optimizedOrder.map((index: number) => stopsWithCoords[index]);
        setSelectedStops(optimizedStops);

        toast({
          title: 'Route Optimized',
          description: `Estimated: ${Math.round(data.totalDistance || 0)} miles, ${Math.round((data.totalDuration || 0) / 60)} mins`,
        });
      }
    } catch (error) {
      console.error('Optimization error:', error);
      toast({
        title: 'Optimization Failed',
        description: 'Could not optimize route. Check that all stops have valid addresses.',
        variant: 'destructive'
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTechnician) {
      toast({
        title: 'Select Technician',
        description: 'Please select a technician for this route.',
        variant: 'destructive'
      });
      return;
    }

    if (selectedStops.length === 0) {
      toast({
        title: 'Add Stops',
        description: 'Please add at least one stop to the route.',
        variant: 'destructive'
      });
      return;
    }

    if (editingRoute) {
      // Update existing route stops order
      await updateStopOrder.mutateAsync({
        routeId: editingRoute.id,
        stops: selectedStops.map((stop, index) => ({
          id: stop.id,
          stop_order: index + 1
        }))
      });
    } else {
      // Create new route
      await createRoute.mutateAsync({
        date,
        technicianId: selectedTechnician,
        stops: selectedStops.map(stop => ({
          customerId: stop.customerId,
          appointmentId: stop.appointmentId
        }))
      });
    }

    onClose();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">
            {editingRoute ? 'Edit Route' : 'Build Route'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(date, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Stops</CardTitle>
            <CardDescription>
              Select customers to add to this route
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Technician Selection */}
            <div className="space-y-2">
              <Label>Technician</Label>
              <Select 
                value={selectedTechnician} 
                onValueChange={setSelectedTechnician}
                disabled={!!editingRoute}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.full_name || tech.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Customer List */}
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {loadingCustomers ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Loading customers...
                </p>
              ) : filteredCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {selectedTechnician 
                    ? 'No assigned customers found' 
                    : 'Select a technician to see customers'}
                </p>
              ) : (
                filteredCustomers.map((customer) => {
                  const isAdded = selectedStops.some(s => s.customerId === customer.id);
                  const hasAppointment = appointments.some(a => a.customer_id === customer.id);

                  return (
                    <div
                      key={customer.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isAdded ? 'bg-muted/50 border-primary/20' : 'hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {customer.first_name} {customer.last_name}
                          </p>
                          {hasAppointment && (
                            <Badge variant="secondary" className="text-xs">
                              Scheduled
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {customer.address}, {customer.city}
                        </p>
                      </div>
                      <Button
                        variant={isAdded ? 'ghost' : 'outline'}
                        size="sm"
                        onClick={() => handleAddStop(customer)}
                        disabled={isAdded}
                      >
                        {isAdded ? 'Added' : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Route Order */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Route Order</CardTitle>
                <CardDescription>
                  Drag to reorder stops
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOptimizeRoute}
                disabled={isOptimizing || selectedStops.length < 2}
                className="gap-1.5"
              >
                {isOptimizing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                Optimize
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedStops.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Add customers to build your route
                </p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="stops">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {selectedStops.map((stop, index) => (
                        <Draggable key={stop.id} draggableId={stop.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-3 p-3 rounded-lg border bg-background ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{stop.customerName}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {stop.address}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveStop(stop.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}

            {/* Save Button */}
            <div className="mt-6 pt-4 border-t">
              <Button
                className="w-full gap-2"
                onClick={handleSave}
                disabled={createRoute.isPending || updateStopOrder.isPending}
              >
                {(createRoute.isPending || updateStopOrder.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {editingRoute ? 'Update Route' : 'Create Route'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
