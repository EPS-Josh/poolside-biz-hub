import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calculator, Loader2, Download, Calendar, Plus, MapPin, User, Users, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

interface DayRoute {
  date: string;
  routeType: 'solo-josh' | 'solo-lance' | 'needs-assignment';
  originalTechs: string[]; // Original technician names from service records
  totalMiles: number;
  stops: { name: string; address: string }[];
  legs: { from: string; to: string; distanceMiles: number }[];
}

const HOME_BASE = {
  name: 'Home Base',
  address: '731 E 39th St, Tucson, AZ',
  coordinate: { lat: 32.1976, lng: -110.9568 }
};

// Categorize a technician_name string
const categorizeTechnician = (techName: string): 'josh' | 'lance' | 'multi' => {
  const lower = techName.toLowerCase().trim();
  
  // Check if it's Josh alone (no other names)
  const hasJosh = /\bjosh\b/i.test(lower);
  const hasLance = /\blance\b/i.test(lower);
  const hasOthers = /\b(scott|robert|dave|dad)\b/i.test(lower);
  
  // Multiple names or other technicians = needs assignment
  if ((hasJosh && hasLance) || hasOthers || lower.includes('&') || lower.includes(',') || lower.includes(' and ')) {
    return 'multi';
  }
  
  if (hasJosh && !hasLance) return 'josh';
  if (hasLance && !hasJosh) return 'lance';
  
  return 'multi'; // Default to needing assignment if unclear
};

const HistoricalMileage = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<string[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [calculatedRoutes, setCalculatedRoutes] = useState<DayRoute[]>([]);
  const [routeEmployeeAssignments, setRouteEmployeeAssignments] = useState<Record<string, string>>({});
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

  // Check which routes have already been imported
  useEffect(() => {
    const checkImportedRoutes = async () => {
      const { data } = await supabase
        .from('mileage_entries')
        .select('date, employee, description')
        .ilike('description', '%Auto-calculated%');
      
      if (data) {
        const imported = new Set<string>();
        data.forEach(e => {
          // Track by date + assigned employee + description (to distinguish multi-tech)
          imported.add(`${e.date}-${e.employee}`);
          // Also track with description for multi-tech matching
          if (e.description) {
            imported.add(`${e.date}-${e.employee}-${e.description}`);
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
    
    // Refresh imported routes before calculating to get latest state
    const { data: importedData } = await supabase
      .from('mileage_entries')
      .select('date, employee, description')
      .ilike('description', '%Auto-calculated%');
    
    const freshImportedRoutes = new Set<string>();
    if (importedData) {
      importedData.forEach(e => {
        freshImportedRoutes.add(`${e.date}-${e.employee}`);
        if (e.description) {
          freshImportedRoutes.add(`${e.date}-${e.employee}-${e.description}`);
        }
      });
    }
    setImportedRoutes(freshImportedRoutes);
    
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

      // Map customer+date to technician name
      const technicianMap = new Map<string, string>();
      serviceRecords?.forEach(sr => {
        const key = `${sr.customer_id}-${sr.service_date}`;
        if (sr.technician_name) {
          technicianMap.set(key, sr.technician_name);
        }
      });

      // Group appointments by date, then by category (josh/lance/multi)
      const appointmentsByDateCategory: Record<string, { 
        josh: any[]; 
        lance: any[]; 
        multi: any[];
        techNames: Set<string>;
      }> = {};
      
      appointments.forEach(apt => {
        const date = apt.appointment_date;
        const techKey = `${apt.customer_id}-${date}`;
        const techName = technicianMap.get(techKey) || 'Unassigned';
        const category = categorizeTechnician(techName);
        
        if (!appointmentsByDateCategory[date]) {
          appointmentsByDateCategory[date] = { 
            josh: [], 
            lance: [], 
            multi: [],
            techNames: new Set()
          };
        }
        
        appointmentsByDateCategory[date][category].push(apt);
        appointmentsByDateCategory[date].techNames.add(techName);
      });

      const routes: DayRoute[] = [];
      
      for (const [date, dayData] of Object.entries(appointmentsByDateCategory)) {
        // Process Josh-solo route
        if (dayData.josh.length > 0) {
          const routeKey = `${date}-solo-josh`;
          
          // Check if already imported (by date + Joshua Wilkinson)
          const joshFullName = employees.find(e => e.toLowerCase().includes('josh')) || 'Joshua Wilkinson';
          if (!freshImportedRoutes.has(`${date}-${joshFullName}`)) {
            const route = await calculateRouteForAppointments(date, dayData.josh, 'solo-josh', ['Josh']);
            if (route) routes.push(route);
          }
        }
        
        // Process Lance-solo route
        if (dayData.lance.length > 0) {
          const lanceFullName = employees.find(e => e.toLowerCase().includes('lance')) || 'Lance';
          if (!freshImportedRoutes.has(`${date}-${lanceFullName}`)) {
            const route = await calculateRouteForAppointments(date, dayData.lance, 'solo-lance', ['Lance']);
            if (route) routes.push(route);
          }
        }
        
        // Process multi-tech route (all combined into one route for the day)
        if (dayData.multi.length > 0) {
          const techNames = Array.from(dayData.techNames).filter(t => categorizeTechnician(t) === 'multi');
          
          const joshFullName = employees.find(e => e.toLowerCase().includes('josh')) || 'Joshua Wilkinson';
          const lanceFullName = employees.find(e => e.toLowerCase().includes('lance')) || 'Lance Caulk';
          
          // Multi-tech routes are considered imported if EITHER Josh or Lance already has an entry for this date
          // (because the user would have assigned it to one of them)
          const joshHasEntry = freshImportedRoutes.has(`${date}-${joshFullName}`);
          const lanceHasEntry = freshImportedRoutes.has(`${date}-${lanceFullName}`);
          
          // Also check for "Josh & Lance" style descriptions
          const hasMultiTechEntry = Array.from(freshImportedRoutes).some(key => 
            key.startsWith(date) && key.toLowerCase().includes('josh & lance')
          );
          
          const alreadyImported = joshHasEntry || lanceHasEntry || hasMultiTechEntry;
          
          if (!alreadyImported) {
            const route = await calculateRouteForAppointments(date, dayData.multi, 'needs-assignment', techNames);
            if (route) routes.push(route);
          }
        }
      }

      routes.sort((a, b) => a.date.localeCompare(b.date));

      setCalculatedRoutes(routes);
      
      if (routes.length > 0) {
        const soloCount = routes.filter(r => r.routeType !== 'needs-assignment').length;
        const needsAssignment = routes.filter(r => r.routeType === 'needs-assignment').length;
        toast.success(`Found ${routes.length} routes: ${soloCount} auto-assigned, ${needsAssignment} need assignment`);
      } else {
        toast.warning('No unimported routes found. All routes may have been imported already.');
      }
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to fetch appointments: ' + error.message);
    } finally {
      setIsLoadingAppointments(false);
      setIsCalculating(false);
    }
  };

  const calculateRouteForAppointments = async (
    date: string, 
    dayAppointments: any[], 
    routeType: DayRoute['routeType'],
    originalTechs: string[]
  ): Promise<DayRoute | null> => {
    const validAppointments = dayAppointments.filter(apt => 
      apt.customers?.latitude && apt.customers?.longitude
    );

    if (validAppointments.length === 0) return null;

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
        console.error(`Error calculating route for ${date}:`, routeError);
        return null;
      }

      return {
        date,
        routeType,
        originalTechs,
        totalMiles: routeData.totalDistanceMiles,
        stops: stops.map(s => ({ name: s.name, address: s.address || '' })),
        legs: routeData.legs || []
      };
    } catch (err) {
      console.error(`Failed to calculate route for ${date}:`, err);
      return null;
    }
  };

  const getRouteKey = (route: DayRoute) => `${route.date}-${route.routeType}`;

  const getAssignedEmployee = (route: DayRoute): string | null => {
    const routeKey = getRouteKey(route);
    
    if (route.routeType === 'solo-josh') {
      return employees.find(e => e.toLowerCase().includes('josh')) || 'Joshua Wilkinson';
    }
    if (route.routeType === 'solo-lance') {
      return employees.find(e => e.toLowerCase().includes('lance')) || 'Lance';
    }
    
    // For needs-assignment routes, check if user has selected someone
    return routeEmployeeAssignments[routeKey] || null;
  };

  const importCalculatedRoute = async (route: DayRoute) => {
    const assignedEmployee = getAssignedEmployee(route);
    
    if (!assignedEmployee) {
      toast.error('Please select an employee to assign this route to');
      return;
    }
    
    const importKey = `${route.date}-${assignedEmployee}`;
    if (importedRoutes.has(importKey)) {
      toast.error(`A route for ${assignedEmployee} on this date has already been imported`);
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
        description: `Auto-calculated (${route.stops.length - 2} stops) - ${route.originalTechs.join(', ')}`,
        start_miles: 0,
        end_miles: route.totalMiles,
        employee: assignedEmployee,
      });

    if (error) {
      console.error('Error importing route:', error);
      toast.error('Failed to import route');
      return;
    }

    setImportedRoutes(prev => new Set([...prev, importKey]));
    setCalculatedRoutes(prev => prev.filter(r => getRouteKey(r) !== getRouteKey(route)));
    toast.success(`Imported ${route.totalMiles.toFixed(1)} miles for ${assignedEmployee} on ${format(parseISO(route.date), 'MMM d, yyyy')}`);
  };

  const updateRouteEmployee = (routeKey: string, employee: string) => {
    setRouteEmployeeAssignments(prev => ({ ...prev, [routeKey]: employee }));
  };

  const importAllRoutes = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error('You must be logged in to import routes');
      return;
    }

    // Only import routes that have an assigned employee (solo routes + manually assigned multi routes)
    const toImport: { 
      route: DayRoute;
      employee: string;
    }[] = [];
    
    calculatedRoutes.forEach(route => {
      const assignedEmployee = getAssignedEmployee(route);
      if (!assignedEmployee) return; // Skip unassigned routes
      
      const importKey = `${route.date}-${assignedEmployee}`;
      if (!importedRoutes.has(importKey)) {
        toImport.push({ route, employee: assignedEmployee });
      }
    });

    const skippedCount = calculatedRoutes.filter(r => !getAssignedEmployee(r)).length;

    if (toImport.length === 0) {
      if (skippedCount > 0) {
        toast.warning(`${skippedCount} routes need assignment before importing`);
      } else {
        toast.info('All routes have already been imported');
      }
      return;
    }

    const entries = toImport.map(({ route, employee }) => ({
      user_id: userData.user!.id,
      date: route.date,
      description: `Auto-calculated (${route.stops.length - 2} stops) - ${route.originalTechs.join(', ')}`,
      start_miles: 0,
      end_miles: route.totalMiles,
      employee: employee,
    }));

    const { error } = await supabase
      .from('mileage_entries')
      .insert(entries);

    if (error) {
      console.error('Error importing routes:', error);
      toast.error('Failed to import routes');
      return;
    }

    const newImportedKeys = toImport.map(({ route, employee }) => `${route.date}-${employee}`);
    setImportedRoutes(prev => new Set([...prev, ...newImportedKeys]));
    
    // Remove imported routes from the list
    const importedRouteKeys = new Set(toImport.map(({ route }) => getRouteKey(route)));
    setCalculatedRoutes(prev => prev.filter(r => !importedRouteKeys.has(getRouteKey(r))));
    
    let message = `Imported ${toImport.length} routes`;
    if (skippedCount > 0) {
      message += ` (${skippedCount} routes still need assignment)`;
    }
    toast.success(message);
  };

  const clearAllImportedMileage = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error('You must be logged in');
      return;
    }

    // Delete entries for both employees with Auto-calculated description
    const { error } = await supabase
      .from('mileage_entries')
      .delete()
      .or('employee.eq.Joshua Wilkinson,employee.eq.Lance Caulk')
      .ilike('description', '%Auto-calculated%');

    if (error) {
      console.error('Error clearing mileage:', error);
      toast.error('Failed to clear mileage entries');
      return;
    }

    setImportedRoutes(new Set());
    setCalculatedRoutes([]);
    toast.success('Cleared all auto-calculated mileage entries. Click "Calculate Historical Mileage" to start fresh.');
  };

  const calculatedTotal = calculatedRoutes.reduce((sum, r) => sum + r.totalMiles, 0);
  const soloRoutes = calculatedRoutes.filter(r => r.routeType !== 'needs-assignment');
  const needsAssignmentRoutes = calculatedRoutes.filter(r => r.routeType === 'needs-assignment');

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
              <div className="flex gap-2 mb-4 flex-wrap">
                <Button 
                  onClick={fetchAndCalculateAppointmentMileage}
                  disabled={isLoadingAppointments}
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
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="lg">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Imported
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear all imported mileage?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete all auto-calculated mileage entries for Joshua Wilkinson and Lance Caulk. 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAllImportedMileage}>
                        Yes, Clear All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {calculatedRoutes.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="text-sm">
                      <p className="font-medium">
                        {calculatedRoutes.length} routes · {calculatedTotal.toFixed(1)} total miles · ${(calculatedTotal * ratePerMile).toFixed(2)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> {soloRoutes.length} auto-assigned</span>
                        {needsAssignmentRoutes.length > 0 && (
                          <span className="ml-3 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <Users className="h-3 w-3" /> {needsAssignmentRoutes.length} need assignment
                          </span>
                        )}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={importAllRoutes}>
                      <Download className="h-4 w-4 mr-2" />
                      Import All Assigned
                    </Button>
                  </div>
                  
                  <div className="max-h-[60vh] overflow-y-auto space-y-2">
                    {calculatedRoutes.map(route => {
                      const routeKey = getRouteKey(route);
                      const assignedEmployee = getAssignedEmployee(route);
                      const isSolo = route.routeType !== 'needs-assignment';
                      
                      return (
                        <div 
                          key={routeKey} 
                          className={`p-3 bg-background rounded-lg border space-y-2 ${
                            !isSolo && !assignedEmployee ? 'border-amber-300 dark:border-amber-700' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(parseISO(route.date), 'EEE, MMM d, yyyy')}
                              </span>
                              {isSolo ? (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400 inline-flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {route.routeType === 'solo-josh' ? 'Josh' : 'Lance'}
                                </span>
                              ) : (
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full dark:bg-amber-900/30 dark:text-amber-400 inline-flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {route.originalTechs.join(', ')}
                                </span>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => importCalculatedRoute(route)}
                              disabled={!assignedEmployee}
                              title={!assignedEmployee ? 'Select an employee first' : 'Import route'}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {!isSolo && (
                            <div className="flex items-center gap-2">
                              <Label className="text-xs whitespace-nowrap">Assign to:</Label>
                              <Select 
                                value={assignedEmployee || ''} 
                                onValueChange={(value) => updateRouteEmployee(routeKey, value)}
                              >
                                <SelectTrigger className={`h-8 text-xs flex-1 ${!assignedEmployee ? 'border-amber-400' : ''}`}>
                                  <SelectValue placeholder="Select driver..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {employees.map(emp => (
                                    <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          
                          <div className="text-sm text-muted-foreground">
                            {route.stops.length - 2} stops · {route.totalMiles.toFixed(1)} miles
                            {assignedEmployee && isSolo && (
                              <span className="ml-2">→ {assignedEmployee}</span>
                            )}
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
