import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const { isAdmin, isManager } = useUserRoles();
  const { toast } = useToast();
  const [serviceRecords, setServiceRecords] = useState<ServiceRecordWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [invoicingStatusFilter, setInvoicingStatusFilter] = useState<string>('all');
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

  const filteredRecords = serviceRecords.filter(record => {
    const matchesSearch = 
      record.customers?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.customers?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.service_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.technician_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesInvoicingStatus = 
      invoicingStatusFilter === 'all' || record.invoicing_status === invoicingStatusFilter;
    
    return matchesSearch && matchesInvoicingStatus;
  });

  const restoreInvoicingStatus = async () => {
    try {
      const { error } = await supabase
        .from('service_records')
        .update({ 
          invoicing_status: 'ready_for_qb',
          updated_at: new Date().toISOString()
        })
        .neq('service_type', 'Consultation')
        .eq('invoicing_status', 'not_to_be_invoiced');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Updated service records back to Ready for QB",
      });
      
      fetchServiceRecords();
    } catch (error) {
      console.error('Error updating records:', error);
      toast({
        title: "Error",
        description: "Failed to update service records",
        variant: "destructive",
      });
    }
  };

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
    const logoUrl = `${window.location.origin}/lovable-uploads/7105f4fa-22d9-4992-80aa-e0b6effc3bae.png`;
    const timeOnJob = record.total_time_minutes 
      ? record.total_time_minutes >= 60 
        ? `${Math.floor(record.total_time_minutes / 60)}h ${record.total_time_minutes % 60}m`
        : `${record.total_time_minutes} min`
      : 'N/A';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Service Record - ${customerName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 30px 40px; color: #1a1a1a; font-size: 13px; }
            .company-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #0369a1; padding-bottom: 16px; margin-bottom: 24px; }
            .company-logo { height: 70px; width: auto; }
            .company-info { text-align: right; color: #475569; font-size: 12px; line-height: 1.5; }
            .document-title { text-align: center; font-size: 20px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 32px; margin-bottom: 24px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
            .detail-item { display: flex; gap: 6px; }
            .label { font-weight: 600; color: #334155; min-width: 110px; }
            .value { color: #1e293b; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 14px; font-weight: 700; color: #0369a1; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
            .section-content { padding: 8px 12px; background: #fff; border-left: 3px solid #0369a1; margin-top: 4px; line-height: 1.6; }
            .footer { margin-top: 40px; padding-top: 12px; border-top: 2px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="company-header">
            <img src="${logoUrl}" alt="Company Logo" class="company-logo" />
            <div class="company-info">
              <strong>Finest Pools &amp; Spas LLC</strong><br/>
              Service Record Document
            </div>
          </div>

          <div class="document-title">Service Record</div>

          <div class="details-grid">
            <div class="detail-item"><span class="label">Customer:</span><span class="value">${customerName}</span></div>
            <div class="detail-item"><span class="label">Service Date:</span><span class="value">${format(parseISO(record.service_date), 'MM/dd/yyyy')}</span></div>
            <div class="detail-item"><span class="label">Address:</span><span class="value">${record.customers?.address || 'N/A'}</span></div>
            <div class="detail-item"><span class="label">Service Time:</span><span class="value">${record.service_time || 'N/A'}</span></div>
            <div class="detail-item"><span class="label">Service Type:</span><span class="value">${record.service_type}</span></div>
            <div class="detail-item"><span class="label">Technician:</span><span class="value">${record.technician_name || 'N/A'}</span></div>
            <div class="detail-item"><span class="label">Status:</span><span class="value">${record.service_status || 'Completed'}</span></div>
            <div class="detail-item"><span class="label">Time on Job:</span><span class="value">${timeOnJob}</span></div>
          </div>

          ${record.work_performed ? `
            <div class="section">
              <div class="section-title">Work Performed</div>
              <div class="section-content">${record.work_performed}</div>
            </div>
          ` : ''}

          ${record.chemicals_added ? `
            <div class="section">
              <div class="section-title">Chemicals Added</div>
              <div class="section-content">${record.chemicals_added}</div>
            </div>
          ` : ''}

          ${record.equipment_serviced ? `
            <div class="section">
              <div class="section-title">Equipment Serviced</div>
              <div class="section-content">${record.equipment_serviced}</div>
            </div>
          ` : ''}

          ${record.customer_notes ? `
            <div class="section">
              <div class="section-title">Customer Notes</div>
              <div class="section-content">${record.customer_notes}</div>
            </div>
          ` : ''}

          ${record.technician_notes ? `
            <div class="section">
              <div class="section-title">Technician Notes</div>
              <div class="section-content">${record.technician_notes}</div>
            </div>
          ` : ''}

          <div class="footer">
            Finest Pools &amp; Spas LLC &bull; Generated on ${format(new Date(), 'MM/dd/yyyy')}
          </div>
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
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer name, service type, or technician..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              <Select value={invoicingStatusFilter} onValueChange={setInvoicingStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by invoicing status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="ready_for_qb">Ready for QB</SelectItem>
                  <SelectItem value="synced_to_qb">Synced to QB</SelectItem>
                  <SelectItem value="not_to_be_invoiced">Not to be Invoiced</SelectItem>
                  <SelectItem value="connected_to_future_record">Connected to Future Record</SelectItem>
                  <SelectItem value="bill_to_company">Bill to Company</SelectItem>
                  <SelectItem value="special_agreement">Special Agreement</SelectItem>
                </SelectContent>
              </Select>
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
                      <TableHead>Invoicing</TableHead>
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
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {record.invoicing_status === 'ready_for_qb' && 'Ready for QB'}
                            {record.invoicing_status === 'synced_to_qb' && 'Synced to QB'}
                            {record.invoicing_status === 'not_to_be_invoiced' && 'Not Invoiced'}
                            {record.invoicing_status === 'connected_to_future_record' && 'Future Record'}
                            {record.invoicing_status === 'bill_to_company' && 'Bill to Company'}
                            {record.invoicing_status === 'special_agreement' && 'Special Agreement'}
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
                            {(isAdmin() || isManager()) && (
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
                            )}
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