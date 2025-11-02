import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { getCurrentPhoenixDate, formatPhoenixDateForDatabase } from '@/utils/phoenixTimeUtils';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  status: string;
  notes?: string;
  customers: {
    first_name: string;
    last_name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
  };
}

const HADashboard = () => {
  const [showTomorrow, setShowTomorrow] = useState(false);
  const phoenixToday = getCurrentPhoenixDate();
  const phoenixTomorrow = addDays(phoenixToday, 1);
  const today = formatPhoenixDateForDatabase(phoenixToday);
  const tomorrow = formatPhoenixDateForDatabase(phoenixTomorrow);
  const displayDate = showTomorrow ? tomorrow : today;
  const displayDateObj = showTomorrow ? phoenixTomorrow : phoenixToday;

  const { data, isLoading } = useQuery({
    queryKey: ['ha-appointments', displayDate],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ha-appointments', {
        body: { date: displayDate }
      });
      
      if (error) throw error;
      return data;
    }
  });

  const appointments: Appointment[] = data?.appointments || [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Service Appointments</h1>
          <Button 
            variant={showTomorrow ? "default" : "outline"}
            onClick={() => setShowTomorrow(!showTomorrow)}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            {showTomorrow ? 'Show Today' : 'Show Tomorrow'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {showTomorrow ? 'Tomorrow' : 'Today'}'s Schedule
            </CardTitle>
            <CardDescription>
              {format(displayDateObj, 'EEEE, MMMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading appointments...
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No appointments scheduled
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <Card key={apt.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            <span className="font-semibold text-lg">
                              {apt.customers.first_name} {apt.customers.last_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(`2000-01-01T${apt.appointment_time}`), 'h:mm a')}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span>
                            {apt.customers.address}, {apt.customers.city}, {apt.customers.state} {apt.customers.zip_code}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            {apt.service_type}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                            apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                            apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                            apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {apt.status}
                          </span>
                        </div>

                        {apt.notes && (
                          <p className="text-sm text-muted-foreground border-t pt-3">
                            {apt.notes}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HADashboard;
