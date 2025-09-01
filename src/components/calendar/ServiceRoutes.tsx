import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppointments } from '@/hooks/useAppointments';
import { CustomerSelect } from './CustomerSelect';
import { MapPin, Clock, User, Route, Shuffle, ArrowUp, ArrowDown, Plus, Save, Timer, AlertCircle, Edit3, Check, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import { getCurrentPhoenixDate } from '@/utils/phoenixTimeUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ServiceRoute {
  id: string;
  name: string;
  area: string;
  appointments: any[];
  totalDistance?: number;
  isCustom?: boolean;
  optimizedOrder?: number[];
  estimatedDuration?: number; // in minutes
}

interface TestAppointment {
  id: string;
  customer_id: string;
  appointment_time: string;
  service_type: string;
  isTest?: boolean;
  customers?: {
    first_name: string;
    last_name: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  };
}

interface RouteBuilderProps {
  appointments: any[];
  onRoutesChange: (routes: ServiceRoute[]) => void;
}

// Calculate estimated travel time between appointments (simplified)
const calculateTravelTime = (from: any, to: any): number => {
  if (!from.customers || !to.customers) return 15; // Default 15 minutes
  
  const fromZip = from.customers.zip_code || '';
  const toZip = to.customers.zip_code || '';
  
  // Simple estimation: same zip = 10 min, different zip = 20 min, no zip = 15 min
  if (fromZip && toZip) {
    return fromZip === toZip ? 10 : 20;
  }
  return 15;
};

// Calculate service duration based on service type
const getServiceDuration = (serviceType: string): number => {
  const durations: { [key: string]: number } = {
    'Pool Cleaning': 45,
    'Pool Repair': 90,
    'Equipment Service': 60,
    'Chemical Balance': 30,
    'Filter Cleaning': 30,
    'Emergency Service': 120,
    'Initial Service': 60,
    'Weekly Service': 45,
    'Bi-weekly Service': 45,
    'Monthly Service': 60,
  };
  return durations[serviceType] || 45; // Default 45 minutes
};

const RouteBuilder: React.FC<RouteBuilderProps> = ({ appointments, onRoutesChange }) => {
  const [customRoutes, setCustomRoutes] = useState<ServiceRoute[]>([]);
  const [selectedAppointments, setSelectedAppointments] = useState<Set<string>>(new Set());
  const [newRouteName, setNewRouteName] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [testCustomerId, setTestCustomerId] = useState('');
  const [testTime, setTestTime] = useState('');
  const [testServiceType, setTestServiceType] = useState('Pool Cleaning');
  const [editingTime, setEditingTime] = useState<{routeId: string, appointmentId: string} | null>(null);
  const [editTimeValue, setEditTimeValue] = useState('');

  const unassignedAppointments = appointments.filter(apt => 
    !customRoutes.some(route => route.appointments.some(rApt => rApt.id === apt.id))
  );

  const createNewRoute = () => {
    if (!newRouteName.trim()) return;
    
    const selectedAppts = appointments.filter(apt => selectedAppointments.has(apt.id));
    if (selectedAppts.length === 0) return;

    const sortedAppts = selectedAppts.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
    const estimatedDuration = calculateRouteDuration(sortedAppts);

    const newRoute: ServiceRoute = {
      id: `custom-${Date.now()}`,
      name: newRouteName,
      area: 'Custom Route',
      appointments: sortedAppts,
      isCustom: true,
      estimatedDuration
    };

    const updatedRoutes = [...customRoutes, newRoute];
    setCustomRoutes(updatedRoutes);
    setSelectedAppointments(new Set());
    setNewRouteName('');
    onRoutesChange(updatedRoutes);
  };

  const calculateRouteDuration = (appts: any[]): number => {
    if (appts.length === 0) return 0;
    
    let totalDuration = 0;
    
    for (let i = 0; i < appts.length; i++) {
      // Add service time
      totalDuration += getServiceDuration(appts[i].service_type);
      
      // Add travel time to next appointment
      if (i < appts.length - 1) {
        totalDuration += calculateTravelTime(appts[i], appts[i + 1]);
      }
    }
    
    return totalDuration;
  };

  const addTestCustomerToRoute = async () => {
    if (!testCustomerId || !testTime || !selectedRouteId) return;
    
    // Fetch customer details
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', testCustomerId)
      .single();
    
    if (!customer) return;

    const testAppointment: TestAppointment = {
      id: `test-${Date.now()}`,
      customer_id: testCustomerId,
      appointment_time: testTime,
      service_type: testServiceType,
      isTest: true,
      customers: {
        first_name: customer.first_name,
        last_name: customer.last_name,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zip_code: customer.zip_code
      }
    };

    const updatedRoutes = customRoutes.map(route => {
      if (route.id === selectedRouteId) {
        const newAppointments = [...route.appointments, testAppointment]
          .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
        
        return {
          ...route,
          appointments: newAppointments,
          estimatedDuration: calculateRouteDuration(newAppointments)
        };
      }
      return route;
    });

    setCustomRoutes(updatedRoutes);
    onRoutesChange(updatedRoutes);
    
    // Reset form
    setTestCustomerId('');
    setTestTime('');
    setTestServiceType('Pool Cleaning');
    setShowAddCustomer(false);
  };

  const startEditingTime = (routeId: string, appointmentId: string, currentTime: string) => {
    setEditingTime({ routeId, appointmentId });
    setEditTimeValue(currentTime);
  };

  const saveTimeEdit = () => {
    if (!editingTime) return;
    
    const updatedRoutes = customRoutes.map(route => {
      if (route.id === editingTime.routeId) {
        const updatedAppointments = route.appointments.map(apt => {
          if (apt.id === editingTime.appointmentId) {
            return { ...apt, appointment_time: editTimeValue, timeModified: true };
          }
          return apt;
        }).sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));

        return {
          ...route,
          appointments: updatedAppointments,
          estimatedDuration: calculateRouteDuration(updatedAppointments)
        };
      }
      return route;
    });

    setCustomRoutes(updatedRoutes);
    onRoutesChange(updatedRoutes);
    setEditingTime(null);
    setEditTimeValue('');
  };

  const cancelTimeEdit = () => {
    setEditingTime(null);
    setEditTimeValue('');
  };

  const removeAppointment = (routeId: string, appointmentId: string) => {
    const updatedRoutes = customRoutes.map(route => {
      if (route.id === routeId) {
        const filteredAppointments = route.appointments.filter(apt => apt.id !== appointmentId);
        return {
          ...route,
          appointments: filteredAppointments,
          estimatedDuration: calculateRouteDuration(filteredAppointments)
        };
      }
      return route;
    });

    setCustomRoutes(updatedRoutes);
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
      r.id === routeId ? { 
        ...r, 
        appointments: optimized,
        estimatedDuration: calculateRouteDuration(optimized)
      } : r
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
      r.id === routeId ? { 
        ...r, 
        appointments: items,
        estimatedDuration: calculateRouteDuration(items)
      } : r
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

      {/* Add Customer to Route */}
      {customRoutes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-primary" />
              <span>Test Route Timing</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showAddCustomer ? (
              <Button onClick={() => setShowAddCustomer(true)} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer to Test Timing
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Select Route</Label>
                  <select
                    value={selectedRouteId}
                    onChange={(e) => setSelectedRouteId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Choose a route...</option>
                    {customRoutes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name} ({route.appointments.length} stops)
                      </option>
                    ))}
                  </select>
                </div>

                <CustomerSelect value={testCustomerId} onChange={setTestCustomerId} />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={testTime}
                      onChange={(e) => setTestTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Service Type</Label>
                    <select
                      value={testServiceType}
                      onChange={(e) => setTestServiceType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="Pool Cleaning">Pool Cleaning</option>
                      <option value="Pool Repair">Pool Repair</option>
                      <option value="Equipment Service">Equipment Service</option>
                      <option value="Chemical Balance">Chemical Balance</option>
                      <option value="Filter Cleaning">Filter Cleaning</option>
                      <option value="Emergency Service">Emergency Service</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={addTestCustomerToRoute} disabled={!testCustomerId || !testTime || !selectedRouteId}>
                    <Timer className="h-4 w-4 mr-2" />
                    Add & Calculate Timing
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddCustomer(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Custom Routes */}
      {customRoutes.map((route) => (
        <Card key={route.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Route className="h-5 w-5 text-primary" />
                <span>{route.name}</span>
                <Badge variant="outline">{route.appointments.length} stops</Badge>
                {route.estimatedDuration && (
                  <Badge variant="secondary" className="ml-2">
                    <Timer className="h-3 w-3 mr-1" />
                    {Math.round(route.estimatedDuration / 60)}h {route.estimatedDuration % 60}m
                  </Badge>
                )}
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
                          snapshot.isDragging ? 'bg-blue-50 border-blue-200' : 
                          apt.isTest ? 'bg-orange-50 border-orange-200' : 'bg-white'
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
                              
                              {editingTime?.routeId === route.id && editingTime?.appointmentId === apt.id ? (
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="time"
                                    value={editTimeValue}
                                    onChange={(e) => setEditTimeValue(e.target.value)}
                                    className="px-2 py-1 text-xs border rounded"
                                  />
                                  <Button size="sm" variant="ghost" onClick={saveTimeEdit}>
                                    <Check className="h-3 w-3 text-green-600" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={cancelTimeEdit}>
                                    <X className="h-3 w-3 text-red-600" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1">
                                  <Badge 
                                    variant="outline" 
                                    className={apt.timeModified ? 'bg-blue-50 border-blue-300' : ''}
                                  >
                                    {apt.appointment_time}
                                  </Badge>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => startEditingTime(route.id, apt.id, apt.appointment_time)}
                                    className="h-5 w-5 p-0"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              
                              {apt.isTest && (
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                  Test
                                </Badge>
                              )}
                              {apt.timeModified && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                  Modified
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {apt.service_type} • {apt.customers?.address || 'No address'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Service: {getServiceDuration(apt.service_type)}min
                              {index < route.appointments.length - 1 && (
                                <span className="ml-2">
                                  Travel: {calculateTravelTime(apt, route.appointments[index + 1])}min
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {apt.isTest && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => removeAppointment(route.id, apt.id)}
                              className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
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
  const { user } = useAuth();
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [selectedSavedId, setSelectedSavedId] = useState('');
  
  const { data: appointments = [] } = useAppointments('day', selectedDate);

  const fetchSavedRoutes = async () => {
    try {
      setLoadingSaved(true);
      const { data, error } = await supabase
        .from('saved_service_routes')
        .select('id, name, description, route_data, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSavedRoutes(data || []);
    } catch (err) {
      console.error('Error loading saved routes:', err);
      toast.error('Failed to load saved routes');
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => {
    if (user) fetchSavedRoutes();
  }, [user, selectedDate]);

  const saveCurrentRoutes = async () => {
    if (!user) {
      toast.error('Please sign in to save routes');
      return;
    }
    if (customRoutes.length === 0) {
      toast.error('No custom routes to save');
      return;
    }
    try {
      setLoadingSaved(true);
      const payload = {
        user_id: user.id,
        name: saveName || `Routes ${format(selectedDate, 'yyyy-MM-dd')}`,
        description: `Routes for ${format(selectedDate, 'yyyy-MM-dd')}`,
        route_data: JSON.parse(JSON.stringify({
          date: format(selectedDate, 'yyyy-MM-dd'),
          routes: customRoutes,
        })) as any,
      };
      const { error } = await supabase.from('saved_service_routes').insert(payload);
      if (error) throw error;
      toast.success('Routes saved');
      setShowSaveDialog(false);
      setSaveName('');
      fetchSavedRoutes();
    } catch (err) {
      console.error('Error saving routes:', err);
      toast.error('Failed to save routes');
    } finally {
      setLoadingSaved(false);
    }
  };

  const loadSelectedRouteSet = () => {
    const item = savedRoutes.find(r => r.id === selectedSavedId);
    if (!item) return;
    const data = (item as any).route_data as any;
    if (data?.routes) {
      setCustomRoutes(data.routes);
      toast.success('Routes loaded');
    } else {
      toast.error('Saved data is invalid');
    }
  };
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

            <select
              value={selectedSavedId}
              onChange={(e) => setSelectedSavedId(e.target.value)}
              disabled={loadingSaved}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Saved for {format(selectedDate, 'MM/dd')}</option>
              {savedRoutes
                .filter((r: any) => (r.route_data?.date) === format(selectedDate, 'yyyy-MM-dd'))
                .map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </select>
            <Button variant="outline" onClick={() => setShowSaveDialog(true)}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={loadSelectedRouteSet} disabled={!selectedSavedId}>
              Load
            </Button>
            <Badge variant="secondary">
              {totalAppointments} appointments
            </Badge>
          </div>
        </div>
 
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Routes</DialogTitle>
              <DialogDescription>
                Name this set of routes for {format(selectedDate, 'MMMM d, yyyy')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Label htmlFor="route-set-name">Route Set Name</Label>
              <Input
                id="route-set-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder={`Routes ${format(selectedDate, 'yyyy-MM-dd')}`}
              />
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
                <Button onClick={saveCurrentRoutes} disabled={loadingSaved}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
            <DialogDescription>
              Full route details for {format(selectedDate, 'MMMM d, yyyy')}
            </DialogDescription>
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