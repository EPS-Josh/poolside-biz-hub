import React from 'react';
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
  ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { TechnicianAppointment } from '@/hooks/useTechnicianAppointments';

interface TechnicianAppointmentCardProps {
  appointment: TechnicianAppointment;
  onNavigate: (appointment: TechnicianAppointment) => void;
  onCall: (phone: string) => void;
  onText: (phone: string) => void;
  onCreateServiceRecord: (appointment: TechnicianAppointment) => void;
  onStatusChange: (appointmentId: string, newStatus: string) => void;
  isUpdatingStatus?: boolean;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  scheduled: { label: 'Scheduled', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: 'In Progress', variant: 'default', icon: <PlayCircle className="h-3 w-3" /> },
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
  const customer = appointment.customers;
  const status = statusConfig[appointment.status] || statusConfig.scheduled;
  
  const formatTime = (timeString: string) => {
    try {
      return format(new Date(`2000-01-01T${timeString}`), 'h:mm a');
    } catch {
      return timeString;
    }
  };

  const fullAddress = `${customer.address}, ${customer.city}, ${customer.state} ${customer.zip_code}`;

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
          <Badge variant={status.variant} className="flex items-center gap-1 flex-shrink-0">
            {status.icon}
            {status.label}
          </Badge>
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

        {/* Quick Actions */}
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

        {/* Status change buttons */}
        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
          <div className="flex gap-2 pt-1">
            {appointment.status === 'scheduled' && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onStatusChange(appointment.id, 'in_progress')}
                disabled={isUpdatingStatus}
              >
                <PlayCircle className="h-4 w-4 mr-1.5" />
                Start
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => onStatusChange(appointment.id, 'completed')}
              disabled={isUpdatingStatus}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Complete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
