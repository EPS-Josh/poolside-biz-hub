
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CustomerServiceForm } from '@/components/CustomerServiceForm';
import { CustomerPhotos } from '@/components/CustomerPhotos';
import { ServiceHistory } from '@/components/ServiceHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Building, Mail, Phone, MapPin, Clock, UserX, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  mailing_address?: string;
  mailing_city?: string;
  mailing_state?: string;
  mailing_zip_code?: string;
  notes?: string;
  created_at: string;
  previous_first_name?: string;
  previous_last_name?: string;
  owner_changed_date?: string;
  owner_changed_by?: string;
  owner_verified_at?: string;
  owner_verified_by?: string;
}

const CustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      setCustomer(data);
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customer details',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [user, id]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="flex items-center justify-center">
                <div>Loading customer details...</div>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!customer) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Customer not found
                </h2>
                <Button onClick={() => navigate('/customers')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Customers
                </Button>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/customers')}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Customers
              </Button>
              
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-blue-100 p-3 rounded-full">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {customer.first_name} {customer.last_name}
                    </h1>
                    {customer.owner_verified_at && (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-300">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Owner Verified
                      </Badge>
                    )}
                    {customer.owner_changed_date && (
                      <Badge variant="secondary" className="text-xs">
                        <UserX className="h-3 w-3 mr-1" />
                        Not Original Owner
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600">Customer Details & Service Information</p>
                </div>
              </div>
            </div>

            {/* Customer Basic Info */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{customer.email}</p>
                    </div>
                  </div>
                  
                  {customer.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{customer.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {customer.company && (
                    <div className="flex items-center space-x-3">
                      <Building className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Company</p>
                        <p className="font-medium">{customer.company}</p>
                      </div>
                    </div>
                  )}
                  
                  {(customer.address || customer.city || customer.state) && (
                    <div className="flex items-center space-x-3 md:col-span-2 lg:col-span-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Property Address</p>
                        <p className="font-medium">
                          {customer.address && `${customer.address}, `}
                          {customer.city && `${customer.city}, `}
                          {customer.state} {customer.zip_code}
                        </p>
                      </div>
                    </div>
                  )}

                  {(customer.mailing_address || customer.mailing_city || customer.mailing_state || customer.mailing_zip_code) && (
                    <div className="flex items-center space-x-3 md:col-span-2 lg:col-span-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Mailing Address</p>
                        <p className="font-medium">
                          {customer.mailing_address && `${customer.mailing_address}, `}
                          {customer.mailing_city && `${customer.mailing_city}, `}
                          {customer.mailing_state} {customer.mailing_zip_code}
                        </p>
                      </div>
                    </div>
                  )}
                  
                   {customer.owner_verified_at && (
                     <div className="flex items-center space-x-3">
                       <ShieldCheck className="h-5 w-5 text-green-600" />
                       <div>
                         <p className="text-sm text-gray-500">Owner Verified</p>
                         <p className="font-medium text-green-700">
                           {new Date(customer.owner_verified_at).toLocaleDateString('en-US', {
                             year: 'numeric',
                             month: 'long',
                             day: 'numeric'
                           })}
                         </p>
                       </div>
                     </div>
                   )}
                   
                   {customer.notes && (
                     <div className="md:col-span-2 lg:col-span-3">
                       <p className="text-sm text-gray-500 mb-1">Notes</p>
                       <p className="text-gray-900">{customer.notes}</p>
                     </div>
                   )}
                </div>
              </CardContent>
            </Card>

            {/* Service History */}
            <div className="mb-6">
              <ServiceHistory customerId={customer.id} />
            </div>

            {/* Service Details Form */}
            <CustomerServiceForm customerId={customer.id} />

            {/* Photos Section */}
            <CustomerPhotos customerId={customer.id} />

            {/* Previous Owner Information */}
            {customer.owner_changed_date && customer.previous_first_name && customer.previous_last_name && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Previous Owner Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Previous Owner</p>
                        <p className="font-medium text-lg">
                          {customer.previous_first_name} {customer.previous_last_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Ownership Changed</p>
                        <p className="font-medium">
                          {new Date(customer.owner_changed_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-muted">
                      <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> This property was previously owned by {customer.previous_first_name} {customer.previous_last_name}. 
                        All service history and records from the previous ownership are preserved and accessible.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default CustomerDetails;
