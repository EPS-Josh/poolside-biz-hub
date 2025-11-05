import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCustomers } from '@/hooks/useCustomers';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function VerifiedCustomers() {
  const navigate = useNavigate();
  const { customers, fetchCustomers } = useCustomers();
  const { toast } = useToast();
  const { user } = useAuth();

  // Filter for verified Pima County customers
  const verifiedCustomers = customers.filter(
    c => c.pima_county_resident !== false && c.owner_verified_at
  );

  const handleUndoVerification = async (customer: any) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          owner_verified_at: null,
          owner_verified_by: null,
          verification_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', customer.id);

      if (error) throw error;

      // Refresh customer list to show unverified customer
      fetchCustomers?.();

      toast({
        title: 'Verification Undone',
        description: `${customer.first_name} ${customer.last_name} verification has been removed`,
      });
    } catch (error) {
      console.error('Error undoing verification:', error);
      toast({
        title: 'Undo Failed',
        description: 'Failed to undo customer verification',
        variant: 'destructive'
      });
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/customers/property-verification')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Property Verification
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Verified Customers</h1>
              <p className="text-muted-foreground">
                Customers that have been owner verified ({verifiedCustomers.length} total)
              </p>
            </div>
          </div>

          {/* Verified Customers List */}
          <Card>
            <CardHeader>
              <CardTitle>Verified Customer Records</CardTitle>
              <CardDescription>
                All customers who have been verified against Pima County Assessor records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verifiedCustomers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No verified customers found
                </div>
              ) : (
                <div className="space-y-3">
                  {verifiedCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {customer.first_name} {customer.last_name}
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {customer.address ? customer.address : 'No address on file'}
                        </div>
                        {customer.previous_first_name && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Previous owner: {customer.previous_first_name} {customer.previous_last_name}
                          </div>
                        )}
                        {customer.owner_verified_at && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Verified: {new Date(customer.owner_verified_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/customer/${customer.id}`)}
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUndoVerification(customer)}
                          className="flex items-center gap-2"
                        >
                          <X className="h-3 w-3" />
                          Undo
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
