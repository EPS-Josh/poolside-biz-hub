import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ValveSelector } from '@/components/ValveSelector';
import { PumpSelector } from '@/components/PumpSelector';
import { FilterSelector } from '@/components/FilterSelector';
import { HeaterSelector } from '@/components/HeaterSelector';
import { EquipmentDataScraper } from '@/components/EquipmentDataScraper';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Waves, Droplets, Settings, Shield, ChevronDown, ChevronRight, Beaker, FileText } from 'lucide-react';

interface PoolSizeDetails {
  shape?: string;
  length?: string;
  width?: string;
  avg_depth?: string;
  gallons?: string;
  start_up_date?: string;
}

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
  service_description?: string;
  weekly_rate?: number;
  special_notes?: string;
  is_potential_customer?: boolean;
  acquisition_source?: string;
  proposed_rate?: number;
  potential_customer_notes?: string;
}

interface PoolEquipment {
  pump?: string;
  pump_specific?: string;
  pump_horsepower?: string;
  filter?: string;
  filter_specific?: string;
  heater?: string;
  heater_specific?: string;
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
  cleaning_head_color?: string;
  number_of_heads?: string;
  fluidra_warranty_number?: string;
}

interface CustomerServiceFormProps {
  customerId: string;
}

export const CustomerServiceForm = ({ customerId }: CustomerServiceFormProps) => {
  const [details, setDetails] = useState<CustomerServiceDetails>({});
  const [poolEquipment, setPoolEquipment] = useState<PoolEquipment>({});
  const [poolSizeDetails, setPoolSizeDetails] = useState<PoolSizeDetails>({});
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

  // Add state for equipment data
  const [equipmentData, setEquipmentData] = useState<{
    pumps: { [type: string]: string[] };
    filters: { [type: string]: string[] };
    heaters: { [type: string]: string[] };
  }>({ pumps: {}, filters: {}, heaters: {} });

  // Collapsible section states
  const [serviceOpen, setServiceOpen] = useState(false);
  const [poolOpen, setPoolOpen] = useState(false);
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
            setPoolEquipment({});
          }
        }
        // Parse pool size JSON if it exists
        if (data.pool_size) {
          try {
            const parsed = JSON.parse(data.pool_size);
            if (typeof parsed === 'object' && parsed !== null) {
              setPoolSizeDetails(parsed);
            }
          } catch {
            // Legacy text value - ignore
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
        pool_size: JSON.stringify(poolSizeDetails),
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

  const updateField = (field: keyof CustomerServiceDetails, value: string | number | boolean | undefined) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  const updatePoolEquipment = (field: keyof PoolEquipment, value: string | boolean) => {
    setPoolEquipment(prev => ({ ...prev, [field]: value }));
  };

  const handleValveDataFetched = (newValveData: { [manufacturer: string]: string[] }) => {
    setValveData(prev => ({ ...prev, ...newValveData }));
  };

  const handleEquipmentDataFetched = (equipment: {
    pumps: { [type: string]: string[] };
    filters: { [type: string]: string[] };
    heaters: { [type: string]: string[] };
  }) => {
    setEquipmentData(equipment);
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
          {/* Service & Billing - Collapsible */}
          <Collapsible open={serviceOpen} onOpenChange={setServiceOpen}>
            <CollapsibleTrigger className="flex items-center space-x-2 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
              {serviceOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <FileText className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-medium">Service & Billing</h3>
              {details.is_potential_customer && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full">
                  Potential
                </span>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              {/* Potential Customer Section */}
              <div className={`p-4 border rounded-lg space-y-4 ${
                details.is_potential_customer 
                  ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30' 
                  : 'border-border bg-muted/30'
              }`}>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_potential_customer"
                    checked={details.is_potential_customer || false}
                    onCheckedChange={(checked) => updateField('is_potential_customer', checked as boolean)}
                  />
                  <Label htmlFor="is_potential_customer" className="font-medium">
                    Potential Customer (Not Yet Active)
                  </Label>
                </div>
                
                {details.is_potential_customer && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <div>
                      <Label htmlFor="acquisition_source">Acquisition Source</Label>
                      <Select
                        value={details.acquisition_source || ''}
                        onValueChange={(value) => updateField('acquisition_source', value)}
                      >
                        <SelectTrigger id="acquisition_source">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Azure Gallery">Azure Gallery</SelectItem>
                          <SelectItem value="Referral">Referral</SelectItem>
                          <SelectItem value="Website">Website</SelectItem>
                          <SelectItem value="Phone Call">Phone Call</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="proposed_rate">Proposed Weekly Rate ($)</Label>
                      <Input
                        id="proposed_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={details.proposed_rate || ''}
                        onChange={(e) => updateField('proposed_rate', parseFloat(e.target.value) || undefined)}
                        placeholder="Planned rate to charge"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="potential_customer_notes">Pros/Cons Notes</Label>
                      <Textarea
                        id="potential_customer_notes"
                        value={details.potential_customer_notes || ''}
                        onChange={(e) => updateField('potential_customer_notes', e.target.value)}
                        placeholder="Notes about pros and cons of taking on this customer..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service_frequency">Service Frequency</Label>
                  <Select
                    value={details.service_frequency || ''}
                    onValueChange={(value) => updateField('service_frequency', value)}
                  >
                    <SelectTrigger id="service_frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="weekly_rate">Weekly Service Rate ($)</Label>
                  <Input
                    id="weekly_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={details.weekly_rate || ''}
                    onChange={(e) => updateField('weekly_rate', parseFloat(e.target.value) || undefined)}
                    placeholder="Weekly rate charged"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="service_description">Description of Service</Label>
                <Textarea
                  id="service_description"
                  value={details.service_description || ''}
                  onChange={(e) => updateField('service_description', e.target.value)}
                  placeholder="Describe the services provided"
                  rows={3}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Pool Information - Collapsible */}
          <Collapsible open={poolOpen} onOpenChange={setPoolOpen}>
            <CollapsibleTrigger className="flex items-center space-x-2 w-full text-left hover:bg-gray-50 p-2 rounded">
              {poolOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Waves className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium">Pool Information</h3>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="pool_start_date">Start Up Date</Label>
                  <Input
                    id="pool_start_date"
                    type="date"
                    value={poolSizeDetails.start_up_date || ''}
                    onChange={(e) => setPoolSizeDetails(prev => ({ ...prev, start_up_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="pool_type">Pool Type</Label>
                  <Select
                    value={details.pool_type || ''}
                    onValueChange={(value) => updateField('pool_type', value)}
                  >
                    <SelectTrigger id="pool_type">
                      <SelectValue placeholder="Select pool type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Chlorine">Chlorine</SelectItem>
                      <SelectItem value="Salt">Salt</SelectItem>
                      <SelectItem value="Mineral">Mineral</SelectItem>
                      <SelectItem value="Ozone">Ozone</SelectItem>
                      <SelectItem value="UV">UV</SelectItem>
                      <SelectItem value="Bromine">Bromine</SelectItem>
                      <SelectItem value="Ionizer">Ionizer</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pool_shape">Pool Shape</Label>
                  <Select
                    value={poolSizeDetails.shape || ''}
                    onValueChange={(value) => setPoolSizeDetails(prev => ({ ...prev, shape: value }))}
                  >
                    <SelectTrigger id="pool_shape">
                      <SelectValue placeholder="Select shape" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rectangle">Rectangle</SelectItem>
                      <SelectItem value="Oval">Oval</SelectItem>
                      <SelectItem value="Kidney">Kidney</SelectItem>
                      <SelectItem value="L-Shape">L-Shape</SelectItem>
                      <SelectItem value="Freeform">Freeform</SelectItem>
                      <SelectItem value="Round">Round</SelectItem>
                      <SelectItem value="Geometric">Geometric</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="pool_length">Length (ft)</Label>
                  <Input
                    id="pool_length"
                    type="number"
                    step="0.1"
                    min="0"
                    value={poolSizeDetails.length || ''}
                    onChange={(e) => setPoolSizeDetails(prev => ({ ...prev, length: e.target.value }))}
                    placeholder="Length"
                  />
                </div>
                <div>
                  <Label htmlFor="pool_width">Width (ft)</Label>
                  <Input
                    id="pool_width"
                    type="number"
                    step="0.1"
                    min="0"
                    value={poolSizeDetails.width || ''}
                    onChange={(e) => setPoolSizeDetails(prev => ({ ...prev, width: e.target.value }))}
                    placeholder="Width"
                  />
                </div>
                <div>
                  <Label htmlFor="pool_avg_depth">Avg. Depth (ft)</Label>
                  <Input
                    id="pool_avg_depth"
                    type="number"
                    step="0.1"
                    min="0"
                    value={poolSizeDetails.avg_depth || ''}
                    onChange={(e) => setPoolSizeDetails(prev => ({ ...prev, avg_depth: e.target.value }))}
                    placeholder="Avg. Depth"
                  />
                </div>
                <div>
                  <Label htmlFor="pool_gallons">Gallons</Label>
                  <Input
                    id="pool_gallons"
                    type="number"
                    step="1"
                    min="0"
                    value={poolSizeDetails.gallons || ''}
                    onChange={(e) => setPoolSizeDetails(prev => ({ ...prev, gallons: e.target.value }))}
                    placeholder="Gallons"
                  />
                </div>
              </div>

              {/* Pool Equipment Section */}
              <div className="space-y-4">
                <h4 className="text-md font-medium">Pool Equipment</h4>
                

                {/* Enhanced Equipment Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <PumpSelector
                    label="Pump"
                    pumpType={poolEquipment.pump || ''}
                    specificPump={poolEquipment.pump_specific || ''}
                    pumpHorsepower={poolEquipment.pump_horsepower || ''}
                    onPumpTypeChange={(value) => updatePoolEquipment('pump', value)}
                    onSpecificPumpChange={(value) => updatePoolEquipment('pump_specific', value)}
                    onPumpHorsepowerChange={(value) => updatePoolEquipment('pump_horsepower', value)}
                    pumpData={equipmentData.pumps}
                  />

                  <FilterSelector
                    label="Filter"
                    filterType={poolEquipment.filter || ''}
                    specificFilter={poolEquipment.filter_specific || ''}
                    onFilterTypeChange={(value) => updatePoolEquipment('filter', value)}
                    onSpecificFilterChange={(value) => updatePoolEquipment('filter_specific', value)}
                    filterData={equipmentData.filters}
                  />

                  <HeaterSelector
                    label="Heater"
                    heaterType={poolEquipment.heater || ''}
                    specificHeater={poolEquipment.heater_specific || ''}
                    onHeaterTypeChange={(value) => updatePoolEquipment('heater', value)}
                    onSpecificHeaterChange={(value) => updatePoolEquipment('heater_specific', value)}
                    heaterData={equipmentData.heaters}
                  />
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
                          <div>
                            <Label htmlFor="cleaning_head_color">Cleaning Head Color</Label>
                            <Select value={poolEquipment.cleaning_head_color || ''} onValueChange={(value) => updatePoolEquipment('cleaning_head_color', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select cleaning head color" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="light-cream">Light Cream</SelectItem>
                                <SelectItem value="bright-white">Bright White</SelectItem>
                                <SelectItem value="charcoal-gray">Charcoal Gray</SelectItem>
                                <SelectItem value="dark-blue">Dark Blue</SelectItem>
                                <SelectItem value="jet-black">Jet Black</SelectItem>
                                <SelectItem value="light-blue">Light Blue</SelectItem>
                                <SelectItem value="light-gray">Light Gray</SelectItem>
                                <SelectItem value="tan">Tan</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="number_of_heads"># of Heads</Label>
                            <Input
                              id="number_of_heads"
                              value={poolEquipment.number_of_heads || ''}
                              onChange={(e) => updatePoolEquipment('number_of_heads', e.target.value)}
                              placeholder="e.g., 1, 2, 3"
                            />
                          </div>
                          <div>
                            <Label htmlFor="fluidra_warranty_number">Fluidra Warranty #</Label>
                            <Input
                              id="fluidra_warranty_number"
                              value={poolEquipment.fluidra_warranty_number || ''}
                              onChange={(e) => updatePoolEquipment('fluidra_warranty_number', e.target.value)}
                              placeholder="Warranty number"
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
                  <Select
                    value={details.spa_type || ''}
                    onValueChange={(value) => updateField('spa_type', value)}
                  >
                    <SelectTrigger id="spa_type">
                      <SelectValue placeholder="Select spa type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Attached">Attached (Pool/Spa Combo)</SelectItem>
                      <SelectItem value="Standalone">Standalone Spa</SelectItem>
                      <SelectItem value="Hot Tub">Hot Tub</SelectItem>
                    </SelectContent>
                  </Select>
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
