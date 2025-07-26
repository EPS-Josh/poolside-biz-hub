import React from 'react';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import OptimizedCustomerMap from '@/components/OptimizedCustomerMap';
import { useCustomers } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CustomerMapPage = () => {
  const navigate = useNavigate();
  const { customers, loading } = useCustomers();

  const customersWithAddresses = customers.filter(customer => 
    customer.address && customer.city && customer.state
  );

  const customersWithoutAddresses = customers.filter(customer => 
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

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customers.length}</div>
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
                  {Math.round((customersWithAddresses.length / customers.length) * 100)}% of total
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
                <OptimizedCustomerMap customers={customers} />
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