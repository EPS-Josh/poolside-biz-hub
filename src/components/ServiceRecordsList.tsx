import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ServiceRecordViewer } from '@/components/ServiceRecordViewer';
import { EditServiceRecordForm } from '@/components/EditServiceRecordForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Eye, Edit, Trash2, Printer, Mail, Search, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ServiceRecordWithCustomer {
  id: string;
  customer_id: string;
  service_date: string;
  service_time?: string;
  service_type: string;
  technician_name?: string;
  work_performed?: string;
  chemicals_added?: string;
  equipment_serviced?: string;
  before_readings?: any;
  after_readings?: any;
  customer_notes?: string;
  technician_notes?: string;
  next_service_date?: string;
  total_time_minutes?: number;
  service_status?: string;
  invoicing_status: string;
  parts_used?: any;
  created_at: string;
  customers?: {
    first_name: string;
    last_name: string;
    address?: string;
  };
}

export const ServiceRecordsList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [serviceRecords, setServiceRecords] = useState<ServiceRecordWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingRecord, setViewingRecord] = useState<ServiceRecordWithCustomer | null>(null);
  const [editingRecord, setEditingRecord] = useState<ServiceRecordWithCustomer | null>(null);

  const fetchServiceRecords = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_records')
        .select(`
          *,
          customers (
            first_name,
            last_name,
            address
          )
        `)
        .order('service_date', { ascending: false });

      if (error) {
        console.error('Error fetching service records:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch service records',
          variant: 'destructive'
        });
        return;
      }

      setServiceRecords(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceRecords();
  }, [user]);

  const filteredRecords = serviceRecords.filter(record =>
    record.customers?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.customers?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.service_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.technician_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('service_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Service record deleted successfully'
      });
      
      fetchServiceRecords();
    } catch (error: any) {
      console.error('Error deleting service record:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete service record',
        variant: 'destructive'
      });
    }
  };

  const handlePrint = (record: ServiceRecordWithCustomer) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const customerName = `${record.customers?.first_name || ''} ${record.customers?.last_name || ''}`.trim();
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Service Record - ${customerName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 15px; }
            .label { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Service Record</h1>
            <p><span class="label">Customer:</span> ${customerName}</p>
            <p><span class="label">Date:</span> ${format(parseISO(record.service_date), 'MM/dd/yyyy')}</p>
            <p><span class="label">Service Type:</span> ${record.service_type}</p>
          </div>
          
          <div class="section">
            <p><span class="label">Technician:</span> ${record.technician_name || 'N/A'}</p>
            <p><span class="label">Address:</span> ${record.customers?.address || 'N/A'}</p>
            <p><span class="label">Service Time:</span> ${record.service_time || 'N/A'}</p>
          </div>

          ${record.work_performed ? `
            <div class="section">
              <p class="label">Work Performed:</p>
              <p>${record.work_performed}</p>
            </div>
          ` : ''}

          ${record.chemicals_added ? `
            <div class="section">
              <p class="label">Chemicals Added:</p>
              <p>${record.chemicals_added}</p>
            </div>
          ` : ''}

          ${record.customer_notes ? `
            <div class="section">
              <p class="label">Customer Notes:</p>
              <p>${record.customer_notes}</p>
            </div>
          ` : ''}

          ${record.technician_notes ? `
            <div class="section">
              <p class="label">Technician Notes:</p>
              <p>${record.technician_notes}</p>
            </div>
          ` : ''}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const handleEmail = (record: ServiceRecordWithCustomer) => {
    const customerName = `${record.customers?.first_name || ''} ${record.customers?.last_name || ''}`.trim();
    const subject = encodeURIComponent(`Service Record - ${customerName} - ${format(parseISO(record.service_date), 'MM/dd/yyyy')}`);
    const body = encodeURIComponent(`
Service Record Details:

Customer: ${customerName}
Service Date: ${format(parseISO(record.service_date), 'MM/dd/yyyy')}
Service Type: ${record.service_type}
Technician: ${record.technician_name || 'N/A'}

${record.work_performed ? `Work Performed:\n${record.work_performed}\n\n` : ''}
${record.chemicals_added ? `Chemicals Added:\n${record.chemicals_added}\n\n` : ''}
${record.customer_notes ? `Customer Notes:\n${record.customer_notes}\n\n` : ''}
    `);

    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Service Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading service records...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Service Records
          </CardTitle>
          <CardDescription>
            View and manage all service records with options to view, print, email, edit, and delete
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name, service type, or technician..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>

            {filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No service records match your search.' : 'No service records found.'}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Technician</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {record.customers?.first_name} {record.customers?.last_name}
                            </div>
                            {record.customers?.address && (
                              <div className="text-sm text-muted-foreground">
                                {record.customers.address}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(parseISO(record.service_date), 'MM/dd/yyyy')}
                        </TableCell>
                        <TableCell>{record.service_type}</TableCell>
                        <TableCell>{record.technician_name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(record.service_status || 'completed')}>
                            {record.service_status || 'Completed'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingRecord(record)}
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePrint(record)}
                              title="Print"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEmail(record)}
                              title="Email"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingRecord(record)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Service Record</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this service record? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(record.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Service Record Dialog */}
      {viewingRecord && (
        <ServiceRecordViewer
          record={viewingRecord as any}
          open={!!viewingRecord}
          onOpenChange={(open) => !open && setViewingRecord(null)}
        />
      )}

      {/* Edit Service Record Dialog */}
      {editingRecord && (
        <EditServiceRecordForm
          record={editingRecord as any}
          open={!!editingRecord}
          onOpenChange={(open) => !open && setEditingRecord(null)}
          onSuccess={() => {
            setEditingRecord(null);
            fetchServiceRecords();
          }}
        />
      )}
    </>
  );
};