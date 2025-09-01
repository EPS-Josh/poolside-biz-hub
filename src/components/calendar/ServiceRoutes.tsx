import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppointments } from '@/hooks/useAppointments';
import { MapPin, Clock, User, Route } from 'lucide-react';
import { format } from 'date-fns';
import { getCurrentPhoenixDate } from '@/utils/phoenixTimeUtils';

interface ServiceRoute {
  id: string;
  name: string;
  area: string;
  appointments: any[];
  totalDistance?: number;
}

export const ServiceRoutes: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(getCurrentPhoenixDate());
  const [selectedRoute, setSelectedRoute] = useState<ServiceRoute | null>(null);
  
  const { data: appointments = [] } = useAppointments('day', selectedDate);

  // Group appointments by geographical area based on zip codes
  const serviceRoutes = useMemo(() => {
    const routeMap = new Map<string, any[]>();
    
    appointments.forEach((appointment) => {
      if (appointment.customers) {
        // Use zip code for geographical routing, fallback to service type
        const customer = appointment.customers;
        const area = customer.zip_code ? `Zip Code ${customer.zip_code}` : appointment.service_type || 'General Service';
        
        if (!routeMap.has(area)) {
          routeMap.set(area, []);
        }
        routeMap.get(area)!.push(appointment);
      }
    });

    return Array.from(routeMap.entries()).map(([area, appts], index) => ({
      id: `route-${index}`,
      name: `Route ${String.fromCharCode(65 + index)}`, // Route A, B, C, etc.
      area,
      appointments: appts.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
    }));
  }, [appointments]);

  const totalAppointments = serviceRoutes.reduce((sum, route) => sum + route.appointments.length, 0);

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
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <Badge variant="secondary">
              {totalAppointments} appointments
            </Badge>
          </div>
        </div>

        {/* Routes Grid */}
        {serviceRoutes.length === 0 ? (
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
            {serviceRoutes.map((route) => (
              <Card key={route.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Route className="h-5 w-5 text-primary" />
                      <span>{route.name}</span>
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