import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCustomerData } from '@/hooks/useCustomerData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ServiceRecord {
  id: string;
  service_date: string;
  service_type: string;
  service_status?: string;
  technician_name?: string;
  work_performed?: string;
  chemicals_added?: string;
  before_readings?: any;
  after_readings?: any;
  customer_notes?: string;
}

const ClientPortalServiceHistory = () => {
  const navigate = useNavigate();
  const { customer, loading: customerLoading } = useCustomerData();
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customer) {
      fetchServiceRecords();
    }
  }, [customer]);

  const fetchServiceRecords = async () => {
    if (!customer) return;

    try {
      const { data, error } = await supabase
        .from('service_records')
        .select('*')
        .eq('customer_id', customer.id)
        .order('service_date', { ascending: false });

      if (error) throw error;
      setServiceRecords(data || []);
    } catch (error) {
      console.error('Error fetching service records:', error);
    } finally {
      setLoading(false);
    }
  };

  if (customerLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/client-portal')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Portal
          </Button>
          <h1 className="text-2xl font-bold">Service History</h1>
          <p className="text-muted-foreground">Your complete service record history</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {serviceRecords.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No service records found</p>
              <p className="text-muted-foreground mt-2">
                Your service history will appear here after your first service.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {serviceRecords.map((record) => (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{record.service_type}</CardTitle>
                      <CardDescription className="flex items-center mt-2">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(record.service_date), 'MMMM d, yyyy')}
                      </CardDescription>
                    </div>
                    {record.service_status && (
                      <Badge>{record.service_status}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {record.technician_name && (
                    <div>
                      <p className="text-sm font-medium">Technician</p>
                      <p className="text-sm text-muted-foreground">{record.technician_name}</p>
                    </div>
                  )}
                  
                  {record.work_performed && (
                    <div>
                      <p className="text-sm font-medium">Work Performed</p>
                      <p className="text-sm text-muted-foreground">{record.work_performed}</p>
                    </div>
                  )}

                  {record.chemicals_added && (
                    <div>
                      <p className="text-sm font-medium">Chemicals Added</p>
                      <p className="text-sm text-muted-foreground">{record.chemicals_added}</p>
                    </div>
                  )}

                  {(record.before_readings || record.after_readings) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {record.before_readings && (
                        <div>
                          <p className="text-sm font-medium mb-2">Before Readings</p>
                          <div className="bg-muted p-3 rounded-lg text-sm">
                            {Object.entries(record.before_readings).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize">{key}:</span>
                                <span>{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {record.after_readings && (
                        <div>
                          <p className="text-sm font-medium mb-2">After Readings</p>
                          <div className="bg-muted p-3 rounded-lg text-sm">
                            {Object.entries(record.after_readings).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize">{key}:</span>
                                <span>{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {record.customer_notes && (
                    <div>
                      <p className="text-sm font-medium">Notes</p>
                      <p className="text-sm text-muted-foreground">{record.customer_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientPortalServiceHistory;
