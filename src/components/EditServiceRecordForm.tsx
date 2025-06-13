
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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

interface EditServiceRecordFormProps {
  record: ServiceRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditServiceRecordForm = ({ record, open, onOpenChange, onSuccess }: EditServiceRecordFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    service_date: '',
    service_time: '',
    service_type: '',
    technician_name: '',
    work_performed: '',
    chemicals_added: '',
    equipment_serviced: '',
    customer_notes: '',
    technician_notes: '',
    next_service_date: '',
    total_time_minutes: '',
    service_status: 'completed',
    before_readings: {
      ph: '',
      chlorine: '',
      alkalinity: '',
      cyanuric_acid: '',
      calcium_hardness: ''
    },
    after_readings: {
      ph: '',
      chlorine: '',
      alkalinity: '',
      cyanuric_acid: '',
      calcium_hardness: ''
    }
  });

  useEffect(() => {
    if (record && open) {
      setFormData({
        service_date: record.service_date,
        service_time: record.service_time || '',
        service_type: record.service_type,
        technician_name: record.technician_name || '',
        work_performed: record.work_performed || '',
        chemicals_added: record.chemicals_added || '',
        equipment_serviced: record.equipment_serviced || '',
        customer_notes: record.customer_notes || '',
        technician_notes: record.technician_notes || '',
        next_service_date: record.next_service_date || '',
        total_time_minutes: record.total_time_minutes?.toString() || '',
        service_status: record.service_status,
        before_readings: {
          ph: record.before_readings?.ph || '',
          chlorine: record.before_readings?.chlorine || '',
          alkalinity: record.before_readings?.alkalinity || '',
          cyanuric_acid: record.before_readings?.cyanuric_acid || '',
          calcium_hardness: record.before_readings?.calcium_hardness || ''
        },
        after_readings: {
          ph: record.after_readings?.ph || '',
          chlorine: record.after_readings?.chlorine || '',
          alkalinity: record.after_readings?.alkalinity || '',
          cyanuric_acid: record.after_readings?.cyanuric_acid || '',
          calcium_hardness: record.after_readings?.calcium_hardness || ''
        }
      });
    }
  }, [record, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('service_records')
        .update({
          service_date: formData.service_date,
          service_time: formData.service_time || null,
          service_type: formData.service_type,
          technician_name: formData.technician_name || null,
          work_performed: formData.work_performed || null,
          chemicals_added: formData.chemicals_added || null,
          equipment_serviced: formData.equipment_serviced || null,
          customer_notes: formData.customer_notes || null,
          technician_notes: formData.technician_notes || null,
          next_service_date: formData.next_service_date || null,
          total_time_minutes: formData.total_time_minutes ? parseInt(formData.total_time_minutes) : null,
          service_status: formData.service_status,
          before_readings: formData.before_readings,
          after_readings: formData.after_readings
        })
        .eq('id', record.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Service record updated successfully',
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating service record:', error);
      toast({
        title: 'Error',
        description: 'Failed to update service record',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateReadings = (type: 'before_readings' | 'after_readings', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Service Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="service_date">Service Date *</Label>
              <Input
                id="service_date"
                type="date"
                value={formData.service_date}
                onChange={(e) => updateFormData('service_date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="service_time">Service Time</Label>
              <Input
                id="service_time"
                type="time"
                value={formData.service_time}
                onChange={(e) => updateFormData('service_time', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="service_type">Service Type *</Label>
              <Select value={formData.service_type} onValueChange={(value) => updateFormData('service_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular-maintenance">Regular Maintenance</SelectItem>
                  <SelectItem value="chemical-balance">Chemical Balance</SelectItem>
                  <SelectItem value="equipment-repair">Equipment Repair</SelectItem>
                  <SelectItem value="cleaning">Pool Cleaning</SelectItem>
                  <SelectItem value="filter-maintenance">Filter Maintenance</SelectItem>
                  <SelectItem value="equipment-installation">Equipment Installation</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="emergency-service">Emergency Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="technician_name">Technician Name</Label>
              <Input
                id="technician_name"
                value={formData.technician_name}
                onChange={(e) => updateFormData('technician_name', e.target.value)}
                placeholder="Enter technician name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="work_performed">Work Performed</Label>
            <Textarea
              id="work_performed"
              value={formData.work_performed}
              onChange={(e) => updateFormData('work_performed', e.target.value)}
              placeholder="Describe the work performed during this service..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="chemicals_added">Chemicals Added</Label>
              <Textarea
                id="chemicals_added"
                value={formData.chemicals_added}
                onChange={(e) => updateFormData('chemicals_added', e.target.value)}
                placeholder="List chemicals added and quantities..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="equipment_serviced">Equipment Serviced</Label>
              <Textarea
                id="equipment_serviced"
                value={formData.equipment_serviced}
                onChange={(e) => updateFormData('equipment_serviced', e.target.value)}
                placeholder="List equipment serviced or repaired..."
                rows={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Before Readings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="before_ph">pH</Label>
                    <Input
                      id="before_ph"
                      value={formData.before_readings.ph}
                      onChange={(e) => updateReadings('before_readings', 'ph', e.target.value)}
                      placeholder="7.2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="before_chlorine">Chlorine</Label>
                    <Input
                      id="before_chlorine"
                      value={formData.before_readings.chlorine}
                      onChange={(e) => updateReadings('before_readings', 'chlorine', e.target.value)}
                      placeholder="1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="before_alkalinity">Alkalinity</Label>
                    <Input
                      id="before_alkalinity"
                      value={formData.before_readings.alkalinity}
                      onChange={(e) => updateReadings('before_readings', 'alkalinity', e.target.value)}
                      placeholder="120"
                    />
                  </div>
                  <div>
                    <Label htmlFor="before_cyanuric">Cyanuric Acid</Label>
                    <Input
                      id="before_cyanuric"
                      value={formData.before_readings.cyanuric_acid}
                      onChange={(e) => updateReadings('before_readings', 'cyanuric_acid', e.target.value)}
                      placeholder="30"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">After Readings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="after_ph">pH</Label>
                    <Input
                      id="after_ph"
                      value={formData.after_readings.ph}
                      onChange={(e) => updateReadings('after_readings', 'ph', e.target.value)}
                      placeholder="7.4"
                    />
                  </div>
                  <div>
                    <Label htmlFor="after_chlorine">Chlorine</Label>
                    <Input
                      id="after_chlorine"
                      value={formData.after_readings.chlorine}
                      onChange={(e) => updateReadings('after_readings', 'chlorine', e.target.value)}
                      placeholder="2.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="after_alkalinity">Alkalinity</Label>
                    <Input
                      id="after_alkalinity"
                      value={formData.after_readings.alkalinity}
                      onChange={(e) => updateReadings('after_readings', 'alkalinity', e.target.value)}
                      placeholder="125"
                    />
                  </div>
                  <div>
                    <Label htmlFor="after_cyanuric">Cyanuric Acid</Label>
                    <Input
                      id="after_cyanuric"
                      value={formData.after_readings.cyanuric_acid}
                      onChange={(e) => updateReadings('after_readings', 'cyanuric_acid', e.target.value)}
                      placeholder="35"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_notes">Customer Notes</Label>
              <Textarea
                id="customer_notes"
                value={formData.customer_notes}
                onChange={(e) => updateFormData('customer_notes', e.target.value)}
                placeholder="Any notes from the customer..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="technician_notes">Technician Notes</Label>
              <Textarea
                id="technician_notes"
                value={formData.technician_notes}
                onChange={(e) => updateFormData('technician_notes', e.target.value)}
                placeholder="Internal technician notes..."
                rows={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="next_service_date">Next Service Date</Label>
              <Input
                id="next_service_date"
                type="date"
                value={formData.next_service_date}
                onChange={(e) => updateFormData('next_service_date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="total_time_minutes">Total Time (minutes)</Label>
              <Input
                id="total_time_minutes"
                type="number"
                value={formData.total_time_minutes}
                onChange={(e) => updateFormData('total_time_minutes', e.target.value)}
                placeholder="60"
              />
            </div>
            <div>
              <Label htmlFor="service_status">Service Status</Label>
              <Select value={formData.service_status} onValueChange={(value) => updateFormData('service_status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Service Record'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
