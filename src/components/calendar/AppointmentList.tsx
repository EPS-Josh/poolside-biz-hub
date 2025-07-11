
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { EditAppointmentDialog } from './EditAppointmentDialog';
import { AppointmentServiceRecordForm } from './AppointmentServiceRecordForm';
import { ServiceRecordForm } from '@/components/ServiceRecordForm';
import { format, parseISO } from 'date-fns';
import { Clock, User, Calendar, Edit, Trash2, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { parseDateFromDatabase } from '@/utils/dateUtils';
import { formatPhoenixDateForDatabase } from '@/utils/phoenixTimeUtils';

interface AppointmentListProps {
  limit?: number;
  dateFilter?: Date;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({ limit, dateFilter }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [creatingServiceRecord, setCreatingServiceRecord] = useState<any>(null);

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
            city
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
    setCreatingServiceRecord(appointment);
  };

  const handleServiceRecordSuccess = () => {
    setCreatingServiceRecord(null);
    toast.success('Service record created successfully!');
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

  return (
    <>
      <div className="space-y-3">
        {appointments.map((appointment) => (
          <Card key={appointment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status}
                  </Badge>
                  <span className="text-sm text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(parseDateFromDatabase(appointment.appointment_date), 'MMM d, yyyy')}
                  </span>
                  <span className="text-sm text-gray-500 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {appointment.appointment_time}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
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

                {/* Action buttons positioned at the bottom of the card */}
                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCreateServiceRecord(appointment)}
                    className="flex items-center space-x-1 text-xs h-8"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Service Record</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingAppointment(appointment)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAppointmentMutation.mutate(appointment.id)}
                    disabled={deleteAppointmentMutation.isPending}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingAppointment && (
        <EditAppointmentDialog
          appointment={editingAppointment}
          isOpen={!!editingAppointment}
          onOpenChange={(open) => !open && setEditingAppointment(null)}
        />
      )}

      {creatingServiceRecord && (
        <AppointmentServiceRecordForm
          appointmentId={creatingServiceRecord.id}
          customerId={creatingServiceRecord.customer_id}
          appointmentDate={creatingServiceRecord.appointment_date}
          appointmentTime={creatingServiceRecord.appointment_time}
          onServiceRecordCreated={handleServiceRecordSuccess}
        />
      )}
    </>
  );
};
