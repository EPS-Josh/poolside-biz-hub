import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  ChevronLeft, 
  RefreshCw, 
  MapPin,
  List,
  Navigation,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useTechnicianAppointments, TechnicianAppointment } from '@/hooks/useTechnicianAppointments';
import { TechnicianAppointmentCard } from '@/components/technician/TechnicianAppointmentCard';
import { QuickServiceRecordSheet } from '@/components/technician/QuickServiceRecordSheet';
import { OfflineSyncBanner } from '@/components/technician/OfflineSyncBanner';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';

const TechnicianDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showTomorrow, setShowTomorrow] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<TechnicianAppointment | null>(null);
  const [serviceRecordOpen, setServiceRecordOpen] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const {
    data: appointments = [],
    isLoading,
    isError,
    refresh,
    isOffline,
    lastCachedAt,
    targetDate
  } = useTechnicianAppointments(showTomorrow);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }, [refresh]);

  // Navigation to address using native maps
  const handleNavigate = (appointment: TechnicianAppointment) => {
    const customer = appointment.customers;
    const address = encodeURIComponent(
      `${customer.address}, ${customer.city}, ${customer.state} ${customer.zip_code}`
    );
    
    // Detect platform and open appropriate maps app
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let mapsUrl: string;
    if (isIOS) {
      mapsUrl = `maps://maps.apple.com/?daddr=${address}`;
    } else if (isAndroid) {
      mapsUrl = `geo:0,0?q=${address}`;
    } else {
      mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${address}`;
    }
    
    window.open(mapsUrl, '_blank');
  };

  // Navigate to all stops (route overview)
  const handleNavigateToRoute = () => {
    if (appointments.length === 0) return;
    
    // Build waypoints for full route
    const addresses = appointments
      .map(apt => {
        const c = apt.customers;
        return encodeURIComponent(`${c.address}, ${c.city}, ${c.state} ${c.zip_code}`);
      });
    
    if (addresses.length === 1) {
      handleNavigate(appointments[0]);
      return;
    }
    
    // Google Maps route with multiple waypoints
    const destination = addresses[addresses.length - 1];
    const waypoints = addresses.slice(0, -1).join('|');
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&waypoints=${waypoints}`;
    
    window.open(mapsUrl, '_blank');
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleText = (phone: string) => {
    window.location.href = `sms:${phone}`;
  };

  const handleCreateServiceRecord = (appointment: TechnicianAppointment) => {
    setSelectedAppointment(appointment);
    setServiceRecordOpen(true);
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    setUpdatingStatusId(appointmentId);
    
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `Appointment marked as ${newStatus.replace('_', ' ')}`,
      });

      refresh();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const totalCount = appointments.length;

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/menu')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">
                {showTomorrow ? 'Tomorrow' : 'Today'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {format(targetDate, 'EEEE, MMM d')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant={showTomorrow ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowTomorrow(!showTomorrow)}
              className="gap-1.5"
            >
              <Calendar className="h-4 w-4" />
              {showTomorrow ? 'Today' : 'Tomorrow'}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{completedCount}/{totalCount} completed</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <OfflineSyncBanner />
        
        {/* Route Overview Button */}
        {appointments.length > 1 && (
          <Button
            variant="outline"
            className="w-full gap-2 h-12"
            onClick={handleNavigateToRoute}
          >
            <Navigation className="h-5 w-5" />
            Navigate Full Route ({appointments.length} stops)
          </Button>
        )}

        {/* Loading State */}
        {isLoading && !appointments.length && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Failed to load appointments</p>
            <Button onClick={handleRefresh} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && appointments.length === 0 && (
          <div className="text-center py-12">
            <List className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-1">No Appointments</h3>
            <p className="text-muted-foreground text-sm">
              {showTomorrow 
                ? "No appointments scheduled for tomorrow"
                : "No appointments scheduled for today"
              }
            </p>
          </div>
        )}

        {/* Appointment List */}
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <TechnicianAppointmentCard
              key={appointment.id}
              appointment={appointment}
              onNavigate={handleNavigate}
              onCall={handleCall}
              onText={handleText}
              onCreateServiceRecord={handleCreateServiceRecord}
              onStatusChange={handleStatusChange}
              isUpdatingStatus={updatingStatusId === appointment.id}
            />
          ))}
        </div>

        {/* Offline cache info */}
        {isOffline && lastCachedAt && (
          <p className="text-xs text-muted-foreground text-center">
            Last updated: {format(new Date(lastCachedAt), 'h:mm a')}
          </p>
        )}
      </div>

      {/* Quick Service Record Sheet */}
      <QuickServiceRecordSheet
        open={serviceRecordOpen}
        onOpenChange={setServiceRecordOpen}
        appointment={selectedAppointment}
        onSuccess={() => {
          refresh();
        }}
      />
    </div>
  );
};

export default TechnicianDashboard;
