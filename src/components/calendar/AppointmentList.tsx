
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
        const dateString = dateFilter.toISOString().split('T')[0];
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
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateServiceRecord(appointment)}
                    className="flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Service Record</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingAppointment(appointment)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteAppointmentMutation.mutate(appointment.id)}
                    disabled={deleteAppointmentMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
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
                  <div className="text-sm text-gray-600 mt-2">
                    <strong>Notes:</strong> {appointment.notes}
                  </div>
                )}
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
          appointment={creatingServiceRecord}
          isOpen={!!creatingServiceRecord}
          onOpenChange={(open) => !open && setCreatingServiceRecord(null)}
          onSuccess={handleServiceRecordSuccess}
        />
      )}
    </>
  );
};
