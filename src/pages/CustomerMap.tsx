import React, { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import OptimizedCustomerMap from '@/components/OptimizedCustomerMap';
import { useCustomers } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Users, Droplets, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const CustomerMapPage = () => {
  const navigate = useNavigate();
  const { customers, loading } = useCustomers();
  const [showCleaningOnly, setShowCleaningOnly] = useState(false);

  // Get cleaning customer IDs (weekly & bi-weekly)
  const { data: cleaningCustomerIds = [] } = useQuery({
    queryKey: ['cleaning-customer-ids'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('customer_id')
        .in('service_type', ['Weekly Pool Cleaning', 'Weekly Chemical Test', 'Bi-Weekly Pool Cleaning'])
        .gte('appointment_date', today);

      if (error) {
        console.error('Error fetching cleaning appointments:', error);
        return [];
      }

      // Get unique customer IDs
      const uniqueIds = [...new Set(appointments?.map(apt => apt.customer_id).filter(Boolean))];
      return uniqueIds as string[];
    },
  });

  // Get potential customer IDs
  const { data: potentialCustomerIds = [] } = useQuery({
    queryKey: ['potential-customer-ids'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_service_details')
        .select('customer_id')
        .eq('is_potential_customer', true);

      if (error) {
        console.error('Error fetching potential customers:', error);
        return [];
      }

      return data?.map(d => d.customer_id) || [];
    },
  });

  // Filter customers based on toggle
  const filteredCustomers = useMemo(() => {
    if (!showCleaningOnly) return customers;
    
    const cleaningAndPotentialIds = new Set([...cleaningCustomerIds, ...potentialCustomerIds]);
    return customers.filter(c => cleaningAndPotentialIds.has(c.id));
  }, [customers, showCleaningOnly, cleaningCustomerIds, potentialCustomerIds]);

  const customersWithAddresses = filteredCustomers.filter(customer => 
    customer.address && customer.city && customer.state
  );

  const customersWithoutAddresses = filteredCustomers.filter(customer => 
    !customer.address || !customer.city || !customer.state
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/customers')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Customers
                </Button>
              </div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center">
                <MapPin className="h-8 w-8 mr-3 text-primary" />
                Customer Map
              </h1>
              <p className="text-muted-foreground">
                Visualize your customers' locations on an interactive map
              </p>
            </div>
          </div>

          {/* Filter Toggle */}
          <Card className="border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Droplets className="h-5 w-5 text-primary" />
                  <div>
                    <Label htmlFor="cleaning-filter" className="text-base font-medium cursor-pointer">
                      Cleaning Customers Only
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Show only weekly/bi-weekly cleaning customers and potential cleaning customers
                    </p>
                  </div>
                </div>
                <Switch
                  id="cleaning-filter"
                  checked={showCleaningOnly}
                  onCheckedChange={setShowCleaningOnly}
                />
              </div>
              {showCleaningOnly && (
                <div className="mt-3 flex gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>{cleaningCustomerIds.length} active cleaning</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserPlus className="h-4 w-4 text-amber-500" />
                    <span>{potentialCustomerIds.length} potential</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {showCleaningOnly ? 'Cleaning Customers' : 'Total Customers'}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredCustomers.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">With Addresses</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{customersWithAddresses.length}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredCustomers.length > 0 ? Math.round((customersWithAddresses.length / filteredCustomers.length) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Missing Addresses</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{customersWithoutAddresses.length}</div>
                <p className="text-xs text-muted-foreground">
                  Need address information
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Locations</CardTitle>
              <CardDescription>
                Click on any marker to view customer details. Customers without complete addresses are not shown on the map.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Loading customers...</p>
                  </div>
                </div>
              ) : (
                <OptimizedCustomerMap customers={filteredCustomers} />
              )}
            </CardContent>
          </Card>

          {/* Customers without addresses */}
          {customersWithoutAddresses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">Customers Missing Address Information</CardTitle>
                <CardDescription>
                  These customers cannot be displayed on the map because they're missing address information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customersWithoutAddresses.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{customer.first_name} {customer.last_name}</p>
                        {customer.company && (
                          <p className="text-sm text-muted-foreground">{customer.company}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/customers/${customer.id}`)}
                      >
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CustomerMapPage;