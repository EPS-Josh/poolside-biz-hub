import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Trash2, 
  Edit, 
  MapPin,
  Clock,
  User,
  Navigation,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { DailyRoute } from '@/hooks/useDailyRoutes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Technician {
  id: string;
  email: string;
  full_name: string | null;
}

interface DailyRouteCardProps {
  route: DailyRoute;
  technicians: Technician[];
  onApprove: (routeId: string) => void;
  onDelete: (routeId: string) => void;
  onEdit: (route: DailyRoute) => void;
  isApproving: boolean;
  isDeleting: boolean;
}

export const DailyRouteCard: React.FC<DailyRouteCardProps> = ({
  route,
  technicians,
  onApprove,
  onDelete,
  onEdit,
  isApproving,
  isDeleting
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const technician = technicians.find(t => t.id === route.technician_user_id);
  const stopCount = route.stops?.length || 0;
  const completedStops = route.stops?.filter(s => s.status === 'completed').length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="destructive">Pending Approval</Badge>;
    }
  };

  const getStopStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'arrived':
      case 'en_route':
        return <Navigation className="h-4 w-4 text-blue-500" />;
      case 'skipped':
        return <div className="h-4 w-4 rounded-full bg-muted" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">
                {technician?.full_name || technician?.email || 'Unknown Technician'}
              </CardTitle>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {stopCount} stops
              </span>
              {route.total_estimated_duration_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  ~{Math.round(route.total_estimated_duration_minutes / 60)}h
                </span>
              )}
              {route.total_estimated_distance_miles && (
                <span className="flex items-center gap-1">
                  <Navigation className="h-3.5 w-3.5" />
                  ~{Math.round(route.total_estimated_distance_miles)} mi
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusBadge(route.status)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Progress bar */}
        {stopCount > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{completedStops}/{stopCount}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${(completedStops / stopCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Expandable stops list */}
        <Button
          variant="ghost"
          className="w-full justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>View Stops</span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {isExpanded && route.stops && (
          <div className="mt-4 space-y-2">
            {route.stops.map((stop, index) => (
              <div 
                key={stop.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div className="flex flex-col items-center">
                  <span className="text-xs font-medium text-muted-foreground mb-1">
                    {index + 1}
                  </span>
                  {getStopStatusIcon(stop.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    {stop.customer?.first_name} {stop.customer?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {stop.customer?.address}, {stop.customer?.city}
                  </p>
                  {stop.appointment && (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {stop.appointment.service_type}
                      </Badge>
                      {stop.estimated_arrival_time && (
                        <span className="text-xs text-muted-foreground">
                          {stop.estimated_arrival_time}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          {route.status === 'pending' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(route)}
                className="gap-1.5"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => onApprove(route.id)}
                disabled={isApproving}
                className="gap-1.5"
              >
                {isApproving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Approve
              </Button>
            </>
          )}
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Route?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this route and all its stops. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(route.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
