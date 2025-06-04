
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ValveDataScraper } from '@/components/ValveDataScraper';
import { ValveSelector } from '@/components/ValveSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Waves, Droplets, Settings, Shield, ChevronDown, ChevronRight, Beaker, FileText } from 'lucide-react';

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

interface PoolEquipment {
  pump?: string;
  filter?: string;
  heater?: string;
  valve_1_manufacturer?: string;
  valve_1_specific?: string;
  valve_2_manufacturer?: string;
  valve_2_specific?: string;
  valve_3_manufacturer?: string;
  valve_3_specific?: string;
  valve_4_manufacturer?: string;
  valve_4_specific?: string;
  time_clock?: boolean;
  controller?: boolean;
  water_valve?: boolean;
  // Time Clock details
  time_clock_on_hour?: string;
  time_clock_off_hour?: string;
  // Controller details
  controller_model?: string;
  controller_notes?: string;
  // Water Valve details
  water_valve_manufacturer?: string;
  water_valve_ports?: string;
  water_valve_return_port?: string;
  water_valve_bypass_port?: string;
}

interface CustomerServiceFormProps {
  customerId: string;
}

export const CustomerServiceForm = ({ customerId }: CustomerServiceFormProps) => {
  const [details, setDetails] = useState<CustomerServiceDetails>({});
  const [poolEquipment, setPoolEquipment] = useState<PoolEquipment>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Add state for valve options
  const [valveOptions, setValveOptions] = useState<string[]>([
    'Jandy Valve',
    'Pentair Valve',
    'Hayward Valve',
    'Manual Valve',
    'None'
  ]);

  // Add state for valve data
  const [valveData, setValveData] = useState<{ [manufacturer: string]: string[] }>({
    'Jandy': []
  });

  // Collapsible section states
  const [poolOpen, setPoolOpen] = useState(true);
  const [spaOpen, setSpaOpen] = useState(false);
  const [waterFeaturesOpen, setWaterFeaturesOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [chemicalOpen, setChemicalOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

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
        // Parse pool equipment JSON if it exists
        if (data.pool_equipment) {
          try {
            const parsed = JSON.parse(data.pool_equipment);
            setPoolEquipment(parsed);
          } catch {
            // If it's not JSON, treat as legacy text
            setPoolEquipment({});
          }
        }
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
        pool_equipment: JSON.stringify(poolEquipment),
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

  const updatePoolEquipment = (field: keyof PoolEquipment, value: string | boolean) => {
    setPoolEquipment(prev => ({ ...prev, [field]: value }));
  };

  const handleValveDataFetched = (newValveData: { [manufacturer: string]: string[] }) => {
    setValveData(prev => ({ ...prev, ...newValveData }));
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="flex items-center justify-center py-8">
          <div>Loading customer details...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Customer Details</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pool Information - Collapsible */}
          <Collapsible open={poolOpen} onOpenChange={setPoolOpen}>
            <CollapsibleTrigger className="flex items-center space-x-2 w-full text-left hover:bg-gray-50 p-2 rounded">
              {poolOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Waves className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium">Pool Information</h3>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
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

              {/* Pool Equipment Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium">Pool Equipment</h4>
                  <ValveDataScraper onValveDataFetched={handleValveDataFetched} />
                </div>
                
                {/* Dropdowns */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="pump">Pump</Label>
                    <Select value={poolEquipment.pump || ''} onValueChange={(value) => updatePoolEquipment('pump', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pump type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single-speed">Single Speed</SelectItem>
                        <SelectItem value="dual-speed">Dual Speed</SelectItem>
                        <SelectItem value="variable-speed">Variable Speed</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="filter">Filter</Label>
                    <Select value={poolEquipment.filter || ''} onValueChange={(value) => updatePoolEquipment('filter', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select filter type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sand">Sand Filter</SelectItem>
                        <SelectItem value="cartridge">Cartridge Filter</SelectItem>
                        <SelectItem value="de">DE Filter</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="heater">Heater</Label>
                    <Select value={poolEquipment.heater || ''} onValueChange={(value) => updatePoolEquipment('heater', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select heater type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gas">Gas Heater</SelectItem>
                        <SelectItem value="electric">Electric Heater</SelectItem>
                        <SelectItem value="heat-pump">Heat Pump</SelectItem>
                        <SelectItem value="solar">Solar Heater</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Valve Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ValveSelector
                    label="Valve 1"
                    manufacturer={poolEquipment.valve_1_manufacturer || ''}
                    specificValve={poolEquipment.valve_1_specific || ''}
                    onManufacturerChange={(value) => updatePoolEquipment('valve_1_manufacturer', value)}
                    onSpecificValveChange={(value) => updatePoolEquipment('valve_1_specific', value)}
                    valveData={valveData}
                  />

                  <ValveSelector
                    label="Valve 2"
                    manufacturer={poolEquipment.valve_2_manufacturer || ''}
                    specificValve={poolEquipment.valve_2_specific || ''}
                    onManufacturerChange={(value) => updatePoolEquipment('valve_2_manufacturer', value)}
                    onSpecificValveChange={(value) => updatePoolEquipment('valve_2_specific', value)}
                    valveData={valveData}
                  />

                  <ValveSelector
                    label="Valve 3"
                    manufacturer={poolEquipment.valve_3_manufacturer || ''}
                    specificValve={poolEquipment.valve_3_specific || ''}
                    onManufacturerChange={(value) => updatePoolEquipment('valve_3_manufacturer', value)}
                    onSpecificValveChange={(value) => updatePoolEquipment('valve_3_specific', value)}
                    valveData={valveData}
                  />

                  <ValveSelector
                    label="Valve 4"
                    manufacturer={poolEquipment.valve_4_manufacturer || ''}
                    specificValve={poolEquipment.valve_4_specific || ''}
                    onManufacturerChange={(value) => updatePoolEquipment('valve_4_manufacturer', value)}
                    onSpecificValveChange={(value) => updatePoolEquipment('valve_4_specific', value)}
                    valveData={valveData}
                  />
                </div>

                {/* Checkboxes */}
                <div className="space-y-4">
                  <h5 className="text-sm font-medium">Additional Equipment</h5>
                  <div className="space-y-4">
                    {/* Time Clock */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="time_clock"
                          checked={poolEquipment.time_clock || false}
                          onCheckedChange={(checked) => updatePoolEquipment('time_clock', checked)}
                        />
                        <Label htmlFor="time_clock">Time Clock</Label>
                      </div>
                      
                      {poolEquipment.time_clock && (
                        <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="time_clock_on_hour">On Hour</Label>
                            <Input
                              id="time_clock_on_hour"
                              value={poolEquipment.time_clock_on_hour || ''}
                              onChange={(e) => updatePoolEquipment('time_clock_on_hour', e.target.value)}
                              placeholder="e.g., 8:00 AM"
                            />
                          </div>
                          <div>
                            <Label htmlFor="time_clock_off_hour">Off Hour</Label>
                            <Input
                              id="time_clock_off_hour"
                              value={poolEquipment.time_clock_off_hour || ''}
                              onChange={(e) => updatePoolEquipment('time_clock_off_hour', e.target.value)}
                              placeholder="e.g., 6:00 PM"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Controller */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="controller"
                          checked={poolEquipment.controller || false}
                          onCheckedChange={(checked) => updatePoolEquipment('controller', checked)}
                        />
                        <Label htmlFor="controller">Controller</Label>
                      </div>
                      
                      {poolEquipment.controller && (
                        <div className="ml-6 space-y-4">
                          <div>
                            <Label htmlFor="controller_model">Model</Label>
                            <Input
                              id="controller_model"
                              value={poolEquipment.controller_model || ''}
                              onChange={(e) => updatePoolEquipment('controller_model', e.target.value)}
                              placeholder="Controller model"
                            />
                          </div>
                          <div>
                            <Label htmlFor="controller_notes">Notes</Label>
                            <Textarea
                              id="controller_notes"
                              value={poolEquipment.controller_notes || ''}
                              onChange={(e) => updatePoolEquipment('controller_notes', e.target.value)}
                              placeholder="Additional controller notes"
                              rows={2}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Water Valve */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="water_valve"
                          checked={poolEquipment.water_valve || false}
                          onCheckedChange={(checked) => updatePoolEquipment('water_valve', checked)}
                        />
                        <Label htmlFor="water_valve">Water Valve</Label>
                      </div>
                      
                      {poolEquipment.water_valve && (
                        <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="water_valve_manufacturer">Manufacturer</Label>
                            <Input
                              id="water_valve_manufacturer"
                              value={poolEquipment.water_valve_manufacturer || ''}
                              onChange={(e) => updatePoolEquipment('water_valve_manufacturer', e.target.value)}
                              placeholder="Valve manufacturer"
                            />
                          </div>
                          <div>
                            <Label htmlFor="water_valve_ports">Number of Ports</Label>
                            <Input
                              id="water_valve_ports"
                              value={poolEquipment.water_valve_ports || ''}
                              onChange={(e) => updatePoolEquipment('water_valve_ports', e.target.value)}
                              placeholder="e.g., 3, 6"
                            />
                          </div>
                          <div>
                            <Label htmlFor="water_valve_return_port">Return Port #</Label>
                            <Input
                              id="water_valve_return_port"
                              value={poolEquipment.water_valve_return_port || ''}
                              onChange={(e) => updatePoolEquipment('water_valve_return_port', e.target.value)}
                              placeholder="Return port number"
                            />
                          </div>
                          <div>
                            <Label htmlFor="water_valve_bypass_port">Bypass Port #</Label>
                            <Input
                              id="water_valve_bypass_port"
                              value={poolEquipment.water_valve_bypass_port || ''}
                              onChange={(e) => updatePoolEquipment('water_valve_bypass_port', e.target.value)}
                              placeholder="Bypass port number"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Spa Information - Collapsible */}
          <Collapsible open={spaOpen} onOpenChange={setSpaOpen}>
            <CollapsibleTrigger className="flex items-center space-x-2 w-full text-left hover:bg-gray-50 p-2 rounded">
              {spaOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Droplets className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-medium">Spa Information</h3>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
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
            </CollapsibleContent>
          </Collapsible>

          {/* Water Features - Collapsible */}
          <Collapsible open={waterFeaturesOpen} onOpenChange={setWaterFeaturesOpen}>
            <CollapsibleTrigger className="flex items-center space-x-2 w-full text-left hover:bg-gray-50 p-2 rounded">
              {waterFeaturesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Waves className="h-5 w-5 text-cyan-600" />
              <h3 className="text-lg font-medium">Water Features</h3>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
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
            </CollapsibleContent>
          </Collapsible>

          {/* Access Information - Collapsible */}
          <Collapsible open={accessOpen} onOpenChange={setAccessOpen}>
            <CollapsibleTrigger className="flex items-center space-x-2 w-full text-left hover:bg-gray-50 p-2 rounded">
              {accessOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Shield className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-medium">Access Information</h3>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
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
            </CollapsibleContent>
          </Collapsible>

          {/* Chemical Preferences - Collapsible */}
          <Collapsible open={chemicalOpen} onOpenChange={setChemicalOpen}>
            <CollapsibleTrigger className="flex items-center space-x-2 w-full text-left hover:bg-gray-50 p-2 rounded">
              {chemicalOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Beaker className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-medium">Chemical Preferences</h3>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
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
            </CollapsibleContent>
          </Collapsible>

          {/* Special Notes - Collapsible */}
          <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
            <CollapsibleTrigger className="flex items-center space-x-2 w-full text-left hover:bg-gray-50 p-2 rounded">
              {notesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <FileText className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium">Special Notes</h3>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
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
            </CollapsibleContent>
          </Collapsible>

          <Button type="submit" disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Customer Details'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
