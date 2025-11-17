import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DollarSign, Save } from 'lucide-react';

interface CustomerRate {
  customerId: string;
  firstName: string;
  lastName: string;
  serviceType: string;
  currentRate: number | null;
  newRate: number | null;
}

const BulkRateUpdate = () => {
  const [customers, setCustomers] = useState<CustomerRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          customer_id,
          service_type,
          customers!customer_id (
            first_name,
            last_name,
            customer_service_details (
              weekly_rate
            )
          )
        `)
        .in('service_type', ['Weekly Pool Cleaning', 'Bi-Weekly Pool Cleaning'])
        .gte('appointment_date', today)
        .order('appointment_date');

      if (error) throw error;

      // Get unique customers with their first appointment's service type
      const customerMap = new Map<string, CustomerRate>();
      
      appointments?.forEach(apt => {
        if (apt.customer_id && apt.customers && !customerMap.has(apt.customer_id)) {
          const serviceDetails = apt.customers.customer_service_details?.[0];
          customerMap.set(apt.customer_id, {
            customerId: apt.customer_id,
            firstName: apt.customers.first_name,
            lastName: apt.customers.last_name,
            serviceType: apt.service_type,
            currentRate: serviceDetails?.weekly_rate || null,
            newRate: serviceDetails?.weekly_rate || null,
          });
        }
      });

      const customerList = Array.from(customerMap.values()).sort((a, b) => {
        // Sort bi-weekly first, then weekly, then by last name
        if (a.serviceType !== b.serviceType) {
          return a.serviceType === 'Bi-Weekly Pool Cleaning' ? -1 : 1;
        }
        return a.lastName.localeCompare(b.lastName);
      });

      setCustomers(customerList);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const updateRate = (customerId: string, rate: number | null) => {
    setCustomers(prev =>
      prev.map(c =>
        c.customerId === customerId ? { ...c, newRate: rate } : c
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = customers
        .filter(c => c.newRate !== c.currentRate && c.newRate !== null)
        .map(c => ({
          customer_id: c.customerId,
          weekly_rate: c.newRate,
        }));

      if (updates.length === 0) {
        toast.info('No changes to save');
        return;
      }

      // Update each customer's service details
      for (const update of updates) {
        const { error: upsertError } = await supabase
          .from('customer_service_details')
          .upsert(
            {
              customer_id: update.customer_id,
              weekly_rate: update.weekly_rate,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'customer_id',
            }
          );

        if (upsertError) {
          console.error('Error updating rate:', upsertError);
          throw upsertError;
        }
      }

      toast.success(`Updated ${updates.length} customer rate${updates.length > 1 ? 's' : ''}`);
      fetchCustomers(); // Refresh the data
    } catch (error) {
      console.error('Error saving rates:', error);
      toast.error('Failed to save rates');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div>Loading customer rates...</div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const biweeklyCustomers = customers.filter(c => c.serviceType === 'Bi-Weekly Pool Cleaning');
  const weeklyCustomers = customers.filter(c => c.serviceType === 'Weekly Pool Cleaning');

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Bulk Rate Update</h1>
                <p className="text-muted-foreground">
                  Update weekly service rates for all cleaning customers
                </p>
              </div>
              <Button onClick={handleSave} disabled={saving} size="lg">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save All Changes'}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bi-Weekly Customers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Bi-Weekly Customers ({biweeklyCustomers.length})
                  </CardTitle>
                  <CardDescription>
                    Update rates for bi-weekly pool cleaning customers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {biweeklyCustomers.map(customer => (
                      <div key={customer.customerId} className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="font-medium">
                            {customer.firstName} {customer.lastName}
                          </div>
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="$0.00"
                            value={customer.newRate || ''}
                            onChange={(e) =>
                              updateRate(
                                customer.customerId,
                                parseFloat(e.target.value) || null
                              )
                            }
                            className={
                              customer.newRate !== customer.currentRate
                                ? 'border-primary'
                                : ''
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Customers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Weekly Customers ({weeklyCustomers.length})
                  </CardTitle>
                  <CardDescription>
                    Update rates for weekly pool cleaning customers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {weeklyCustomers.map(customer => (
                      <div key={customer.customerId} className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="font-medium">
                            {customer.firstName} {customer.lastName}
                          </div>
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="$0.00"
                            value={customer.newRate || ''}
                            onChange={(e) =>
                              updateRate(
                                customer.customerId,
                                parseFloat(e.target.value) || null
                              )
                            }
                            className={
                              customer.newRate !== customer.currentRate
                                ? 'border-primary'
                                : ''
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6 bg-muted/50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Changed rates are highlighted. Click "Save All Changes" to
                  update the rates in the database. These rates will be used for revenue forecasting
                  and accounting features.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default BulkRateUpdate;
