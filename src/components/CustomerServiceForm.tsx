
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Waves, Droplets, Settings, Shield } from 'lucide-react';

interface CustomerServiceDetails {
  id?: string;
  pool_type?: string;
  pool_size?: string;
  pool_equipment?: string;
  spa_type?: string;
  spa_equipment?: string;
  water_features?: string;
  gate_code?: string;
  access_instructions?: string;
  chemical_preferences?: string;
  service_frequency?: string;
  special_notes?: string;
}

interface CustomerServiceFormProps {
  customerId: string;
}

export const CustomerServiceForm = ({ customerId }: CustomerServiceFormProps) => {
  const [details, setDetails] = useState<CustomerServiceDetails>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchServiceDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_service_details')
        .select('*')
        .eq('customer_id', customerId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setDetails(data);
      }
    } catch (error) {
      console.error('Error fetching service details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load service details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceDetails();
  }, [customerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const serviceData = {
        customer_id: customerId,
        ...details,
        updated_at: new Date().toISOString(),
      };

      if (details.id) {
        const { error } = await supabase
          .from('customer_service_details')
          .update(serviceData)
          .eq('id', details.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customer_service_details')
          .insert(serviceData);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Service details saved successfully',
      });

      // Refresh the data
      fetchServiceDetails();
    } catch (error) {
      console.error('Error saving service details:', error);
      toast({
        title: 'Error',
        description: 'Failed to save service details',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof CustomerServiceDetails, value: string) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="flex items-center justify-center py-8">
          <div>Loading service details...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Service Details</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pool Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <Waves className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium">Pool Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pool_type">Pool Type</Label>
                <Input
                  id="pool_type"
                  value={details.pool_type || ''}
                  onChange={(e) => updateField('pool_type', e.target.value)}
                  placeholder="e.g., Chlorine, Saltwater, Natural"
                />
              </div>
              <div>
                <Label htmlFor="pool_size">Pool Size</Label>
                <Input
                  id="pool_size"
                  value={details.pool_size || ''}
                  onChange={(e) => updateField('pool_size', e.target.value)}
                  placeholder="e.g., 20x40 ft, 15,000 gallons"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="pool_equipment">Pool Equipment</Label>
              <Textarea
                id="pool_equipment"
                value={details.pool_equipment || ''}
                onChange={(e) => updateField('pool_equipment', e.target.value)}
                placeholder="List pumps, filters, heaters, automation systems, etc."
                rows={3}
              />
            </div>
          </div>

          {/* Spa Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <Droplets className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-medium">Spa Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="spa_type">Spa Type</Label>
                <Input
                  id="spa_type"
                  value={details.spa_type || ''}
                  onChange={(e) => updateField('spa_type', e.target.value)}
                  placeholder="e.g., Attached, Standalone, Hot Tub"
                />
              </div>
              <div>
                <Label htmlFor="spa_equipment">Spa Equipment</Label>
                <Input
                  id="spa_equipment"
                  value={details.spa_equipment || ''}
                  onChange={(e) => updateField('spa_equipment', e.target.value)}
                  placeholder="Heater, jets, controls, etc."
                />
              </div>
            </div>
          </div>

          {/* Water Features */}
          <div>
            <Label htmlFor="water_features">Water Features</Label>
            <Textarea
              id="water_features"
              value={details.water_features || ''}
              onChange={(e) => updateField('water_features', e.target.value)}
              placeholder="Waterfalls, fountains, lighting, etc."
              rows={2}
            />
          </div>

          {/* Access Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-medium">Access Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gate_code">Gate Code</Label>
                <Input
                  id="gate_code"
                  value={details.gate_code || ''}
                  onChange={(e) => updateField('gate_code', e.target.value)}
                  placeholder="Gate access code"
                />
              </div>
              <div>
                <Label htmlFor="service_frequency">Service Frequency</Label>
                <Input
                  id="service_frequency"
                  value={details.service_frequency || ''}
                  onChange={(e) => updateField('service_frequency', e.target.value)}
                  placeholder="e.g., Weekly, Bi-weekly, Monthly"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="access_instructions">Access Instructions</Label>
              <Textarea
                id="access_instructions"
                value={details.access_instructions || ''}
                onChange={(e) => updateField('access_instructions', e.target.value)}
                placeholder="Special instructions for accessing the property"
                rows={3}
              />
            </div>
          </div>

          {/* Chemical Preferences */}
          <div>
            <Label htmlFor="chemical_preferences">Chemical Preferences</Label>
            <Textarea
              id="chemical_preferences"
              value={details.chemical_preferences || ''}
              onChange={(e) => updateField('chemical_preferences', e.target.value)}
              placeholder="Preferred chemicals, brands, or any restrictions"
              rows={2}
            />
          </div>

          {/* Special Notes */}
          <div>
            <Label htmlFor="special_notes">Special Notes</Label>
            <Textarea
              id="special_notes"
              value={details.special_notes || ''}
              onChange={(e) => updateField('special_notes', e.target.value)}
              placeholder="Any additional notes for service technicians"
              rows={3}
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Service Details'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
