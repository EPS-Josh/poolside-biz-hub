import { useState } from 'react';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Calendar, CheckCircle, Clock, User, FileText, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ServiceSelect } from '@/components/calendar/ServiceSelect';
import { formatPhoenixDateForDatabase, getCurrentPhoenixDate } from '@/utils/phoenixTimeUtils';

interface FollowUpRecord {
  id: string;
  customer_id: string;
  service_date: string;
  service_type: string;
  technician_notes: string;
  follow_up_notes: string;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  customers: {
    first_name: string;
    last_name: string;
    address: string;
    phone: string;
    email: string;
  };
}

const FollowUps = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRecord, setSelectedRecord] = useState<FollowUpRecord | null>(null);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    appointment_date: '',
    appointment_time: '',
    service_type: '',
    notes: ''
  });

  // Fetch follow-up records
  const { data: followUpRecords, isLoading } = useQuery({
    queryKey: ['follow-ups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_records')
        .select(`
          id,
          customer_id,
          service_date,
          service_type,
          technician_notes,
          follow_up_notes,
          follow_up_date,
          follow_up_completed,
          customers (
            first_name,
            last_name,
            address,
            phone,
            email
          )
        `)
        .eq('needs_follow_up', true)
        .eq('follow_up_completed', false)
        .order('follow_up_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as FollowUpRecord[];
    },
    enabled: !!user
  });

  // Mark follow-up as completed
  const completeMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from('service_records')
        .update({
          follow_up_completed: true,
          follow_up_completed_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      toast({
        title: 'Success',
        description: 'Follow-up marked as completed',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update follow-up status',
        variant: 'destructive',
      });
      console.error('Error:', error);
    }
  });

  // Create appointment from follow-up
  const createAppointmentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRecord || !user) return;

      const { error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          customer_id: selectedRecord.customer_id,
          appointment_date: appointmentData.appointment_date,
          appointment_time: appointmentData.appointment_time,
          service_type: appointmentData.service_type,
          status: 'scheduled',
          notes: appointmentData.notes
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Success',
        description: 'Follow-up appointment created successfully',
      });
      setAppointmentDialogOpen(false);
      setSelectedRecord(null);
      setAppointmentData({
        appointment_date: '',
        appointment_time: '',
        service_type: '',
        notes: ''
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create appointment',
        variant: 'destructive',
      });
      console.error('Error:', error);
    }
  });

  const handleCreateAppointment = (record: FollowUpRecord) => {
    setSelectedRecord(record);
    const currentDate = getCurrentPhoenixDate();
    setAppointmentData({
      appointment_date: record.follow_up_date || formatPhoenixDateForDatabase(currentDate),
      appointment_time: '09:00',
      service_type: record.service_type,
      notes: record.follow_up_notes || ''
    });
    setAppointmentDialogOpen(true);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Follow-ups Needed</h1>
              <p className="text-muted-foreground">
                Service records requiring follow-up appointments
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading follow-ups...</p>
              </div>
            ) : !followUpRecords || followUpRecords.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="text-lg text-muted-foreground">
                    No pending follow-ups! All service records are up to date.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {followUpRecords.map((record) => (
                  <Card key={record.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-1">
                            {record.customers.first_name} {record.customers.last_name}
                          </CardTitle>
                          <CardDescription>
                            {record.customers.address}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-yellow-50">
                            {record.service_type}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-sm font-medium">Original Service Date</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(record.service_date), 'PPP')}
                            </p>
                          </div>
                        </div>
                        {record.follow_up_date && (
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                              <p className="text-sm font-medium">Follow-up Date</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(record.follow_up_date), 'PPP')}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-sm font-medium">Contact</p>
                            <p className="text-sm text-muted-foreground">{record.customers.phone}</p>
                            <p className="text-sm text-muted-foreground">{record.customers.email}</p>
                          </div>
                        </div>
                      </div>

                      {record.follow_up_notes && (
                        <div className="mb-4 p-3 bg-muted rounded-lg">
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-1">Follow-up Instructions</p>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {record.follow_up_notes}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {record.technician_notes && (
                        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs font-medium mb-1 text-muted-foreground">Original Technician Notes</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {record.technician_notes}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleCreateAppointment(record)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Create Appointment
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => completeMutation.mutate(record.id)}
                          disabled={completeMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Completed
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Create Appointment Dialog */}
        <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Follow-up Appointment</DialogTitle>
            </DialogHeader>
            {selectedRecord && (
              <form onSubmit={(e) => {
                e.preventDefault();
                createAppointmentMutation.mutate();
              }} className="space-y-4">
                <div className="p-3 bg-muted rounded-lg mb-4">
                  <p className="text-sm font-medium">
                    {selectedRecord.customers.first_name} {selectedRecord.customers.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedRecord.customers.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="appointment_date">Appointment Date *</Label>
                    <Input
                      id="appointment_date"
                      type="date"
                      value={appointmentData.appointment_date}
                      onChange={(e) => setAppointmentData(prev => ({ ...prev, appointment_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="appointment_time">Appointment Time *</Label>
                    <Input
                      id="appointment_time"
                      type="time"
                      value={appointmentData.appointment_time}
                      onChange={(e) => setAppointmentData(prev => ({ ...prev, appointment_time: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <ServiceSelect
                  value={appointmentData.service_type}
                  onChange={(value) => setAppointmentData(prev => ({ ...prev, service_type: value }))}
                />

                <div>
                  <Label htmlFor="notes">Appointment Notes</Label>
                  <Textarea
                    id="notes"
                    value={appointmentData.notes}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes for this appointment..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setAppointmentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createAppointmentMutation.isPending}>
                    {createAppointmentMutation.isPending ? 'Creating...' : 'Create Appointment'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
};

export default FollowUps;
