import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { parseDateFromDatabase, toPhoenixTime } from '@/utils/phoenixTimeUtils';

interface QuickBooksConnection {
  id: string;
  company_id: string;
  is_active: boolean;
  created_at: string;
  token_expires_at: string;
}

interface ServiceRecord {
  id: string;
  service_date: string;
  service_type: string;
  customers: {
    first_name: string;
    last_name: string;
  };
}

interface InvoiceSync {
  id: string;
  service_record_id: string;
  quickbooks_invoice_id: string | null;
  sync_status: string;
  error_message: string | null;
  last_synced_at: string | null;
  service_records: ServiceRecord;
}

export const QuickBooksIntegration = () => {
  const [connection, setConnection] = useState<QuickBooksConnection | null>(null);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [invoiceSyncs, setInvoiceSyncs] = useState<InvoiceSync[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    handleOAuthCallback();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load QuickBooks connection
      const { data: connectionData } = await supabase
        .from('quickbooks_connections')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      setConnection(connectionData);

      // Load service records
      const { data: recordsData } = await supabase
        .from('service_records')
        .select(`
          id,
          service_date,
          service_type,
          customers (
            first_name,
            last_name
          )
        `)
        .order('service_date', { ascending: false })
        .limit(20);

      setServiceRecords(recordsData || []);

      // Load invoice sync status
      const { data: syncData } = await supabase
        .from('quickbooks_invoice_sync')
        .select(`
          *,
          service_records (
            id,
            service_date,
            service_type,
            customers (
              first_name,
              last_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      setInvoiceSyncs(syncData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load QuickBooks integration data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const realmId = urlParams.get('realmId');

    if (code && realmId) {
      try {
        const { data, error } = await supabase.functions.invoke('quickbooks-integration', {
          body: {
            action: 'oauth_callback',
            data: { 
              code, 
              realmId,
              redirect_uri: `${window.location.origin}/bpa`
            }
          }
        });

        if (error) throw error;

        if (data.success) {
          toast({
            title: "Success",
            description: "Successfully connected to QuickBooks!",
          });
          // Clear the URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          loadData(); // Refresh the data
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast({
          title: "Connection Error",
          description: error.message || "Failed to complete QuickBooks connection",
          variant: "destructive",
        });
      }
    }
  };

  const connectToQuickBooks = async () => {
    try {
      // Get the client ID from our edge function (which has access to secrets)
      const { data, error } = await supabase.functions.invoke('quickbooks-integration', {
        body: {
          action: 'get_oauth_url',
          data: { redirect_uri: `${window.location.origin}/bpa` }
        }
      });

      if (error) throw error;

      if (data.oauth_url) {
        window.open(data.oauth_url, '_blank', 'width=600,height=700');
      } else {
        throw new Error('Failed to generate OAuth URL');
      }
    } catch (error) {
      console.error('Error connecting to QuickBooks:', error);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to QuickBooks. Please try again.",
        variant: "destructive",
      });
    }
  };

  const syncInvoice = async (serviceRecordId: string) => {
    setSyncing(serviceRecordId);
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-integration', {
        body: {
          action: 'sync_invoice',
          data: { service_record_id: serviceRecordId }
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: "Invoice synced to QuickBooks successfully",
        });
        loadData(); // Refresh data
      } else {
        throw new Error(data.error || 'Failed to sync invoice');
      }
    } catch (error: any) {
      console.error('Error syncing invoice:', error);
      
      // Try to get more detailed error info
      let errorMessage = error.message || "Failed to sync invoice to QuickBooks";
      
      // Check if this is a token/auth error
      if (errorMessage.includes('invalid_grant') || 
          errorMessage.includes('Token refresh failed') ||
          errorMessage.includes('Incorrect Token type')) {
        errorMessage = "QuickBooks connection is invalid. Please reconnect to QuickBooks.";
        
        // Clear the invalid connection
        if (connection) {
          await supabase
            .from('quickbooks_connections')
            .update({ is_active: false })
            .eq('id', connection.id);
          
          setConnection(null);
          
          toast({
            title: "Connection Issue",
            description: "Your QuickBooks connection has expired. Please reconnect.",
            variant: "destructive",
          });
          return;
        }
      }
      
      // If it's a FunctionsHttpError, the real error is in the function response
      if (error.name === 'FunctionsHttpError') {
        errorMessage = "QuickBooks sync failed. Check the console for details.";
      }
      
      toast({
        title: "Sync Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSyncing(null);
    }
  };

  const disconnectQuickBooks = async () => {
    if (!connection) return;
    
    try {
      await supabase
        .from('quickbooks_connections')
        .update({ is_active: false })
        .eq('id', connection.id);
      
      setConnection(null);
      
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from QuickBooks",
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect from QuickBooks",
        variant: "destructive",
      });
    }
  };

  const getSyncStatus = (serviceRecordId: string) => {
    return invoiceSyncs.find(sync => sync.service_record_id === serviceRecordId);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading QuickBooks integration...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            QuickBooks Online Integration
            {connection ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive">Not Connected</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Sync your service records as invoices in QuickBooks Online
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!connection ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                Connect your QuickBooks Online account to start syncing invoices
              </p>
              <Button onClick={connectToQuickBooks} className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Connect to QuickBooks
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Connected to Company ID: {connection.company_id}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Connected: {new Date(connection.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={loadData} size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline" onClick={disconnectQuickBooks} size="sm">
                    Disconnect
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Sync */}
      {connection && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Sync</CardTitle>
            <CardDescription>
              Sync your service records as invoices to QuickBooks Online
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serviceRecords.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No service records found
                </p>
              ) : (
                serviceRecords.map((record) => {
                  const syncStatus = getSyncStatus(record.id);
                  const isSyncing = syncing === record.id;
                  
                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">
                            {record.customers.first_name} {record.customers.last_name}
                          </h4>
                          {syncStatus && (
                            syncStatus.sync_status === 'synced' ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Synced
                              </Badge>
                            ) : syncStatus.sync_status === 'error' ? (
                              <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Error
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {record.service_type} • {toPhoenixTime(parseDateFromDatabase(record.service_date)).toLocaleDateString()}
                        </p>
                        {syncStatus?.error_message && (
                          <p className="text-sm text-red-600 mt-1">
                            {syncStatus.error_message}
                          </p>
                        )}
                        {syncStatus?.quickbooks_invoice_id && (
                          <p className="text-sm text-muted-foreground mt-1">
                            QB Invoice ID: {syncStatus.quickbooks_invoice_id}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {syncStatus?.sync_status !== 'synced' && (
                          <Button
                            onClick={() => syncInvoice(record.id)}
                            disabled={isSyncing}
                            size="sm"
                          >
                            {isSyncing ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            {syncStatus ? 'Retry Sync' : 'Sync to QB'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};