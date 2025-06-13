import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ServiceRecordForm } from '@/components/ServiceRecordForm';
import { EditServiceRecordForm } from '@/components/EditServiceRecordForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, User, Wrench, Beaker, FileText, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
}

interface ServiceHistoryProps {
  customerId: string;
}

export const ServiceHistory = ({ customerId }: ServiceHistoryProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null);

  const fetchServiceRecords = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('service_records')
        .select('*')
        .eq('customer_id', customerId)
        .order('service_date', { ascending: false });

      if (error) throw error;

      setServiceRecords(data || []);
    } catch (error) {
      console.error('Error fetching service records:', error);
      toast({
        title: 'Error',
        description: 'Failed to load service history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceRecords();
  }, [user, customerId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleExpanded = (recordId: string) => {
    setExpandedRecords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleEditSuccess = () => {
    setEditingRecord(null);
    fetchServiceRecords();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div>Loading service history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Service History</CardTitle>
          <ServiceRecordForm customerId={customerId} onSuccess={fetchServiceRecords} />
        </CardHeader>
        <CardContent>
          {serviceRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No service records found</p>
              <ServiceRecordForm customerId={customerId} onSuccess={fetchServiceRecords} />
            </div>
          ) : (
            <div className="space-y-4">
              {serviceRecords.map((record) => (
                <Card key={record.id} className="border-l-4 border-l-blue-500">
                  <Collapsible>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{formatDate(record.service_date)}</span>
                              {record.service_time && (
                                <>
                                  <Clock className="h-4 w-4 text-gray-500 ml-2" />
                                  <span className="text-sm text-gray-600">{formatTime(record.service_time)}</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(record.service_status)}>
                                {record.service_status.replace('-', ' ')}
                              </Badge>
                              <span className="text-sm font-medium">{record.service_type.replace('-', ' ')}</span>
                              {record.technician_name && (
                                <span className="text-sm text-gray-600 flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  {record.technician_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingRecord(record)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(record.id)}
                            >
                              {expandedRecords.has(record.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {record.work_performed && (
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Wrench className="h-4 w-4 text-gray-500" />
                                <h4 className="font-medium">Work Performed</h4>
                              </div>
                              <p className="text-sm text-gray-700">{record.work_performed}</p>
                            </div>
                          )}

                          {record.chemicals_added && (
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Beaker className="h-4 w-4 text-gray-500" />
                                <h4 className="font-medium">Chemicals Added</h4>
                              </div>
                              <p className="text-sm text-gray-700">{record.chemicals_added}</p>
                            </div>
                          )}

                          {record.equipment_serviced && (
                            <div>
                              <h4 className="font-medium mb-2">Equipment Serviced</h4>
                              <p className="text-sm text-gray-700">{record.equipment_serviced}</p>
                            </div>
                          )}

                          {(record.before_readings || record.after_readings) && (
                            <div>
                              <h4 className="font-medium mb-2">Chemical Readings</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {record.before_readings && (
                                  <div>
                                    <h5 className="font-medium text-gray-600 mb-1">Before</h5>
                                    <div className="space-y-1">
                                      {record.before_readings.ph && <div>pH: {record.before_readings.ph}</div>}
                                      {record.before_readings.chlorine && <div>Chlorine: {record.before_readings.chlorine}</div>}
                                      {record.before_readings.alkalinity && <div>Alkalinity: {record.before_readings.alkalinity}</div>}
                                    </div>
                                  </div>
                                )}
                                {record.after_readings && (
                                  <div>
                                    <h5 className="font-medium text-gray-600 mb-1">After</h5>
                                    <div className="space-y-1">
                                      {record.after_readings.ph && <div>pH: {record.after_readings.ph}</div>}
                                      {record.after_readings.chlorine && <div>Chlorine: {record.after_readings.chlorine}</div>}
                                      {record.after_readings.alkalinity && <div>Alkalinity: {record.after_readings.alkalinity}</div>}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {(record.customer_notes || record.technician_notes) && (
                            <div className="md:col-span-2">
                              <div className="flex items-center space-x-2 mb-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <h4 className="font-medium">Notes</h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {record.customer_notes && (
                                  <div>
                                    <h5 className="font-medium text-gray-600 mb-1">Customer Notes</h5>
                                    <p className="text-sm text-gray-700">{record.customer_notes}</p>
                                  </div>
                                )}
                                {record.technician_notes && (
                                  <div>
                                    <h5 className="font-medium text-gray-600 mb-1">Technician Notes</h5>
                                    <p className="text-sm text-gray-700">{record.technician_notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="md:col-span-2 flex justify-between items-center text-sm text-gray-500 border-t pt-3">
                            <div className="flex space-x-4">
                              {record.total_time_minutes && (
                                <span>Duration: {record.total_time_minutes} minutes</span>
                              )}
                              {record.next_service_date && (
                                <span>Next Service: {formatDate(record.next_service_date)}</span>
                              )}
                            </div>
                            <span>Added: {formatDate(record.created_at)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editingRecord && (
        <EditServiceRecordForm
          record={editingRecord}
          open={!!editingRecord}
          onOpenChange={(open) => !open && setEditingRecord(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};
