import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Calculator, DollarSign, Trash2, Plus, MapPin, Loader2, Download, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

interface MileageEntry {
  id: string;
  date: string;
  description: string;
  startMiles: number;
  endMiles: number;
  employee?: string;
}

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

const DEFAULT_EMPLOYEES = ['Josh W', 'Lance C', 'Scott A'];

const MileageCalculator = () => {
  const [entries, setEntries] = useState<MileageEntry[]>(() => {
    const saved = localStorage.getItem('mileageEntries');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [ratePerMile, setRatePerMile] = useState(() => {
    const saved = localStorage.getItem('mileageRate');
    return saved ? parseFloat(saved) : 0.67; // 2024 IRS standard rate
  });

  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    startMiles: '',
    endMiles: '',
    employee: '',
  });

  const [employees, setEmployees] = useState<string[]>(DEFAULT_EMPLOYEES);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [calculatedRoutes, setCalculatedRoutes] = useState<DayRoute[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Fetch unique technicians from service records
  useEffect(() => {
    const fetchEmployees = async () => {
      const { data } = await supabase
        .from('service_records')
        .select('technician_name')
        .not('technician_name', 'is', null);
      
      if (data) {
        const uniqueNames = [...new Set(data.map(r => r.technician_name).filter(Boolean))] as string[];
        if (uniqueNames.length > 0) {
          setEmployees([...uniqueNames, 'Unassigned']);
        }
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    localStorage.setItem('mileageEntries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('mileageRate', ratePerMile.toString());
  }, [ratePerMile]);

  const handleAddEntry = () => {
    if (!newEntry.date || !newEntry.startMiles || !newEntry.endMiles) {
      toast.error('Please fill in date, start miles, and end miles');
      return;
    }

    const start = parseFloat(newEntry.startMiles);
    const end = parseFloat(newEntry.endMiles);

    if (end <= start) {
      toast.error('End miles must be greater than start miles');
      return;
    }

    const entry: MileageEntry = {
      id: crypto.randomUUID(),
      date: newEntry.date,
      description: newEntry.description,
      startMiles: start,
      endMiles: end,
      employee: newEntry.employee || undefined,
    };

    setEntries([...entries, entry]);
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      description: '',
      startMiles: '',
      endMiles: '',
      employee: newEntry.employee, // Keep the same employee selected
    });
    toast.success('Mileage entry added');
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
    toast.success('Entry deleted');
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all entries?')) {
      setEntries([]);
      toast.success('All entries cleared');
    }
  };

  const fetchAndCalculateAppointmentMileage = async () => {
    setIsLoadingAppointments(true);
    setIsCalculating(true);
    setCalculatedRoutes([]);
    
    try {
      // Fetch completed appointments with customer data
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

      // Fetch service records to get technician names
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

      // Create a lookup map for technician by customer_id + date
      const technicianMap = new Map<string, string>();
      serviceRecords?.forEach(sr => {
        const key = `${sr.customer_id}-${sr.service_date}`;
        if (sr.technician_name) {
          technicianMap.set(key, sr.technician_name);
        }
      });

      // Group appointments by date AND technician
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
      
      // Process each day/technician group
      for (const [groupKey, dayAppointments] of Object.entries(appointmentsByDateTech)) {
        const [date, technician] = groupKey.split('|');
        
        // Filter appointments with valid coordinates
        const validAppointments = dayAppointments.filter(apt => 
          apt.customers?.latitude && apt.customers?.longitude
        );

        if (validAppointments.length === 0) continue;

        // Build stops array: Home -> Appointments -> Home
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

        // Calculate route using edge function
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

      // Sort routes by date then technician
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

  const importCalculatedRoute = (route: DayRoute) => {
    // Check if already imported (by date + employee)
    const existingEntry = entries.find(e => 
      e.date === route.date && e.employee === route.technician && e.description.includes('Auto-calculated')
    );
    
    if (existingEntry) {
      toast.error('This route has already been imported');
      return;
    }

    const entry: MileageEntry = {
      id: crypto.randomUUID(),
      date: route.date,
      description: `Auto-calculated (${route.stops.length - 2} stops)`,
      startMiles: 0,
      endMiles: route.totalMiles,
      employee: route.technician,
    };

    setEntries([...entries, entry]);
    toast.success(`Imported ${route.totalMiles.toFixed(1)} miles for ${route.technician} on ${format(parseISO(route.date), 'MMM d, yyyy')}`);
  };

  const importAllRoutes = () => {
    let imported = 0;
    const newEntries: MileageEntry[] = [];
    
    calculatedRoutes.forEach(route => {
      const existingEntry = entries.find(e => 
        e.date === route.date && e.employee === route.technician && e.description.includes('Auto-calculated')
      );
      
      if (!existingEntry) {
        newEntries.push({
          id: crypto.randomUUID(),
          date: route.date,
          description: `Auto-calculated (${route.stops.length - 2} stops)`,
          startMiles: 0,
          endMiles: route.totalMiles,
          employee: route.technician,
        });
        imported++;
      }
    });

    if (newEntries.length > 0) {
      setEntries([...entries, ...newEntries]);
      toast.success(`Imported ${imported} routes`);
    } else {
      toast.info('All routes have already been imported');
    }
  };

  const totalMiles = entries.reduce((sum, e) => sum + (e.endMiles - e.startMiles), 0);
  const totalReimbursement = totalMiles * ratePerMile;

  // Group entries by month
  const entriesByMonth = entries.reduce((acc, entry) => {
    const monthKey = entry.date.substring(0, 7);
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(entry);
    return acc;
  }, {} as Record<string, MileageEntry[]>);

  const sortedMonths = Object.keys(entriesByMonth).sort().reverse();
  const calculatedTotal = calculatedRoutes.reduce((sum, r) => sum + r.totalMiles, 0);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Car className="h-8 w-8" />
              Mileage Calculator
            </h1>
            <p className="text-muted-foreground mt-1">Track business mileage for tax deductions</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Miles</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalMiles.toFixed(1)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Rate per Mile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={ratePerMile}
                    onChange={(e) => setRatePerMile(parseFloat(e.target.value) || 0)}
                    className="w-24 text-xl font-bold"
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Total Reimbursement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">${totalReimbursement.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Calculate from Appointments */}
          <Card className="mb-6 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Calculate from Appointments
              </CardTitle>
              <CardDescription>
                Automatically calculate mileage from completed appointments. 
                Routes start and end at 731 E 39th St, Tucson, AZ.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={fetchAndCalculateAppointmentMileage}
                disabled={isLoadingAppointments}
                className="mb-4"
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
                  
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {calculatedRoutes.map(route => (
                      <div 
                        key={`${route.date}-${route.technician}`} 
                        className="p-3 bg-background rounded-lg border flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(parseISO(route.date), 'EEE, MMM d, yyyy')}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              <User className="h-3 w-3" />
                              {route.technician}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {route.stops.length - 2} stops · {route.totalMiles.toFixed(1)} miles
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {route.stops.slice(1, -1).map(s => s.name).join(' → ')}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => importCalculatedRoute(route)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Entry Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Manual Entry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="employee">Employee</Label>
                  <Select 
                    value={newEntry.employee} 
                    onValueChange={(value) => setNewEntry({ ...newEntry, employee: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Service call to customer"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="startMiles">Start Miles</Label>
                  <Input
                    id="startMiles"
                    type="number"
                    placeholder="0"
                    value={newEntry.startMiles}
                    onChange={(e) => setNewEntry({ ...newEntry, startMiles: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endMiles">End Miles</Label>
                  <Input
                    id="endMiles"
                    type="number"
                    placeholder="0"
                    value={newEntry.endMiles}
                    onChange={(e) => setNewEntry({ ...newEntry, endMiles: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleAddEntry} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </CardContent>
          </Card>

          {/* Entries List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Mileage Log</CardTitle>
                <CardDescription>{entries.length} entries</CardDescription>
              </div>
              {entries.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleClearAll}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No mileage entries yet. Add your first entry above or calculate from appointments.
                </p>
              ) : (
                <div className="space-y-6">
                  {sortedMonths.map(month => {
                    const monthEntries = entriesByMonth[month].sort((a, b) => 
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    const monthMiles = monthEntries.reduce((sum, e) => sum + (e.endMiles - e.startMiles), 0);
                    const monthReimbursement = monthMiles * ratePerMile;
                    const monthDate = new Date(month + '-01');
                    const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

                    return (
                      <div key={month}>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold text-foreground">{monthName}</h3>
                          <div className="text-sm text-muted-foreground">
                            {monthMiles.toFixed(1)} mi · ${monthReimbursement.toFixed(2)}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {monthEntries.map(entry => {
                            const miles = entry.endMiles - entry.startMiles;
                            return (
                              <div 
                                key={entry.id} 
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <span className="text-sm font-medium">
                                      {new Date(entry.date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })}
                                    </span>
                                    {entry.employee && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                        <User className="h-3 w-3" />
                                        {entry.employee}
                                      </span>
                                    )}
                                    {entry.description && (
                                      <span className="text-sm text-muted-foreground">
                                        {entry.description}
                                      </span>
                                    )}
                                  </div>
                                  {entry.startMiles > 0 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {entry.startMiles.toLocaleString()} → {entry.endMiles.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="font-medium">{miles.toFixed(1)} mi</p>
                                    <p className="text-xs text-muted-foreground">
                                      ${(miles * ratePerMile).toFixed(2)}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteEntry(entry.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <Separator className="mt-4" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Note */}
          <p className="text-xs text-muted-foreground mt-4 text-center">
            The 2024 IRS standard mileage rate for business use is $0.67 per mile. 
            Data is stored locally in your browser.
          </p>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default MileageCalculator;
