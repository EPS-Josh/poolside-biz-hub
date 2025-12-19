import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calculator, Loader2, Download, Calendar, Plus, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

interface DayRoute {
  date: string;
  technician: string;
  totalMiles: number;
  stops: { name: string; address: string }[];
  legs: { from: string; to: string; distanceMiles: number }[];
}

const HOME_BASE = {
  name: 'Home Base',
  address: '731 E 39th St, Tucson, AZ',
  coordinate: { lat: 32.1976, lng: -110.9568 }
};

const HistoricalMileage = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<string[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [calculatedRoutes, setCalculatedRoutes] = useState<DayRoute[]>([]);
  const [routeEmployeeOverrides, setRouteEmployeeOverrides] = useState<Record<string, string>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [importedRoutes, setImportedRoutes] = useState<Set<string>>(new Set());

  const [ratePerMile] = useState(() => {
    const saved = localStorage.getItem('mileageRate');
    return saved ? parseFloat(saved) : 0.70;
  });

  // Fetch employees with technician, manager, or admin roles
  useEffect(() => {
    const fetchEmployees = async () => {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['technician', 'manager', 'admin']);
      
      if (roles && roles.length > 0) {
        const userIds = [...new Set(roles.map(r => r.user_id))];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('full_name')
          .in('id', userIds)
          .not('full_name', 'is', null)
          .order('full_name');
        
        if (profiles) {
          const names = profiles.map(p => p.full_name).filter(Boolean) as string[];
          setEmployees(names);
        }
      }
    };
    fetchEmployees();
  }, []);

  // Check which routes have already been imported (by original technician)
  useEffect(() => {
    const checkImportedRoutes = async () => {
      const { data } = await supabase
        .from('mileage_entries')
        .select('date, description')
        .ilike('description', '%Auto-calculated from%');
      
      if (data) {
        const imported = new Set<string>();
        data.forEach(e => {
          // Parse original technician from description: "Auto-calculated from [Tech Name] (X stops)"
          const match = e.description?.match(/Auto-calculated from (.+?) \(/);
          if (match) {
            imported.add(`${e.date}-${match[1]}`);
          }
        });
        setImportedRoutes(imported);
      }
    };
    checkImportedRoutes();
  }, []);

  const fetchAndCalculateAppointmentMileage = async () => {
    setIsLoadingAppointments(true);
    setIsCalculating(true);
    setCalculatedRoutes([]);
    
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          service_type,
          customer_id,
          customers (
            id,
            first_name,
            last_name,
            address,
            city,
            state,
            zip_code,
            latitude,
            longitude
          )
        `)
        .eq('status', 'completed')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;

      if (!appointments || appointments.length === 0) {
        toast.info('No completed appointments found');
        setIsLoadingAppointments(false);
        setIsCalculating(false);
        return;
      }

      const customerIds = [...new Set(appointments.map(a => a.customer_id).filter(Boolean))];
      const appointmentDates = [...new Set(appointments.map(a => a.appointment_date))];
      
      const { data: serviceRecords, error: srError } = await supabase
        .from('service_records')
        .select('customer_id, service_date, technician_name')
        .in('customer_id', customerIds)
        .in('service_date', appointmentDates);

      if (srError) {
        console.error('Error fetching service records:', srError);
      }

      const technicianMap = new Map<string, string>();
      serviceRecords?.forEach(sr => {
        const key = `${sr.customer_id}-${sr.service_date}`;
        if (sr.technician_name) {
          technicianMap.set(key, sr.technician_name);
        }
      });

      const appointmentsByDateTech: Record<string, any[]> = {};
      appointments.forEach(apt => {
        const date = apt.appointment_date;
        const techKey = `${apt.customer_id}-${date}`;
        const technician = technicianMap.get(techKey) || 'Unassigned';
        const groupKey = `${date}|${technician}`;
        
        if (!appointmentsByDateTech[groupKey]) {
          appointmentsByDateTech[groupKey] = [];
        }
        appointmentsByDateTech[groupKey].push(apt);
      });

      const routes: DayRoute[] = [];
      
      for (const [groupKey, dayAppointments] of Object.entries(appointmentsByDateTech)) {
        const [date, technician] = groupKey.split('|');
        
        // Skip routes that have already been imported
        if (importedRoutes.has(`${date}-${technician}`)) continue;
        
        const validAppointments = dayAppointments.filter(apt => 
          apt.customers?.latitude && apt.customers?.longitude
        );

        if (validAppointments.length === 0) continue;

        const stops = [
          HOME_BASE,
          ...validAppointments.map(apt => ({
            name: `${apt.customers.first_name} ${apt.customers.last_name}`,
            address: `${apt.customers.address || ''}, ${apt.customers.city || ''}, ${apt.customers.state || ''}`.trim(),
            coordinate: {
              lat: parseFloat(apt.customers.latitude),
              lng: parseFloat(apt.customers.longitude)
            }
          })),
          HOME_BASE
        ];

        try {
          const { data: routeData, error: routeError } = await supabase.functions.invoke(
            'calculate-route-distance',
            { body: { stops } }
          );

          if (routeError) {
            console.error(`Error calculating route for ${date} (${technician}):`, routeError);
            continue;
          }

          routes.push({
            date,
            technician,
            totalMiles: routeData.totalDistanceMiles,
            stops: stops.map(s => ({ name: s.name, address: s.address || '' })),
            legs: routeData.legs || []
          });
        } catch (err) {
          console.error(`Failed to calculate route for ${date} (${technician}):`, err);
        }
      }

      routes.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.technician.localeCompare(b.technician);
      });

      setCalculatedRoutes(routes);
      
      if (routes.length > 0) {
        toast.success(`Calculated mileage for ${routes.length} routes`);
      } else {
        toast.warning('No routes could be calculated. Make sure customers have geocoded addresses.');
      }
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to fetch appointments: ' + error.message);
    } finally {
      setIsLoadingAppointments(false);
      setIsCalculating(false);
    }
  };

  const importCalculatedRoute = async (route: DayRoute) => {
    const routeKey = `${route.date}-${route.technician}`;
    const assignedEmployee = routeEmployeeOverrides[routeKey] || route.technician;
    
    if (importedRoutes.has(routeKey)) {
      toast.error('This route has already been imported for this employee');
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error('You must be logged in to import routes');
      return;
    }

    const { error } = await supabase
      .from('mileage_entries')
      .insert({
        user_id: userData.user.id,
        date: route.date,
        description: `Auto-calculated from ${route.technician} (${route.stops.length - 2} stops)`,
        start_miles: 0,
        end_miles: route.totalMiles,
        employee: assignedEmployee,
      });

    if (error) {
      console.error('Error importing route:', error);
      toast.error('Failed to import route');
      return;
    }

    setImportedRoutes(prev => new Set([...prev, routeKey]));
    toast.success(`Imported ${route.totalMiles.toFixed(1)} miles for ${assignedEmployee} on ${format(parseISO(route.date), 'MMM d, yyyy')}`);
  };

  const updateRouteEmployee = (routeKey: string, employee: string) => {
    setRouteEmployeeOverrides(prev => ({ ...prev, [routeKey]: employee }));
  };

  const importAllRoutes = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error('You must be logged in to import routes');
      return;
    }

    const toImport: { date: string; description: string; start_miles: number; end_miles: number; employee: string; user_id: string }[] = [];
    const newImportKeys: string[] = [];
    
    calculatedRoutes.forEach(route => {
      const routeKey = `${route.date}-${route.technician}`;
      const assignedEmployee = routeEmployeeOverrides[routeKey] || route.technician;
      
      if (!importedRoutes.has(routeKey)) {
        toImport.push({
          user_id: userData.user!.id,
          date: route.date,
          description: `Auto-calculated from ${route.technician} (${route.stops.length - 2} stops)`,
          start_miles: 0,
          end_miles: route.totalMiles,
          employee: assignedEmployee,
        });
        newImportKeys.push(routeKey);
      }
    });

    if (toImport.length === 0) {
      toast.info('All routes have already been imported');
      return;
    }

    const { error } = await supabase
      .from('mileage_entries')
      .insert(toImport);

    if (error) {
      console.error('Error importing routes:', error);
      toast.error('Failed to import routes');
      return;
    }

    setImportedRoutes(prev => new Set([...prev, ...newImportKeys]));
    toast.success(`Imported ${toImport.length} routes`);
  };

  const calculatedTotal = calculatedRoutes.reduce((sum, r) => sum + r.totalMiles, 0);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/mileage-calculator')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Mileage Calculator
            </Button>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <MapPin className="h-8 w-8" />
              Historical Mileage Calculator
            </h1>
            <p className="text-muted-foreground mt-1">
              Calculate mileage from completed appointments and import into your mileage log
            </p>
          </div>

          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                Calculate from Completed Appointments
              </CardTitle>
              <CardDescription>
                Automatically calculate mileage from all completed appointments. 
                Routes start and end at 731 E 39th St, Tucson, AZ.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={fetchAndCalculateAppointmentMileage}
                disabled={isLoadingAppointments}
                className="mb-4"
                size="lg"
              >
                {isLoadingAppointments ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isCalculating ? 'Calculating Routes...' : 'Loading Appointments...'}
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Historical Mileage
                  </>
                )}
              </Button>

              {calculatedRoutes.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Found {calculatedRoutes.length} routes · {calculatedTotal.toFixed(1)} total miles · ${(calculatedTotal * ratePerMile).toFixed(2)}
                    </p>
                    <Button variant="outline" size="sm" onClick={importAllRoutes}>
                      <Download className="h-4 w-4 mr-2" />
                      Import All
                    </Button>
                  </div>
                  
                  <div className="max-h-[60vh] overflow-y-auto space-y-2">
                    {calculatedRoutes.map(route => {
                      const routeKey = `${route.date}-${route.technician}`;
                      const assignedEmployee = routeEmployeeOverrides[routeKey] || route.technician;
                      const importKey = `${route.date}-${assignedEmployee}`;
                      const isImported = importedRoutes.has(importKey);
                      
                      return (
                        <div 
                          key={routeKey} 
                          className={`p-3 bg-background rounded-lg border space-y-2 ${isImported ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(parseISO(route.date), 'EEE, MMM d, yyyy')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                (from: {route.technician})
                              </span>
                              {isImported && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">
                                  Imported
                                </span>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => importCalculatedRoute(route)}
                              disabled={isImported}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs whitespace-nowrap">Assign to:</Label>
                            <Select 
                              value={assignedEmployee} 
                              onValueChange={(value) => updateRouteEmployee(routeKey, value)}
                              disabled={isImported}
                            >
                              <SelectTrigger className="h-8 text-xs flex-1">
                                <SelectValue placeholder="Select employee..." />
                              </SelectTrigger>
                              <SelectContent>
                                {employees.map(emp => (
                                  <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {route.stops.length - 2} stops · {route.totalMiles.toFixed(1)} miles
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {route.stops.slice(1, -1).map(s => s.name).join(' → ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default HistoricalMileage;
