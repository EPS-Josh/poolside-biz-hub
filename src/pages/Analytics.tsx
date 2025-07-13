import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { CalendarDays, Users, Wrench, DollarSign, TrendingUp, TrendingDown, Package, Target } from "lucide-react";
import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("all");

  // Key Metrics Queries
  const { data: metricsData } = useQuery({
    queryKey: ['analytics-metrics', timeRange],
    queryFn: async () => {
      // Total customers
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // Service records - filter by date range or get all
      let serviceQuery = supabase
        .from('service_records')
        .select('*, customers(first_name, last_name)', { count: 'exact' })
        .order('service_date');

      if (timeRange !== "all") {
        const monthsAgo = parseInt(timeRange);
        const startDate = startOfMonth(subMonths(new Date(), monthsAgo));
        const startDateString = startDate.toISOString().split('T')[0];
        serviceQuery = serviceQuery.gte('service_date', startDateString);
        
        console.log('Applying date filter:', {
          timeRange,
          monthsAgo,
          startDate: startDate.toISOString(),
          startDateString,
          currentDate: new Date().toISOString()
        });
      } else {
        console.log('No date filter applied - getting all service records');
      }

      const { data: serviceRecords, count: totalServices } = await serviceQuery;

      console.log('Service records query result:', {
        timeRange,
        totalServices,
        recordCount: serviceRecords?.length,
        sampleRecords: serviceRecords?.slice(0, 3)
      });

      // Appointments - only future appointments (from today forward)
      const today = new Date().toISOString().split('T')[0];
      let appointmentQuery = supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('appointment_date', today);

      const { count: totalAppointments } = await appointmentQuery;

      console.log('Appointments query result:', {
        today,
        totalAppointments
      });

      // Low stock items
      const { data: lowStockItems } = await supabase
        .from('inventory_items')
        .select('*')
        .lt('quantity_in_stock', 10);

      return {
        totalCustomers: totalCustomers || 0,
        totalServices: totalServices || 0,
        totalAppointments: totalAppointments || 0,
        lowStockCount: lowStockItems?.length || 0,
        serviceRecords: serviceRecords || [],
        lowStockItems: lowStockItems || []
      };
    }
  });

  // Revenue Analytics (mock data - would come from pricing/billing)
  const { data: revenueData } = useQuery({
    queryKey: ['revenue-analytics', timeRange],
    queryFn: async () => {
      if (timeRange === "all") {
        // For "all time", show last 6 months of data
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const date = subMonths(new Date(), i);
          const { count } = await supabase
            .from('service_records')
            .select('*', { count: 'exact', head: true })
            .gte('service_date', startOfMonth(date).toISOString().split('T')[0])
            .lt('service_date', endOfMonth(date).toISOString().split('T')[0]);
          
          months.push({
            month: format(date, 'MMM yyyy'),
            services: count || 0,
            revenue: (count || 0) * 125, // Avg service price
          });
        }
        return months;
      } else {
        const monthsAgo = parseInt(timeRange);
        const months = [];
        
        for (let i = monthsAgo; i >= 0; i--) {
          const date = subMonths(new Date(), i);
          const { count } = await supabase
            .from('service_records')
            .select('*', { count: 'exact', head: true })
            .gte('service_date', startOfMonth(date).toISOString().split('T')[0])
            .lt('service_date', endOfMonth(date).toISOString().split('T')[0]);
          
          months.push({
            month: format(date, 'MMM yyyy'),
            services: count || 0,
            revenue: (count || 0) * 125, // Avg service price
          });
        }
        return months;
      }
    }
  });

  // Service Type Distribution
  const { data: serviceTypeData } = useQuery({
    queryKey: ['service-types-v2', timeRange],
    queryFn: async () => {
      let query = supabase
        .from('service_records')
        .select('service_type');

      if (timeRange !== "all") {
        const monthsAgo = parseInt(timeRange);
        const startDate = startOfMonth(subMonths(new Date(), monthsAgo));
        query = query.gte('service_date', startDate.toISOString().split('T')[0]);
      }

      const { data } = await query;

      const typeCounts = data?.reduce((acc, record) => {
        acc[record.service_type] = (acc[record.service_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return Object.entries(typeCounts).map(([type, count], index) => ({
        type,
        count,
        percentage: Math.round((count / (data?.length || 1)) * 100),
        fill: pieColors[index % pieColors.length] // Add color directly to data
      }));
    }
  });

  const chartConfig = {
    services: {
      label: "Services",
      color: "hsl(var(--primary))"
    },
    revenue: {
      label: "Revenue",
      color: "hsl(var(--secondary))"
    }
  };

  const pieColors = [
    "hsl(210, 100%, 50%)",  // Blue
    "hsl(120, 100%, 40%)",  // Green
    "hsl(30, 100%, 50%)",   // Orange
    "hsl(300, 100%, 50%)",  // Purple
    "hsl(0, 100%, 50%)",    // Red
    "hsl(180, 100%, 40%)",  // Teal
    "hsl(60, 100%, 50%)",   // Yellow
    "hsl(270, 100%, 50%)"   // Violet
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
              <p className="text-muted-foreground">Business insights and performance metrics</p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="1">Last Month</SelectItem>
                <SelectItem value="3">Last 3 Months</SelectItem>
                <SelectItem value="6">Last 6 Months</SelectItem>
                <SelectItem value="12">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metricsData?.totalCustomers || 0}</div>
                <p className="text-xs text-muted-foreground">Active customer base</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Services Completed</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metricsData?.totalServices || 0}</div>
                <p className="text-xs text-muted-foreground">In selected period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled Appointments</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metricsData?.totalAppointments || 0}</div>
                <p className="text-xs text-muted-foreground">Upcoming appointments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                <Package className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{metricsData?.lowStockCount || 0}</div>
                <p className="text-xs text-muted-foreground">Items below threshold</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig}>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Service Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={serviceTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          dataKey="count"
                          label={({ type, percentage }) => `${type}: ${percentage}%`}
                          labelLine={false}
                          style={{ fontSize: '12px', fill: 'hsl(var(--foreground))' }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue & Services Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--primary))" />
                        <Bar yAxisId="right" dataKey="services" fill="hsl(var(--secondary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Types</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {serviceTypeData?.map((service, index) => (
                      <div key={service.type} className="flex items-center justify-between">
                        <span className="font-medium">{service.type}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{service.count} services</Badge>
                          <span className="text-sm text-muted-foreground">{service.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Service Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {metricsData?.serviceRecords?.slice(0, 5).map((record) => (
                        <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium">{record.customers?.first_name} {record.customers?.last_name}</p>
                            <p className="text-sm text-muted-foreground">{record.service_type}</p>
                          </div>
                          <Badge variant="outline">{format(new Date(record.service_date), 'MMM dd')}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Low Stock Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {metricsData?.lowStockItems?.length ? (
                    <div className="space-y-3">
                      {metricsData.lowStockItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{item.name || item.description || 'Unnamed Item'}</p>
                            {item.item_number && (
                              <p className="text-sm text-muted-foreground">Part #: {item.item_number}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge variant="destructive">{item.quantity_in_stock} in stock</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Threshold: {item.low_stock_threshold || 10}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>All inventory items are adequately stocked</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Analytics;