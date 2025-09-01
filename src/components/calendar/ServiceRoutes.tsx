import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppointments } from '@/hooks/useAppointments';
import { MapPin, Clock, User, Route, Shuffle, ArrowUp, ArrowDown, Plus, Save } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import { getCurrentPhoenixDate } from '@/utils/phoenixTimeUtils';

interface ServiceRoute {
  id: string;
  name: string;
  area: string;
  appointments: any[];
  totalDistance?: number;
  isCustom?: boolean;
  optimizedOrder?: number[];
}

interface RouteBuilderProps {
  appointments: any[];
  onRoutesChange: (routes: ServiceRoute[]) => void;
}

const RouteBuilder: React.FC<RouteBuilderProps> = ({ appointments, onRoutesChange }) => {
  const [customRoutes, setCustomRoutes] = useState<ServiceRoute[]>([]);
  const [selectedAppointments, setSelectedAppointments] = useState<Set<string>>(new Set());
  const [newRouteName, setNewRouteName] = useState('');

  const unassignedAppointments = appointments.filter(apt => 
    !customRoutes.some(route => route.appointments.some(rApt => rApt.id === apt.id))
  );

  const createNewRoute = () => {
    if (!newRouteName.trim()) return;
    
    const selectedAppts = appointments.filter(apt => selectedAppointments.has(apt.id));
    if (selectedAppts.length === 0) return;

    const newRoute: ServiceRoute = {
      id: `custom-${Date.now()}`,
      name: newRouteName,
      area: 'Custom Route',
      appointments: selectedAppts,
      isCustom: true
    };

    const updatedRoutes = [...customRoutes, newRoute];
    setCustomRoutes(updatedRoutes);
    setSelectedAppointments(new Set());
    setNewRouteName('');
    onRoutesChange(updatedRoutes);
  };

  const optimizeRoute = (routeId: string) => {
    const route = customRoutes.find(r => r.id === routeId);
    if (!route) return;

    // Simple optimization: sort by time, then by proximity (basic zip code grouping)
    const optimized = [...route.appointments].sort((a, b) => {
      // First sort by time
      const timeCompare = a.appointment_time.localeCompare(b.appointment_time);
      if (timeCompare !== 0) return timeCompare;
      
      // Then by zip code for proximity
      const zipA = a.customers?.zip_code || '';
      const zipB = b.customers?.zip_code || '';
      return zipA.localeCompare(zipB);
    });

    const updatedRoutes = customRoutes.map(r => 
      r.id === routeId ? { ...r, appointments: optimized } : r
    );
    setCustomRoutes(updatedRoutes);
    onRoutesChange(updatedRoutes);
  };

  const handleDragEnd = (result: any, routeId: string) => {
    if (!result.destination) return;

    const route = customRoutes.find(r => r.id === routeId);
    if (!route) return;

    const items = Array.from(route.appointments);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedRoutes = customRoutes.map(r => 
      r.id === routeId ? { ...r, appointments: items } : r
    );
    setCustomRoutes(updatedRoutes);
    onRoutesChange(updatedRoutes);
  };

  return (
    <div className="space-y-6">
      {/* Route Builder Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Build New Route</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter route name..."
              value={newRouteName}
              onChange={(e) => setNewRouteName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <Button onClick={createNewRoute} disabled={!newRouteName.trim() || selectedAppointments.size === 0}>
              Create Route
            </Button>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Select appointments to include ({selectedAppointments.size} selected):
            </p>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {unassignedAppointments.map((apt) => (
                <label key={apt.id} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedAppointments.has(apt.id)}
                    onChange={(e) => {
                      const newSelection = new Set(selectedAppointments);
                      if (e.target.checked) {
                        newSelection.add(apt.id);
                      } else {
                        newSelection.delete(apt.id);
                      }
                      setSelectedAppointments(newSelection);
                    }}
                  />
                  <span>
                    {apt.appointment_time} - {apt.customers?.first_name} {apt.customers?.last_name} ({apt.service_type})
                  </span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Routes */}
      {customRoutes.map((route) => (
        <Card key={route.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Route className="h-5 w-5 text-primary" />
                <span>{route.name}</span>
                <Badge variant="outline">{route.appointments.length} stops</Badge>
              </CardTitle>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => optimizeRoute(route.id)}>
                  <Shuffle className="h-4 w-4 mr-1" />
                  Optimize
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={(result) => handleDragEnd(result, route.id)}>
              <Droppable droppableId={route.id}>
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {route.appointments.map((apt, index) => (
                      <Draggable key={apt.id} draggableId={apt.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 border rounded-lg ${
                              snapshot.isDragging ? 'bg-blue-50 border-blue-200' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">
                                    {apt.customers?.first_name} {apt.customers?.last_name}
                                  </span>
                                  <Badge variant="outline">{apt.appointment_time}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {apt.service_type} • {apt.customers?.address || 'No address'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export const ServiceRoutes: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(getCurrentPhoenixDate());
  const [selectedRoute, setSelectedRoute] = useState<ServiceRoute | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [customRoutes, setCustomRoutes] = useState<ServiceRoute[]>([]);
  
  const { data: appointments = [] } = useAppointments('day', selectedDate);

  // Combine auto-generated and custom routes
  const allRoutes = useMemo(() => {
    // Auto-generated routes from unassigned appointments
    const unassignedAppointments = appointments.filter(apt => 
      !customRoutes.some(route => route.appointments.some(rApt => rApt.id === apt.id))
    );

    const routeMap = new Map<string, any[]>();
    
    unassignedAppointments.forEach((appointment) => {
      if (appointment.customers) {
        const customer = appointment.customers;
        const area = customer.zip_code ? `Zip Code ${customer.zip_code}` : appointment.service_type || 'General Service';
        
        if (!routeMap.has(area)) {
          routeMap.set(area, []);
        }
        routeMap.get(area)!.push(appointment);
      }
    });

    const autoRoutes = Array.from(routeMap.entries()).map(([area, appts], index) => ({
      id: `auto-route-${index}`,
      name: `Auto Route ${String.fromCharCode(65 + index)}`,
      area,
      appointments: appts.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time)),
      isCustom: false
    }));

    return [...customRoutes, ...autoRoutes];
  }, [appointments, customRoutes]);

  const totalAppointments = allRoutes.reduce((sum, route) => sum + route.appointments.length, 0);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <Route className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Service Routes</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                // Parse date in local timezone to avoid UTC conversion issues
                const [year, month, day] = e.target.value.split('-');
                const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                setSelectedDate(localDate);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <Button 
              variant={showBuilder ? "default" : "outline"}
              onClick={() => setShowBuilder(!showBuilder)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {showBuilder ? "Hide Builder" : "Build Routes"}
            </Button>
            <Badge variant="secondary">
              {totalAppointments} appointments
            </Badge>
          </div>
        </div>

        {/* Route Builder */}
        {showBuilder && (
          <RouteBuilder 
            appointments={appointments} 
            onRoutesChange={setCustomRoutes}
          />
        )}

        {/* Routes Grid */}
        {allRoutes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No Routes for Selected Date</h3>
              <p className="text-sm text-muted-foreground">
                No appointments scheduled for {format(selectedDate, 'MMMM d, yyyy')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allRoutes.map((route) => (
              <Card key={route.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Route className="h-5 w-5 text-primary" />
                      <span>{route.name}</span>
                      {route.isCustom && <Badge variant="secondary" className="text-xs">Custom</Badge>}
                    </CardTitle>
                    <Badge variant="outline">
                      {route.appointments.length} stops
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{route.area}</p>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Route Summary */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {route.appointments.length > 0 
                          ? `${route.appointments[0].appointment_time} - ${route.appointments[route.appointments.length - 1].appointment_time}`
                          : 'No appointments'
                        }
                      </span>
                    </div>
                  </div>
                  
                  {/* First few appointments preview */}
                  <div className="space-y-2">
                    {route.appointments.slice(0, 3).map((appointment, index) => (
                      <div key={appointment.id} className="flex items-center space-x-2 text-sm p-2 bg-gray-50 rounded">
                        <span className="font-medium text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          {appointment.appointment_time}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="truncate">
                            {appointment.customers?.first_name} {appointment.customers?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {appointment.service_type}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {route.appointments.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{route.appointments.length - 3} more appointments
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setSelectedRoute(route)}
                  >
                    View Full Route
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Route Detail Dialog */}
      <Dialog open={!!selectedRoute} onOpenChange={() => setSelectedRoute(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Route className="h-5 w-5" />
              <span>{selectedRoute?.name} - {selectedRoute?.area}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedRoute && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  {selectedRoute.appointments.length} appointments
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </span>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedRoute.appointments.map((appointment, index) => (
                  <div key={appointment.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">
                          {appointment.customers?.first_name} {appointment.customers?.last_name}
                        </span>
                        <Badge variant="outline">
                          {appointment.appointment_time}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">
                            {appointment.customers?.address}
                            {appointment.customers?.city && `, ${appointment.customers.city}`}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{appointment.service_type}</span>
                        </div>
                        
                        {appointment.notes && (
                          <p className="text-xs bg-gray-50 p-2 rounded">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};