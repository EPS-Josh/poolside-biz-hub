import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Calendar, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { MetricsCard } from '@/components/MetricsCard';

const CleaningForecast = () => {
  const [newCustomers, setNewCustomers] = useState(0);
  const [serviceFrequency, setServiceFrequency] = useState<'weekly' | 'biweekly'>('weekly');
  const [avgServiceTime, setAvgServiceTime] = useState(60);
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState(8);
  const [workingDaysPerWeek, setWorkingDaysPerWeek] = useState(5);

  const { data: currentStats } = useQuery({
    queryKey: ['cleaning-forecast-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get appointments with Weekly Pool Cleaning from today forward
      const { data: weeklyAppointments, error } = await supabase
        .from('appointments')
        .select(`
          customer_id,
          service_type,
          appointment_date,
          customers!customer_id (
            first_name,
            last_name
          )
        `)
        .eq('service_type', 'Weekly Pool Cleaning')
        .gte('appointment_date', today)
        .order('appointment_date');

      if (error) {
        console.error('Error fetching weekly appointments:', error);
        return { totalCustomers: 0, upcomingAppointments: 0, customers: [] };
      }

      // Get unique customers with their next appointment
      const customerMap = new Map();
      weeklyAppointments?.forEach(apt => {
        if (apt.customer_id && apt.customers && !customerMap.has(apt.customer_id)) {
          customerMap.set(apt.customer_id, {
            id: apt.customer_id,
            firstName: apt.customers.first_name,
            lastName: apt.customers.last_name,
            nextAppointment: apt.appointment_date,
          });
        }
      });

      const customers = Array.from(customerMap.values()).sort((a, b) => 
        a.lastName.localeCompare(b.lastName)
      );

      // Get upcoming appointments count
      const { data: upcomingAppointments } = await supabase
        .from('appointments')
        .select('id')
        .gte('appointment_date', today);

      return {
        totalCustomers: customers.length,
        upcomingAppointments: upcomingAppointments?.length || 0,
        customers,
      };
    },
  });

  const calculateForecast = () => {
    const currentCustomers = currentStats?.totalCustomers || 0;
    const totalCustomers = currentCustomers + newCustomers;
    
    const servicesPerWeek = serviceFrequency === 'weekly' ? totalCustomers : totalCustomers / 2;
    const hoursPerWeek = (servicesPerWeek * avgServiceTime) / 60;
    const availableHoursPerWeek = workingHoursPerDay * workingDaysPerWeek;
    
    const employeesNeeded = Math.ceil(hoursPerWeek / availableHoursPerWeek);
    const utilizationRate = (hoursPerWeek / (employeesNeeded * availableHoursPerWeek)) * 100;
    const capacityRemaining = (employeesNeeded * availableHoursPerWeek) - hoursPerWeek;

    return {
      totalCustomers,
      servicesPerWeek: Math.round(servicesPerWeek),
      hoursPerWeek: Math.round(hoursPerWeek),
      employeesNeeded,
      utilizationRate: Math.round(utilizationRate),
      capacityRemaining: Math.round(capacityRemaining),
    };
  };

  const forecast = calculateForecast();
  const needsMoreStaff = forecast.utilizationRate > 90;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Cleaning Forecast</h1>
              <p className="text-muted-foreground">
                Analyze your current workload and forecast capacity needs
              </p>
            </div>

            {/* Current Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <MetricsCard
                title="Total Customers"
                value={currentStats?.totalCustomers || 0}
                icon={Users}
              />
              <MetricsCard
                title="Upcoming Appointments"
                value={currentStats?.upcomingAppointments || 0}
                icon={Calendar}
              />
              <MetricsCard
                title="Employees Needed"
                value={forecast.employeesNeeded}
                icon={TrendingUp}
                changeType={needsMoreStaff ? 'negative' : 'positive'}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Parameters */}
              <Card>
                <CardHeader>
                  <CardTitle>Forecast Parameters</CardTitle>
                  <CardDescription>
                    Adjust parameters to see how adding customers affects your capacity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newCustomers">New Customers to Add</Label>
                    <Input
                      id="newCustomers"
                      type="number"
                      min="0"
                      value={newCustomers}
                      onChange={(e) => setNewCustomers(parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceFrequency">Service Frequency</Label>
                    <select
                      id="serviceFrequency"
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={serviceFrequency}
                      onChange={(e) => setServiceFrequency(e.target.value as 'weekly' | 'biweekly')}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avgServiceTime">Avg Service Time (minutes)</Label>
                    <Input
                      id="avgServiceTime"
                      type="number"
                      min="15"
                      value={avgServiceTime}
                      onChange={(e) => setAvgServiceTime(parseInt(e.target.value) || 60)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workingHours">Working Hours Per Day</Label>
                    <Input
                      id="workingHours"
                      type="number"
                      min="1"
                      max="24"
                      value={workingHoursPerDay}
                      onChange={(e) => setWorkingHoursPerDay(parseInt(e.target.value) || 8)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workingDays">Working Days Per Week</Label>
                    <Input
                      id="workingDays"
                      type="number"
                      min="1"
                      max="7"
                      value={workingDaysPerWeek}
                      onChange={(e) => setWorkingDaysPerWeek(parseInt(e.target.value) || 5)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Forecast Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Forecast Results</CardTitle>
                  <CardDescription>
                    Projected workload and staffing requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Total Customers</span>
                      <span className="text-lg font-bold">{forecast.totalCustomers}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Services Per Week</span>
                      <span className="text-lg font-bold">{forecast.servicesPerWeek}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Hours Required Per Week</span>
                      <span className="text-lg font-bold">{forecast.hoursPerWeek}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Employees Needed</span>
                      <span className="text-lg font-bold">{forecast.employeesNeeded}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Utilization Rate</span>
                      <span className={`text-lg font-bold ${forecast.utilizationRate > 90 ? 'text-destructive' : 'text-green-600'}`}>
                        {forecast.utilizationRate}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Capacity Remaining (hrs/week)</span>
                      <span className="text-lg font-bold">{forecast.capacityRemaining}</span>
                    </div>
                  </div>

                  {/* Status Alert */}
                  <div className={`p-4 rounded-lg border ${needsMoreStaff ? 'bg-destructive/10 border-destructive' : 'bg-green-50 dark:bg-green-950 border-green-600'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {needsMoreStaff ? (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      <span className="font-semibold">
                        {needsMoreStaff ? 'Additional Staff Needed' : 'Capacity Available'}
                      </span>
                    </div>
                    <p className="text-sm">
                      {needsMoreStaff
                        ? `Your utilization rate is ${forecast.utilizationRate}%. Consider hiring additional staff to maintain service quality.`
                        : `You have ${forecast.capacityRemaining} hours of weekly capacity remaining with your current staffing.`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Current Customers List */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Current Weekly Cleaning Customers ({currentStats?.totalCustomers || 0})
                </CardTitle>
                <CardDescription>
                  Active customers with upcoming weekly pool cleaning appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentStats?.customers && currentStats.customers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentStats.customers.map((customer: any) => (
                      <div 
                        key={customer.id} 
                        className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                      >
                        <div className="font-medium">
                          {customer.firstName} {customer.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Next: {new Date(customer.nextAppointment).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No weekly cleaning customers with upcoming appointments
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default CleaningForecast;
