import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, Wrench, Beaker, FileText, Activity } from 'lucide-react';
import { toPhoenixTime } from '@/utils/phoenixTimeUtils';

interface ServiceRecord {
  id: string;
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
  service_status: string;
  created_at: string;
  parts_used?: any[];
}

interface ServiceRecordViewerProps {
  record: ServiceRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ServiceRecordViewer = ({ record, open, onOpenChange }: ServiceRecordViewerProps) => {
  if (!record) return null;

  const formatDate = (dateString: string) => {
    const phoenixDate = new Date(dateString + 'T12:00:00');
    return toPhoenixTime(phoenixDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (timestampString: string) => {
    const date = new Date(timestampString);
    return toPhoenixTime(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Service Report</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="text-xl font-semibold">{formatDate(record.service_date)}</span>
                    {record.service_time && (
                      <>
                        <Clock className="h-5 w-5 text-primary ml-4" />
                        <span className="text-lg">{formatTime(record.service_time)}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(record.service_status)}>
                      {record.service_status.replace('-', ' ')}
                    </Badge>
                    <span className="text-lg font-medium">{record.service_type.replace('-', ' ')}</span>
                  </div>
                </div>
                {record.technician_name && (
                  <div className="text-right">
                    <div className="flex items-center text-muted-foreground mb-1">
                      <User className="h-4 w-4 mr-2" />
                      <span className="text-sm">Technician</span>
                    </div>
                    <span className="text-lg font-medium">{record.technician_name}</span>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Work Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {record.work_performed && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Wrench className="h-5 w-5 text-primary" />
                    <span>Work Performed</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{record.work_performed}</p>
                </CardContent>
              </Card>
            )}

            {record.chemicals_added && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Beaker className="h-5 w-5 text-primary" />
                    <span>Chemicals Added</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{record.chemicals_added}</p>
                </CardContent>
              </Card>
            )}

            {record.equipment_serviced && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Activity className="h-5 w-5 text-primary" />
                    <span>Equipment Serviced</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{record.equipment_serviced}</p>
                </CardContent>
              </Card>
            )}

            {/* Chemical Readings */}
            {(record.before_readings || record.after_readings) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Activity className="h-5 w-5 text-primary" />
                    <span>Chemical Readings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {record.before_readings && (
                      <div className="space-y-2">
                        <h5 className="font-semibold text-muted-foreground">Before Service</h5>
                        <div className="space-y-1">
                          {record.before_readings.ph && (
                            <div className="flex justify-between">
                              <span>pH:</span>
                              <span className="font-medium">{record.before_readings.ph}</span>
                            </div>
                          )}
                          {record.before_readings.chlorine && (
                            <div className="flex justify-between">
                              <span>Chlorine:</span>
                              <span className="font-medium">{record.before_readings.chlorine}</span>
                            </div>
                          )}
                          {record.before_readings.alkalinity && (
                            <div className="flex justify-between">
                              <span>Alkalinity:</span>
                              <span className="font-medium">{record.before_readings.alkalinity}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {record.after_readings && (
                      <div className="space-y-2">
                        <h5 className="font-semibold text-muted-foreground">After Service</h5>
                        <div className="space-y-1">
                          {record.after_readings.ph && (
                            <div className="flex justify-between">
                              <span>pH:</span>
                              <span className="font-medium">{record.after_readings.ph}</span>
                            </div>
                          )}
                          {record.after_readings.chlorine && (
                            <div className="flex justify-between">
                              <span>Chlorine:</span>
                              <span className="font-medium">{record.after_readings.chlorine}</span>
                            </div>
                          )}
                          {record.after_readings.alkalinity && (
                            <div className="flex justify-between">
                              <span>Alkalinity:</span>
                              <span className="font-medium">{record.after_readings.alkalinity}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Notes Section */}
          {(record.customer_notes || record.technician_notes) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>Notes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {record.customer_notes && (
                    <div>
                      <h5 className="font-semibold text-muted-foreground mb-2">Customer Notes</h5>
                      <p className="text-gray-700 leading-relaxed">{record.customer_notes}</p>
                    </div>
                  )}
                  {record.technician_notes && (
                    <div>
                      <h5 className="font-semibold text-muted-foreground mb-2">Technician Notes</h5>
                      <p className="text-gray-700 leading-relaxed">{record.technician_notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Footer */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div className="flex space-x-6">
                  {record.total_time_minutes && (
                    <span>Service Duration: <span className="font-medium">{record.total_time_minutes} minutes</span></span>
                  )}
                  {record.next_service_date && (
                    <span>Next Service: <span className="font-medium">{formatDate(record.next_service_date)}</span></span>
                  )}
                </div>
                <span>Report Generated: <span className="font-medium">{formatDateTime(record.created_at)}</span></span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};