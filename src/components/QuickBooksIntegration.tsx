import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, RefreshCw, CheckCircle, AlertCircle, Filter } from 'lucide-react';
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
  invoicing_status?: string;
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

interface QuickBooksInvoice {
  id: string;
  doc_number: string;
  txn_date: string;
  total_amt: number;
  customer_ref: {
    value: string;
    name?: string;
  };
  balance: number;
  printed_status: string;
  email_status: string;
}

export const QuickBooksIntegration = () => {
  const [connection, setConnection] = useState<QuickBooksConnection | null>(null);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [invoiceSyncs, setInvoiceSyncs] = useState<InvoiceSync[]>([]);
  const [qbInvoices, setQbInvoices] = useState<QuickBooksInvoice[]>([]);
  const [allServiceRecords, setAllServiceRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [fetchingInvoices, setFetchingInvoices] = useState(false);
  const [matchingMode, setMatchingMode] = useState<string | null>(null);
  const [selectedServiceRecords, setSelectedServiceRecords] = useState<string[]>([]);
  const [filterUnsyncedOnly, setFilterUnsyncedOnly] = useState(false);
  const [filterUnmatchedInvoices, setFilterUnmatchedInvoices] = useState(false);
  const [filterUnmatchedRecords, setFilterUnmatchedRecords] = useState(false);
  const [filterByCustomerName, setFilterByCustomerName] = useState(true);
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

      // Load service records ready for QuickBooks sync
      const { data: recordsData } = await supabase
        .from('service_records')
        .select(`
          id,
          service_date,
          service_type,
          invoicing_status,
          customers (
            first_name,
            last_name
          )
        `)
        .eq('invoicing_status', 'ready_for_qb')
        .order('service_date', { ascending: false })
        .limit(20);

      setServiceRecords(recordsData || []);

      // Load all service records for manual matching
      const { data: allRecordsData } = await supabase
        .from('service_records')
        .select(`
          id,
          service_date,
          service_type,
          invoicing_status,
          customers (
            first_name,
            last_name
          )
        `)
        .order('service_date', { ascending: false })
        .limit(100);

      setAllServiceRecords(allRecordsData || []);

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
        // Navigate to QuickBooks in the same window for better OAuth support
        window.location.href = data.oauth_url;
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

  const clearInvoicesToSync = async () => {
    try {
      const { error } = await supabase
        .from('service_records')
        .update({ invoicing_status: 'not_to_be_invoiced' })
        .eq('invoicing_status', 'ready_for_qb');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Cleared all invoices from sync list",
      });
      
      loadData(); // Refresh the data
    } catch (error) {
      console.error('Error clearing invoices:', error);
      toast({
        title: "Error",
        description: "Failed to clear invoices to sync",
        variant: "destructive",
      });
    }
  };

  const fetchQBInvoices = async () => {
    setFetchingInvoices(true);
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-integration', {
        body: {
          action: 'fetch_invoices',
          data: {}
        }
      });

      if (error) throw error;

      if (data.success) {
        setQbInvoices(data.invoices || []);
        toast({
          title: "Success",
          description: `Fetched ${data.invoices?.length || 0} invoices from QuickBooks`,
        });
      } else {
        throw new Error(data.error || 'Failed to fetch invoices');
      }
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Fetch Failed",
        description: error.message || "Failed to fetch invoices from QuickBooks",
        variant: "destructive",
      });
    } finally {
      setFetchingInvoices(false);
    }
  };

  const startMatching = (invoiceId: string) => {
    setMatchingMode(invoiceId);
    setSelectedServiceRecords([]);
  };

  const cancelMatching = () => {
    setMatchingMode(null);
    setSelectedServiceRecords([]);
  };

  const toggleServiceRecord = (recordId: string) => {
    setSelectedServiceRecords(prev => 
      prev.includes(recordId) 
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  const saveMatches = async () => {
    if (!matchingMode || selectedServiceRecords.length === 0) return;

    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create sync records for each selected service record
      const syncPromises = selectedServiceRecords.map(serviceRecordId => 
        supabase
          .from('quickbooks_invoice_sync')
          .upsert({
            user_id: user.id,
            service_record_id: serviceRecordId,
            quickbooks_invoice_id: matchingMode,
            sync_status: 'manually_matched',
            last_synced_at: new Date().toISOString(),
          })
      );

      // Update service records to mark them as synced
      const updatePromises = selectedServiceRecords.map(serviceRecordId =>
        supabase
          .from('service_records')
          .update({ invoicing_status: 'synced_to_qb' })
          .eq('id', serviceRecordId)
      );

      await Promise.all([...syncPromises, ...updatePromises]);

      toast({
        title: "Success",
        description: `Matched ${selectedServiceRecords.length} service records with QuickBooks invoice`,
      });

      // Reset matching state and reload data
      setMatchingMode(null);
      setSelectedServiceRecords([]);
      loadData();
    } catch (error) {
      console.error('Error saving matches:', error);
      toast({
        title: "Error",
        description: "Failed to save matches",
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
            <CardTitle className="flex items-center justify-between">
              Invoice Sync
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setFilterUnsyncedOnly(!filterUnsyncedOnly)}
                  size="sm"
                  variant={filterUnsyncedOnly ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {filterUnsyncedOnly ? "Show All" : "Unsynced Only"}
                </Button>
                <Button 
                  onClick={clearInvoicesToSync}
                  size="sm"
                  variant="outline"
                >
                  Clear List
                </Button>
              </div>
            </CardTitle>
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
                serviceRecords
                  .filter((record) => {
                    if (!filterUnsyncedOnly) return true;
                    const syncStatus = getSyncStatus(record.id);
                    return !syncStatus || syncStatus.sync_status === 'error' || syncStatus.sync_status === 'pending';
                  })
                  .map((record) => {
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

      {/* QuickBooks Invoices */}
      {connection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              QuickBooks Invoices
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setFilterUnmatchedInvoices(!filterUnmatchedInvoices)}
                  size="sm"
                  variant={filterUnmatchedInvoices ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {filterUnmatchedInvoices ? "Show All" : "Unmatched Only"}
                </Button>
                <Button 
                  onClick={fetchQBInvoices}
                  disabled={fetchingInvoices}
                  size="sm"
                  variant="outline"
                >
                  {fetchingInvoices ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Fetch Invoices
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              View existing invoices from QuickBooks Online and manually match them with service records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {qbInvoices.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Click "Fetch Invoices" to load invoices from QuickBooks
                </p>
              ) : (
                qbInvoices
                  .filter((invoice) => {
                    if (!filterUnmatchedInvoices) return true;
                    const matchedSync = invoiceSyncs.find(sync => sync.quickbooks_invoice_id === invoice.id);
                    return !matchedSync;
                  })
                  .map((invoice) => {
                    // Check if this invoice is already matched with a service record
                    const matchedSync = invoiceSyncs.find(sync => sync.quickbooks_invoice_id === invoice.id);
                  
                  return (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">
                            Invoice #{invoice.doc_number}
                          </h4>
                          <Badge variant={matchedSync ? "default" : "outline"}>
                            {matchedSync ? "Matched" : "Unmatched"}
                          </Badge>
                          <Badge variant="secondary">
                            ${invoice.total_amt.toFixed(2)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Customer: {invoice.customer_ref.name || invoice.customer_ref.value} • 
                          Date: {new Date(invoice.txn_date).toLocaleDateString()} • 
                          Balance: ${invoice.balance.toFixed(2)}
                        </p>
                        {matchedSync && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ Matched with service record
                          </p>
                        )}
                      </div>
                       <div className="flex items-center gap-2">
                         {!matchedSync && (
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => startMatching(invoice.id)}
                           >
                             Match Records
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

      {/* Manual Matching Interface */}
      {matchingMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Match Service Records to Invoice
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setFilterByCustomerName(!filterByCustomerName)}
                  size="sm"
                  variant={filterByCustomerName ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {filterByCustomerName ? "Matching Names" : "All Customers"}
                </Button>
                <Button 
                  onClick={() => setFilterUnmatchedRecords(!filterUnmatchedRecords)}
                  size="sm"
                  variant={filterUnmatchedRecords ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {filterUnmatchedRecords ? "Show All" : "Unmatched Only"}
                </Button>
                <Button 
                  onClick={saveMatches}
                  disabled={selectedServiceRecords.length === 0}
                  size="sm"
                >
                  Save Matches ({selectedServiceRecords.length})
                </Button>
                <Button 
                  onClick={cancelMatching}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Select the service records that correspond to this QuickBooks invoice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Matching Invoice: <strong>#{qbInvoices.find(inv => inv.id === matchingMode)?.doc_number}</strong>
              </div>
              
              {allServiceRecords
                .filter((record) => {
                  // First apply the unmatched filter
                  if (filterUnmatchedRecords && getSyncStatus(record.id)) {
                    return false;
                  }
                  
                  // Then apply customer name filter if enabled
                  if (filterByCustomerName) {
                    const invoice = qbInvoices.find(inv => inv.id === matchingMode);
                    if (invoice?.customer_ref?.name) {
                      const invoiceCustomerName = invoice.customer_ref.name.toLowerCase();
                      const recordCustomerName = `${record.customers.first_name} ${record.customers.last_name}`.toLowerCase();
                      return recordCustomerName.includes(invoiceCustomerName) || invoiceCustomerName.includes(recordCustomerName);
                    }
                  }
                  
                  return true;
                })
                .map((record) => {
                  const isSelected = selectedServiceRecords.includes(record.id);
                  const isAlreadyMatched = getSyncStatus(record.id);
                
                return (
                  <div
                    key={record.id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                      isSelected ? 'bg-blue-50 border-blue-200' : 
                      isAlreadyMatched ? 'bg-gray-50 border-gray-200' : 
                      'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">
                          {record.customers.first_name} {record.customers.last_name}
                        </h4>
                        <Badge variant={record.invoicing_status === 'ready_for_qb' ? 'default' : 'secondary'}>
                          {record.invoicing_status === 'ready_for_qb' ? 'Ready for QB' : 
                           record.invoicing_status === 'synced_to_qb' ? 'Synced' : 
                           record.invoicing_status}
                        </Badge>
                        {isAlreadyMatched && (
                          <Badge variant="outline">Already Matched</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {record.service_type} • {toPhoenixTime(parseDateFromDatabase(record.service_date)).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {!isAlreadyMatched && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleServiceRecord(record.id);
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};