
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { EditAppointmentDialog } from './EditAppointmentDialog';
import { ServiceRecordForm } from '@/components/ServiceRecordForm';
import { format, parseISO } from 'date-fns';
import { Clock, User, Calendar, Edit, Trash2, FileText, Plus, Filter, RefreshCw, KeyRound, Send } from 'lucide-react';
import { toast } from 'sonner';
import { parseDateFromDatabase } from '@/utils/dateUtils';
import { formatPhoenixDateForDatabase } from '@/utils/phoenixTimeUtils';
import { useAppointmentServiceRecords } from '@/hooks/useAppointmentServiceRecords';
import { CheckCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type FilterType = 'all' | 'not-complete' | 'no-service-record' | 'in-progress' | 'confirmed';

interface AppointmentListProps {
  limit?: number;
  dateFilter?: Date;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({ limit, dateFilter }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [creatingServiceRecord, setCreatingServiceRecord] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [accessInfoDialog, setAccessInfoDialog] = useState<{ 
    isOpen: boolean; 
    gateCode?: string; 
    accessInstructions?: string; 
  }>({ isOpen: false });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', dateFilter?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          customers (
            id,
            first_name,
            last_name,
            address,
            city,
            phone,
            sms_opt_in,
            customer_service_details (
              gate_code,
              access_instructions
            )
          )
        `)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (dateFilter) {
        // Use Phoenix date formatting for proper comparison
        const dateString = formatPhoenixDateForDatabase(dateFilter);
        console.log('Filtering appointments for Phoenix date:', dateString);
        query = query.eq('appointment_date', dateString);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching appointments:', error);
        throw error;
      }

      console.log('Fetched appointments:', data);
      return data || [];
    },
    enabled: !!user
  });

  const { data: serviceRecordMap = {} } = useAppointmentServiceRecords(appointments);

  const filteredAppointments = useMemo(() => {
    if (activeFilter === 'all') return appointments;
    
    return appointments.filter(appointment => {
      const hasServiceRecord = !!serviceRecordMap[appointment.id];
      
      switch (activeFilter) {
        case 'not-complete':
          return appointment.status !== 'completed';
        case 'no-service-record':
          return !hasServiceRecord;
        case 'in-progress':
          return appointment.status === 'in-progress';
        case 'confirmed':
          return appointment.status === 'confirmed';
        default:
          return true;
      }
    });
  }, [appointments, serviceRecordMap, activeFilter]);

  const deleteAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
    }
  });

  const sendEnRouteSMS = useMutation({
    mutationFn: async ({ phone, message }: { phone: string; message: string }) => {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { to: phone, message }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('En route message sent successfully');
    },
    onError: (error) => {
      console.error('Error sending SMS:', error);
      toast.error('Failed to send message');
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateServiceRecord = (appointment: any) => {
    console.log('Creating service record for appointment:', appointment);
    setCreatingServiceRecord(appointment);
  };

  const handleServiceRecordSuccess = () => {
    setCreatingServiceRecord(null);
    toast.success('Service record created successfully!');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    toast.success('Appointments refreshed');
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading appointments...</div>;
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {dateFilter ? 'No appointments for this date' : 'No appointments found'}
      </div>
    );
  }

  const filterButtons = [
    { key: 'all' as FilterType, label: 'All', count: appointments.length },
    { key: 'not-complete' as FilterType, label: 'Not Complete', count: appointments.filter(a => a.status !== 'completed').length },
    { key: 'no-service-record' as FilterType, label: 'No Service Record', count: appointments.filter(a => !serviceRecordMap[a.id]).length },
    { key: 'in-progress' as FilterType, label: 'In Progress', count: appointments.filter(a => a.status === 'in-progress').length },
    { key: 'confirmed' as FilterType, label: 'Confirmed', count: appointments.filter(a => a.status === 'confirmed').length },
  ];

  return (
    <>
      {/* Filter and Refresh Buttons */}
      <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filter:</span>
        </div>
        {filterButtons.map(({ key, label, count }) => (
          <Button
            key={key}
            variant={activeFilter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(key)}
            className="text-xs"
          >
            {label} ({count})
          </Button>
        ))}
        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No appointments match the selected filter
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((appointment) => (
          <Card key={appointment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2 flex-wrap">
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status}
                  </Badge>
                  {serviceRecordMap[appointment.id] && (
                    <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      <CheckCircle className="h-3 w-3" />
                      <span>Service Complete</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{format(parseDateFromDatabase(appointment.appointment_date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{appointment.appointment_time}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">
                    {appointment.customers 
                      ? `${appointment.customers.first_name} ${appointment.customers.last_name}`
                      : 'No customer assigned'
                    }
                  </span>
                  {appointment.customers?.address && (
                    <span className="text-sm text-gray-500">
                      - {appointment.customers.address}, {appointment.customers.city}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{appointment.service_type}</span>
                </div>
                
                {appointment.notes && (
                  <div className="text-sm text-gray-600">
                    <strong>Notes:</strong> {appointment.notes}
                  </div>
                )}

                {/* Action buttons contained within card */}
                <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-gray-100">
                  {appointment.customers?.customer_service_details && 
                   (appointment.customers.customer_service_details.gate_code || 
                    appointment.customers.customer_service_details.access_instructions) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAccessInfoDialog({
                        isOpen: true,
                        gateCode: appointment.customers.customer_service_details.gate_code,
                        accessInstructions: appointment.customers.customer_service_details.access_instructions,
                      })}
                      className="flex items-center gap-1 text-xs"
                    >
                      <KeyRound className="h-3 w-3" />
                      <span>Access Info</span>
                    </Button>
                  )}
                  {appointment.customers?.sms_opt_in && appointment.customers?.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const message = `Your technician is en route for your scheduled service appointment today at ${appointment.appointment_time}.`;
                        sendEnRouteSMS.mutate({ 
                          phone: appointment.customers.phone, 
                          message 
                        });
                      }}
                      disabled={sendEnRouteSMS.isPending}
                      className="flex items-center gap-1 text-xs"
                    >
                      <Send className="h-3 w-3" />
                      <span>En Route</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateServiceRecord(appointment)}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Service Record</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingAppointment(appointment)}
                    className="p-2"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAppointmentMutation.mutate(appointment.id)}
                    disabled={deleteAppointmentMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {editingAppointment && (
        <EditAppointmentDialog
          appointment={editingAppointment}
          isOpen={!!editingAppointment}
          onOpenChange={(open) => !open && setEditingAppointment(null)}
        />
      )}

      {creatingServiceRecord && (
        <ServiceRecordForm
          customerId={creatingServiceRecord.customer_id}
          onSuccess={handleServiceRecordSuccess}
          appointmentData={{
            appointmentDate: creatingServiceRecord.appointment_date,
            appointmentTime: creatingServiceRecord.appointment_time,
            serviceType: creatingServiceRecord.service_type,
          }}
          triggerOpen={true}
          onTriggerOpenChange={(open) => !open && setCreatingServiceRecord(null)}
        />
      )}

      <AlertDialog open={accessInfoDialog.isOpen} onOpenChange={(open) => setAccessInfoDialog({ isOpen: open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Access Information
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                {accessInfoDialog.gateCode && (
                  <div>
                    <p className="font-semibold text-foreground mb-1">Gate Code:</p>
                    <p className="text-base text-foreground bg-muted px-3 py-2 rounded font-mono">
                      {accessInfoDialog.gateCode}
                    </p>
                  </div>
                )}
                {accessInfoDialog.accessInstructions && (
                  <div>
                    <p className="font-semibold text-foreground mb-1">Access Instructions:</p>
                    <p className="text-base text-foreground whitespace-pre-wrap">
                      {accessInfoDialog.accessInstructions}
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setAccessInfoDialog({ isOpen: false })}>Close</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
