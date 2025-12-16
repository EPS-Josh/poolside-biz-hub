import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Calendar, TrendingUp, AlertTriangle, CheckCircle, DollarSign, UserPlus, FileDown, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MetricsCard } from '@/components/MetricsCard';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

const CleaningForecast = () => {
  const navigate = useNavigate();
  const [newCustomers, setNewCustomers] = useState(0);
  const [serviceFrequency, setServiceFrequency] = useState<'weekly' | 'biweekly'>('weekly');
  const [avgNewCustomerRate, setAvgNewCustomerRate] = useState(50);
  const [avgServiceTime, setAvgServiceTime] = useState(60);
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState(8);
  const [workingDaysPerWeek, setWorkingDaysPerWeek] = useState(5);
  const [currentEmployees, setCurrentEmployees] = useState(1);
  const [hourlyWage, setHourlyWage] = useState(20);
  const [monthlyOverhead, setMonthlyOverhead] = useState(500);

  const { data: currentStats } = useQuery({
    queryKey: ['cleaning-forecast-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get appointments with Weekly and Bi-Weekly Pool Cleaning from today forward
      const { data: allAppointments, error } = await supabase
        .from('appointments')
        .select(`
          customer_id,
          service_type,
          appointment_date,
          customers!customer_id (
            first_name,
            last_name,
            customer_service_details (
              weekly_rate
            )
          )
        `)
        .in('service_type', ['Weekly Pool Cleaning', 'Weekly Chemical Test', 'Bi-Weekly Pool Cleaning'])
        .gte('appointment_date', today)
        .order('appointment_date');

      if (error) {
        console.error('Error fetching appointments:', error);
        return { totalCustomers: 0, upcomingAppointments: 0, weeklyCustomers: [], biweeklyCustomers: [], weeklyRevenue: 0, biweeklyRevenue: 0 };
      }

      // Group by customer and use their FIRST (earliest) appointment to determine current service type
      const weeklyMap = new Map();
      const biweeklyMap = new Map();
      let totalWeeklyRevenue = 0;
      let totalBiweeklyRevenue = 0;
      
      allAppointments?.forEach(apt => {
        if (apt.customer_id && apt.customers) {
          // Only process if we haven't seen this customer yet (first appointment = current service type)
          if (!weeklyMap.has(apt.customer_id) && !biweeklyMap.has(apt.customer_id)) {
            const weeklyRate = apt.customers.customer_service_details?.weekly_rate || 0;
            const customerData = {
              id: apt.customer_id,
              firstName: apt.customers.first_name,
              lastName: apt.customers.last_name,
              nextAppointment: apt.appointment_date,
              serviceType: apt.service_type,
              weeklyRate,
            };
            
            // Classify based on their CURRENT (first) appointment type
            if (apt.service_type === 'Weekly Pool Cleaning' || apt.service_type === 'Weekly Chemical Test') {
              weeklyMap.set(apt.customer_id, customerData);
              totalWeeklyRevenue += weeklyRate;
            } else if (apt.service_type === 'Bi-Weekly Pool Cleaning') {
              biweeklyMap.set(apt.customer_id, customerData);
              totalBiweeklyRevenue += weeklyRate;
            }
          }
        }
      });

      const weeklyCustomers = Array.from(weeklyMap.values()).sort((a, b) => 
        a.lastName.localeCompare(b.lastName)
      );
      
      const biweeklyCustomers = Array.from(biweeklyMap.values()).sort((a, b) => 
        a.lastName.localeCompare(b.lastName)
      );

      // Get upcoming appointments count
      const { data: upcomingAppointments } = await supabase
        .from('appointments')
        .select('id')
        .gte('appointment_date', today);

      return {
        totalCustomers: weeklyCustomers.length + biweeklyCustomers.length,
        weeklyCount: weeklyCustomers.length,
        biweeklyCount: biweeklyCustomers.length,
        upcomingAppointments: upcomingAppointments?.length || 0,
        weeklyCustomers,
        biweeklyCustomers,
        weeklyRevenue: totalWeeklyRevenue,
        biweeklyRevenue: totalBiweeklyRevenue,
      };
    },
  });

  // Query for potential customers
  const { data: potentialCustomers } = useQuery({
    queryKey: ['potential-cleaning-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_service_details')
        .select(`
          id,
          customer_id,
          is_potential_customer,
          acquisition_source,
          proposed_rate,
          potential_customer_notes,
          customers!customer_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq('is_potential_customer', true);

      if (error) {
        console.error('Error fetching potential customers:', error);
        return [];
      }

      return data?.map((item: any) => ({
        id: item.customer_id,
        firstName: item.customers?.first_name || '',
        lastName: item.customers?.last_name || '',
        acquisitionSource: item.acquisition_source,
        proposedRate: item.proposed_rate,
        notes: item.potential_customer_notes,
      })).sort((a, b) => a.lastName.localeCompare(b.lastName)) || [];
    },
  });

  const potentialCustomerCount = potentialCustomers?.length || 0;
  const potentialRevenue = potentialCustomers?.reduce((sum, c) => sum + (c.proposedRate || 0), 0) || 0;

  const exportPotentialCustomersPdf = () => {
    if (!potentialCustomers || potentialCustomers.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Potential Cleaning Customers', margin, yPos);
    yPos += 10;

    // Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total: ${potentialCustomerCount} customers | Potential Revenue: $${potentialRevenue}/week`, margin, yPos);
    yPos += 5;
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 15;

    // Table header
    doc.setFillColor(245, 158, 11); // Amber color
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('Name', margin + 5, yPos);
    doc.text('Rate/Week', margin + 80, yPos);
    doc.text('Source', margin + 120, yPos);
    yPos += 10;

    // Reset text color
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    potentialCustomers.forEach((customer, index) => {
      // Check if we need a new page
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(254, 243, 199); // Light amber
        doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, 'F');
      }

      const name = `${customer.firstName} ${customer.lastName}`;
      const rate = customer.proposedRate ? `$${customer.proposedRate}` : '-';
      const source = customer.acquisitionSource || '-';

      doc.text(name, margin + 5, yPos);
      doc.text(rate, margin + 80, yPos);
      doc.text(source.substring(0, 25), margin + 120, yPos);
      yPos += 10;

      // Add notes if present
      if (customer.notes) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const notesText = `Notes: ${customer.notes.substring(0, 80)}${customer.notes.length > 80 ? '...' : ''}`;
        doc.text(notesText, margin + 10, yPos);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        yPos += 8;
      }
    });

    doc.save('potential-cleaning-customers.pdf');
  };

  const exportPotentialCustomersSimplePdf = () => {
    if (!potentialCustomers || potentialCustomers.length === 0) return;

    const doc = new jsPDF();
    const margin = 20;
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Potential Cleaning Customers', margin, yPos);
    yPos += 10;

    // Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total: ${potentialCustomerCount} customers`, margin, yPos);
    yPos += 5;
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 15;

    // Simple list of names
    doc.setFontSize(11);
    potentialCustomers.forEach((customer, index) => {
      // Check if we need a new page
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }

      const name = `${index + 1}. ${customer.firstName} ${customer.lastName}`;
      doc.text(name, margin, yPos);
      yPos += 8;
    });

    doc.save('potential-customers-simple.pdf');
  };

  const calculateForecast = () => {
    const currentWeekly = currentStats?.weeklyCount || 0;
    const currentBiweekly = currentStats?.biweeklyCount || 0;
    const currentWeeklyRevenue = currentStats?.weeklyRevenue || 0;
    const currentBiweeklyRevenue = currentStats?.biweeklyRevenue || 0;
    
    // Add new customers based on selected frequency
    const totalWeekly = currentWeekly + (serviceFrequency === 'weekly' ? newCustomers : 0);
    const totalBiweekly = currentBiweekly + (serviceFrequency === 'biweekly' ? newCustomers : 0);
    
    // Calculate services per week (bi-weekly customers = 0.5 per week)
    const servicesPerWeek = totalWeekly + (totalBiweekly * 0.5);
    const hoursPerWeek = (servicesPerWeek * avgServiceTime) / 60;
    const availableHoursPerWeek = workingHoursPerDay * workingDaysPerWeek;
    
    // Calculate based on current employees for utilization
    const currentCapacity = currentEmployees * availableHoursPerWeek;
    const utilizationRate = (hoursPerWeek / currentCapacity) * 100;
    const capacityRemaining = currentCapacity - hoursPerWeek;
    
    // Calculate employees needed for staffing projection
    const employeesNeeded = Math.ceil(hoursPerWeek / availableHoursPerWeek);

    // Revenue calculations
    const weeklyRevenue = currentWeeklyRevenue; // Weekly customers pay every week
    const biweeklyRevenuePerWeek = currentBiweeklyRevenue / 2; // Bi-weekly customers pay every 2 weeks
    
    // Add new customer revenue
    const newCustomerWeeklyRevenue = serviceFrequency === 'weekly' 
      ? (newCustomers * avgNewCustomerRate) 
      : (newCustomers * avgNewCustomerRate) / 2; // Bi-weekly customers contribute half per week
    
    const totalWeeklyRevenue = weeklyRevenue + biweeklyRevenuePerWeek + newCustomerWeeklyRevenue;
    const monthlyRevenue = totalWeeklyRevenue * 4.33; // Average weeks per month
    const annualRevenue = totalWeeklyRevenue * 52;
    const newCustomerMonthlyRevenue = newCustomerWeeklyRevenue * 4.33;

    // Expense calculations
    const laborCostPerWeek = hoursPerWeek * hourlyWage;
    const monthlyLaborCost = laborCostPerWeek * 4.33;
    const annualLaborCost = laborCostPerWeek * 52;
    const annualOverhead = monthlyOverhead * 12;
    const totalAnnualExpenses = annualLaborCost + annualOverhead;

    // Profit calculations
    const weeklyProfit = totalWeeklyRevenue - laborCostPerWeek;
    const monthlyProfit = monthlyRevenue - monthlyLaborCost - monthlyOverhead;
    const annualProfit = annualRevenue - totalAnnualExpenses;
    const profitMargin = annualRevenue > 0 ? (annualProfit / annualRevenue) * 100 : 0;

    return {
      totalCustomers: totalWeekly + totalBiweekly,
      totalWeekly,
      totalBiweekly,
      servicesPerWeek: Math.round(servicesPerWeek * 10) / 10,
      hoursPerWeek: Math.round(hoursPerWeek),
      employeesNeeded,
      utilizationRate: Math.round(utilizationRate),
      capacityRemaining: Math.round(capacityRemaining),
      // Revenue
      weeklyRevenue: Math.round(totalWeeklyRevenue),
      monthlyRevenue: Math.round(monthlyRevenue),
      annualRevenue: Math.round(annualRevenue),
      newCustomerMonthlyRevenue: Math.round(newCustomerMonthlyRevenue),
      // Expenses
      weeklyLaborCost: Math.round(laborCostPerWeek),
      monthlyLaborCost: Math.round(monthlyLaborCost),
      annualLaborCost: Math.round(annualLaborCost),
      monthlyOverhead,
      annualOverhead,
      totalAnnualExpenses: Math.round(totalAnnualExpenses),
      // Profit
      weeklyProfit: Math.round(weeklyProfit),
      monthlyProfit: Math.round(monthlyProfit),
      annualProfit: Math.round(annualProfit),
      profitMargin: Math.round(profitMargin * 10) / 10,
    };
  };

  const forecast = calculateForecast();
  const needsMoreStaff = forecast.employeesNeeded > currentEmployees;
  const staffDifference = forecast.employeesNeeded - currentEmployees;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Cleaning Forecast</h1>
                <p className="text-muted-foreground">
                  Analyze your current workload and forecast capacity needs
                </p>
              </div>
              <Button onClick={() => navigate('/bulk-rate-update')} variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                Update Customer Rates
              </Button>
            </div>

            {/* Current Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                title="Current Employees"
                value={currentEmployees}
                icon={Users}
              />
              <MetricsCard
                title="Employees Needed"
                value={forecast.employeesNeeded}
                icon={TrendingUp}
                changeType={needsMoreStaff ? 'negative' : 'positive'}
                change={needsMoreStaff ? `Need ${staffDifference} more` : 'Sufficient staff'}
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
                    <Label htmlFor="currentEmployees">Current Employees</Label>
                    <Input
                      id="currentEmployees"
                      type="number"
                      min="1"
                      value={currentEmployees}
                      onChange={(e) => setCurrentEmployees(parseInt(e.target.value) || 1)}
                    />
                  </div>

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
                    <Label htmlFor="avgNewCustomerRate">Avg Weekly Rate per New Customer ($)</Label>
                    <Input
                      id="avgNewCustomerRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={avgNewCustomerRate}
                      onChange={(e) => setAvgNewCustomerRate(parseFloat(e.target.value) || 50)}
                    />
                    {newCustomers > 0 && (
                      <p className="text-xs text-muted-foreground">
                        New customer monthly revenue: ${Math.round(forecast.newCustomerMonthlyRevenue)}
                      </p>
                    )}
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

                  <div className="space-y-2">
                    <Label htmlFor="hourlyWage">Employee Hourly Wage ($)</Label>
                    <Input
                      id="hourlyWage"
                      type="number"
                      min="0"
                      step="0.50"
                      value={hourlyWage}
                      onChange={(e) => setHourlyWage(parseFloat(e.target.value) || 20)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthlyOverhead">Monthly Overhead ($)</Label>
                    <Input
                      id="monthlyOverhead"
                      type="number"
                      min="0"
                      step="10"
                      value={monthlyOverhead}
                      onChange={(e) => setMonthlyOverhead(parseFloat(e.target.value) || 500)}
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

                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg text-sm">
                      <span className="font-medium">• Weekly Customers</span>
                      <span className="font-bold">{forecast.totalWeekly}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg text-sm">
                      <span className="font-medium">• Bi-Weekly Customers</span>
                      <span className="font-bold">{forecast.totalBiweekly}</span>
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
                </CardContent>
              </Card>
            </div>

            {/* Revenue & Expense Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Revenue Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Revenue
                  </CardTitle>
                  <CardDescription>
                    Income from pool cleaning services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Weekly</span>
                    <span className="text-lg font-bold text-green-600">${forecast.weeklyRevenue}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Monthly</span>
                    <span className="text-lg font-bold text-green-600">${forecast.monthlyRevenue}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Annual</span>
                    <span className="text-lg font-bold text-green-600">${forecast.annualRevenue}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Expenses Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    Expenses
                  </CardTitle>
                  <CardDescription>
                    Labor and overhead costs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg text-sm">
                    <span className="font-medium">Weekly Labor</span>
                    <span className="font-bold">${forecast.weeklyLaborCost}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Monthly Total</span>
                    <span className="text-lg font-bold text-orange-600">${forecast.monthlyLaborCost + forecast.monthlyOverhead}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg text-sm">
                    <span className="font-medium">• Labor</span>
                    <span className="font-bold">${forecast.monthlyLaborCost}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg text-sm">
                    <span className="font-medium">• Overhead</span>
                    <span className="font-bold">${forecast.monthlyOverhead}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Annual Total</span>
                    <span className="text-lg font-bold text-orange-600">${forecast.totalAnnualExpenses}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Profit Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    Profit
                  </CardTitle>
                  <CardDescription>
                    Net income after expenses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Weekly</span>
                    <span className={`text-lg font-bold ${forecast.weeklyProfit >= 0 ? 'text-blue-600' : 'text-destructive'}`}>
                      ${forecast.weeklyProfit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Monthly</span>
                    <span className={`text-lg font-bold ${forecast.monthlyProfit >= 0 ? 'text-blue-600' : 'text-destructive'}`}>
                      ${forecast.monthlyProfit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Annual</span>
                    <span className={`text-lg font-bold ${forecast.annualProfit >= 0 ? 'text-blue-600' : 'text-destructive'}`}>
                      ${forecast.annualProfit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <span className="text-sm font-medium">Profit Margin</span>
                    <span className={`text-lg font-bold ${forecast.profitMargin >= 0 ? 'text-blue-600' : 'text-destructive'}`}>
                      {forecast.profitMargin}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Staffing Status Alert */}
            <div className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className={`p-4 rounded-lg border ${needsMoreStaff ? 'bg-destructive/10 border-destructive' : 'bg-green-50 dark:bg-green-950 border-green-600'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {needsMoreStaff ? (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      <span className="font-semibold">
                        {needsMoreStaff ? 'Additional Staff Needed' : 'Sufficient Staffing'}
                      </span>
                    </div>
                    <p className="text-sm">
                      {needsMoreStaff
                        ? `You need ${forecast.employeesNeeded} employees but currently have ${currentEmployees}. Consider hiring ${staffDifference} more employee${staffDifference > 1 ? 's' : ''} to maintain service quality.`
                        : `Your current team of ${currentEmployees} employee${currentEmployees > 1 ? 's' : ''} can handle the workload. You have ${forecast.capacityRemaining} hours of weekly capacity remaining.`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Potential Customers Section */}
            {potentialCustomerCount > 0 && (
              <Card className="mt-6 border-amber-200 dark:border-amber-800">
                <CardHeader className="bg-amber-50 dark:bg-amber-950/30 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-amber-600" />
                        Potential Cleaning Customers ({potentialCustomerCount})
                        <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          +${potentialRevenue}/week
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Customers marked as potential acquisitions
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900"
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          Export PDF
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={exportPotentialCustomersSimplePdf}>
                          Names Only
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={exportPotentialCustomersPdf}>
                          Full Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {potentialCustomers?.map((customer: any) => (
                      <div 
                        key={customer.id} 
                        className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                        onClick={() => navigate(`/customer/${customer.id}`)}
                      >
                        <div className="font-medium">
                          {customer.firstName} {customer.lastName}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {customer.proposedRate && (
                            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                              ${customer.proposedRate}/week
                            </span>
                          )}
                          {customer.acquisitionSource && (
                            <Badge variant="outline" className="text-xs">
                              {customer.acquisitionSource}
                            </Badge>
                          )}
                        </div>
                        {customer.notes && (
                          <div className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {customer.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Customers List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Weekly Customers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Weekly Customers ({currentStats?.weeklyCount || 0})
                  </CardTitle>
                  <CardDescription>
                    Customers with weekly pool cleaning service
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentStats?.weeklyCustomers && currentStats.weeklyCustomers.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {currentStats.weeklyCustomers.map((customer: any) => (
                        <div 
                          key={customer.id} 
                          className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="font-medium">
                              {customer.firstName} {customer.lastName}
                            </div>
                            {customer.weeklyRate > 0 && (
                              <span className="text-sm font-semibold text-primary">
                                ${customer.weeklyRate}/wk
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Next: {new Date(customer.nextAppointment).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No weekly customers with upcoming appointments
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Bi-Weekly Customers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Bi-Weekly Customers ({currentStats?.biweeklyCount || 0})
                  </CardTitle>
                  <CardDescription>
                    Customers with bi-weekly pool cleaning service
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentStats?.biweeklyCustomers && currentStats.biweeklyCustomers.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {currentStats.biweeklyCustomers.map((customer: any) => (
                        <div 
                          key={customer.id} 
                          className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="font-medium">
                              {customer.firstName} {customer.lastName}
                            </div>
                            {customer.weeklyRate > 0 && (
                              <span className="text-sm font-semibold text-primary">
                                ${customer.weeklyRate}/wk
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Next: {new Date(customer.nextAppointment).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No bi-weekly customers with upcoming appointments
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default CleaningForecast;
