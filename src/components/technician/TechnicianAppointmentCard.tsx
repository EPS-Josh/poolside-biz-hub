import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Phone, 
  MessageSquare, 
  Navigation, 
  Clock, 
  CheckCircle2,
  XCircle,
  PlayCircle,
  ClipboardList,
  Car,
  Key,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { TechnicianAppointment } from '@/hooks/useTechnicianAppointments';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TechnicianAppointmentCardProps {
  appointment: TechnicianAppointment;
  onNavigate: (appointment: TechnicianAppointment) => void;
  onCall: (phone: string) => void;
  onText: (phone: string) => void;
  onCreateServiceRecord: (appointment: TechnicianAppointment) => void;
  onStatusChange: (appointmentId: string, newStatus: string) => void;
  isUpdatingStatus?: boolean;
}

const statusOptions = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  scheduled: { label: 'Scheduled', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  confirmed: { label: 'Confirmed', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
  'in-progress': { label: 'In Progress', variant: 'default', icon: <PlayCircle className="h-3 w-3" /> },
  completed: { label: 'Completed', variant: 'outline', icon: <CheckCircle2 className="h-3 w-3" /> },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
};

export const TechnicianAppointmentCard: React.FC<TechnicianAppointmentCardProps> = ({
  appointment,
  onNavigate,
  onCall,
  onText,
  onCreateServiceRecord,
  onStatusChange,
  isUpdatingStatus
}) => {
  const { toast } = useToast();
  const customer = appointment.customers;
  const status = statusConfig[appointment.status] || statusConfig.scheduled;
  const [accessInfoOpen, setAccessInfoOpen] = useState(false);
  const [isSendingEnRoute, setIsSendingEnRoute] = useState(false);
  
  // Get service details (one-to-one relation)
  const serviceDetails = customer.customer_service_details;
  const hasAccessInfo = serviceDetails?.gate_code || serviceDetails?.access_instructions || serviceDetails?.special_notes;
  
  const formatTime = (timeString: string) => {
    try {
      return format(new Date(`2000-01-01T${timeString}`), 'h:mm a');
    } catch {
      return timeString;
    }
  };

  const fullAddress = `${customer.address}, ${customer.city}, ${customer.state} ${customer.zip_code}`;
  
  const handleEnRouteNotification = async () => {
    if (!customer.phone) {
      toast({
        title: 'No Phone Number',
        description: 'Customer does not have a phone number on file.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!customer.sms_opt_in) {
      toast({
        title: 'SMS Not Enabled',
        description: 'Customer has not opted in to receive SMS messages.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSendingEnRoute(true);
    
    try {
      const { error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: customer.phone,
          message: `Hi ${customer.first_name}, your pool technician is on the way! Expected arrival shortly.`,
          customerId: customer.id,
        },
      });
      
      if (error) throw error;
      
      toast({
        title: 'En Route Notification Sent',
        description: `SMS sent to ${customer.first_name}`,
      });
    } catch (error) {
      console.error('Error sending en route SMS:', error);
      toast({
        title: 'Failed to Send',
        description: 'Could not send the en route notification.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingEnRoute(false);
    }
  };

  return (
    <Card className="border-l-4 border-l-primary shadow-md">
      <CardContent className="p-4 space-y-3">
        {/* Header: Customer name and time */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">
              {customer.first_name} {customer.last_name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{formatTime(appointment.appointment_time)}</span>
            </div>
          </div>
          {/* Status Selector */}
          <Select 
            value={appointment.status} 
            onValueChange={(value) => onStatusChange(appointment.id, value)}
            disabled={isUpdatingStatus}
          >
            <SelectTrigger className="w-[130px] h-8">
              {isUpdatingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SelectValue />
              )}
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {statusConfig[option.value]?.icon}
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Service type */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-xs">
            {appointment.service_type}
          </Badge>
        </div>

        {/* Address */}
        <button 
          onClick={() => onNavigate(appointment)}
          className="flex items-start gap-2 text-sm text-left w-full p-2 -m-2 rounded-md hover:bg-muted/50 transition-colors"
        >
          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <span className="text-muted-foreground line-clamp-2">{fullAddress}</span>
        </button>

        {/* Notes */}
        {appointment.notes && (
          <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md line-clamp-2">
            {appointment.notes}
          </p>
        )}

        {/* Quick Actions - Row 1 */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => onNavigate(appointment)}
          >
            <Navigation className="h-4 w-4" />
            <span className="text-[10px]">Navigate</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => customer.phone && onCall(customer.phone)}
            disabled={!customer.phone}
          >
            <Phone className="h-4 w-4" />
            <span className="text-[10px]">Call</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => customer.phone && onText(customer.phone)}
            disabled={!customer.phone}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-[10px]">Text</span>
          </Button>
          
          <Button
            variant="default"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => onCreateServiceRecord(appointment)}
          >
            <ClipboardList className="h-4 w-4" />
            <span className="text-[10px]">Record</span>
          </Button>
        </div>

        {/* Quick Actions - Row 2 */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-2 h-10"
            onClick={handleEnRouteNotification}
            disabled={isSendingEnRoute || !customer.phone || !customer.sms_opt_in}
          >
            {isSendingEnRoute ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Car className="h-4 w-4" />
            )}
            <span className="text-xs">En Route</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-2 h-10"
            onClick={() => setAccessInfoOpen(true)}
            disabled={!hasAccessInfo}
          >
            <Key className="h-4 w-4" />
            <span className="text-xs">Access Info</span>
          </Button>
        </div>
      </CardContent>
      
      {/* Access Info Dialog */}
      <Dialog open={accessInfoOpen} onOpenChange={setAccessInfoOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Access Information
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {serviceDetails?.gate_code && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Gate Code</p>
                <p className="text-2xl font-bold font-mono tracking-wider">{serviceDetails.gate_code}</p>
              </div>
            )}
            {serviceDetails?.access_instructions && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Access Instructions</p>
                <p className="text-sm">{serviceDetails.access_instructions}</p>
              </div>
            )}
            {serviceDetails?.special_notes && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Special Notes</p>
                <p className="text-sm">{serviceDetails.special_notes}</p>
              </div>
            )}
            {!hasAccessInfo && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No access information available for this customer.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
