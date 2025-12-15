import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ServiceSelect } from '@/components/calendar/ServiceSelect';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Plus, LayoutList, Wand2, Clock, Trash2, RotateCcw } from 'lucide-react';
import { formatPhoenixDateForDatabase, getCurrentPhoenixDate } from '@/utils/phoenixTimeUtils';
import { PartsUsedSelector } from '@/components/PartsUsedSelector';
import { useIsMobile } from '@/hooks/use-mobile';
import { ServiceRecordWizard } from '@/components/ServiceRecordWizard';
import { Toggle } from '@/components/ui/toggle';
import { useServiceRecordDraft } from '@/hooks/useServiceRecordDraft';
import { ChemicalReadingSlider } from '@/components/ChemicalReadingSlider';

interface PartUsed {
  inventoryItemId: string;
  quantity: number;
  itemName: string;
  unitPrice: number | null;
}

interface ServiceRecordFormProps {
  customerId: string;
  onSuccess: () => void;
  appointmentData?: {
    appointmentDate?: string;
    appointmentTime?: string;
    serviceType?: string;
  };
  triggerOpen?: boolean;
  onTriggerOpenChange?: (open: boolean) => void;
}

// Service types that require chemical readings
const CHEMICAL_READING_SERVICES = [
  'Weekly Pool Cleaning',
  'Bi-Weekly Pool Cleaning',
  'One-Time Pool Cleaning',
  'Chemical Balancing'
];

export const ServiceRecordForm = ({ customerId, onSuccess, appointmentData, triggerOpen, onTriggerOpenChange }: ServiceRecordFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([]);
  const [hasStandaloneSpa, setHasStandaloneSpa] = useState(false);
  // Default to wizard mode on mobile, full form on desktop
  const [useWizardMode, setUseWizardMode] = useState(isMobile);
  // Draft management
  const { hasDraft, saveDraft, loadDraft, clearDraft, formatDraftTime } = useServiceRecordDraft(customerId);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [draftChecked, setDraftChecked] = useState(false);
  // Initialize with appointment data if provided, otherwise use current Phoenix date
  const currentPhoenixDate = getCurrentPhoenixDate();
  const [formData, setFormData] = useState({
    service_date: appointmentData?.appointmentDate || formatPhoenixDateForDatabase(currentPhoenixDate),
    service_time: appointmentData?.appointmentTime || '',
    service_type: appointmentData?.serviceType || '',
    technician_name: '',
    work_performed: '',
    chemicals_added: '',
    equipment_serviced: '',
    customer_notes: '',
    technician_notes: '',
    next_service_date: '',
    total_time_minutes: '',
    service_status: 'completed',
    invoicing_status: 'ready_for_qb',
    needs_follow_up: false,
    follow_up_notes: '',
    follow_up_date: '',
    before_readings: {
      total_hardness: '',
      total_chlorine_bromine: '',
      free_chlorine: '',
      ph: '',
      total_alkalinity: '',
      cyanuric_acid: ''
    },
    after_readings: {
      total_hardness: '',
      total_chlorine_bromine: '',
      free_chlorine: '',
      ph: '',
      total_alkalinity: '',
      cyanuric_acid: ''
    },
    spa_before_readings: {
      total_hardness: '',
      total_chlorine_bromine: '',
      free_chlorine: '',
      ph: '',
      total_alkalinity: '',
      cyanuric_acid: ''
    },
    spa_after_readings: {
      total_hardness: '',
      total_chlorine_bromine: '',
      free_chlorine: '',
      ph: '',
      total_alkalinity: '',
      cyanuric_acid: ''
    }
  });

  // Fetch customer service details to check spa type
  useEffect(() => {
    const fetchSpaType = async () => {
      const { data } = await supabase
        .from('customer_service_details')
        .select('spa_type')
        .eq('customer_id', customerId)
        .maybeSingle();
      
      if (data?.spa_type === 'Standalone' || data?.spa_type === 'Hot Tub') {
        setHasStandaloneSpa(true);
      }
    };
    fetchSpaType();
  }, [customerId]);

  // Check if current service type requires chemical readings
  const showChemicalReadings = CHEMICAL_READING_SERVICES.includes(formData.service_type);

  // Update wizard mode default when mobile detection changes
  useEffect(() => {
    setUseWizardMode(isMobile);
  }, [isMobile]);

  // Check for draft when dialog opens
  useEffect(() => {
    if (open && hasDraft && !draftChecked) {
      setShowDraftPrompt(true);
      setDraftChecked(true);
    }
  }, [open, hasDraft, draftChecked]);

  // Reset draft check when dialog closes
  useEffect(() => {
    if (!open) {
      setDraftChecked(false);
      setShowDraftPrompt(false);
    }
  }, [open]);

  // Auto-save draft on form data changes (debounced via effect)
  useEffect(() => {
    if (open && !showDraftPrompt) {
      const timeoutId = setTimeout(() => {
        saveDraft(formData, partsUsed);
      }, 1000); // Save after 1 second of no changes
      return () => clearTimeout(timeoutId);
    }
  }, [formData, partsUsed, open, showDraftPrompt, saveDraft]);

  // Update form data when appointment data changes
  useEffect(() => {
    if (appointmentData) {
      console.log('Updating form with appointment data:', appointmentData);
      setFormData(prev => ({
        ...prev,
        service_date: appointmentData.appointmentDate || prev.service_date,
        service_time: appointmentData.appointmentTime || prev.service_time,
        service_type: appointmentData.serviceType || prev.service_type,
      }));
    }
  }, [appointmentData]);

  // Handle external trigger to open dialog
  useEffect(() => {
    if (triggerOpen !== undefined) {
      setOpen(triggerOpen);
    }
  }, [triggerOpen]);

  // Handle open state changes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onTriggerOpenChange?.(newOpen);
  };

  // Handle continuing from draft
  const handleContinueDraft = () => {
    const draft = loadDraft();
    if (draft) {
      setFormData(draft.formData);
      setPartsUsed(draft.partsUsed);
      toast({
        title: 'Draft restored',
        description: 'Your previous work has been restored',
      });
    }
    setShowDraftPrompt(false);
  };

  // Handle starting fresh
  const handleStartFresh = () => {
    clearDraft();
    // Reset to default/appointment data
    const resetPhoenixDate = getCurrentPhoenixDate();
    setFormData({
      service_date: appointmentData?.appointmentDate || formatPhoenixDateForDatabase(resetPhoenixDate),
      service_time: appointmentData?.appointmentTime || '',
      service_type: appointmentData?.serviceType || '',
      technician_name: '',
      work_performed: '',
      chemicals_added: '',
      equipment_serviced: '',
      customer_notes: '',
      technician_notes: '',
      next_service_date: '',
      total_time_minutes: '',
      service_status: 'completed',
      invoicing_status: 'ready_for_qb',
      needs_follow_up: false,
      follow_up_notes: '',
      follow_up_date: '',
      before_readings: { total_hardness: '', total_chlorine_bromine: '', free_chlorine: '', ph: '', total_alkalinity: '', cyanuric_acid: '' },
      after_readings: { total_hardness: '', total_chlorine_bromine: '', free_chlorine: '', ph: '', total_alkalinity: '', cyanuric_acid: '' },
      spa_before_readings: { total_hardness: '', total_chlorine_bromine: '', free_chlorine: '', ph: '', total_alkalinity: '', cyanuric_acid: '' },
      spa_after_readings: { total_hardness: '', total_chlorine_bromine: '', free_chlorine: '', ph: '', total_alkalinity: '', cyanuric_acid: '' }
    });
    setPartsUsed([]);
    setShowDraftPrompt(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      console.log('Submitting service record with Phoenix date:', formData.service_date);
      
      const { error } = await supabase
        .from('service_records')
        .insert({
          customer_id: customerId,
          user_id: user.id,
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
          before_readings: { ...formData.before_readings, ...(hasStandaloneSpa ? { spa: formData.spa_before_readings } : {}) },
          after_readings: { ...formData.after_readings, ...(hasStandaloneSpa ? { spa: formData.spa_after_readings } : {}) },
          parts_used: partsUsed.length > 0 ? JSON.parse(JSON.stringify(partsUsed)) : null,
          invoicing_status: formData.invoicing_status,
          needs_follow_up: formData.needs_follow_up,
          follow_up_notes: formData.follow_up_notes || null,
          follow_up_date: formData.follow_up_date || null
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Service record added successfully',
      });

      // Clear draft on successful save
      clearDraft();
      setOpen(false);
      const resetPhoenixDate = getCurrentPhoenixDate();
      setFormData({
        service_date: formatPhoenixDateForDatabase(resetPhoenixDate),
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
        invoicing_status: 'ready_for_qb',
        needs_follow_up: false,
        follow_up_notes: '',
        follow_up_date: '',
        before_readings: { total_hardness: '', total_chlorine_bromine: '', free_chlorine: '', ph: '', total_alkalinity: '', cyanuric_acid: '' },
        after_readings: { total_hardness: '', total_chlorine_bromine: '', free_chlorine: '', ph: '', total_alkalinity: '', cyanuric_acid: '' },
        spa_before_readings: { total_hardness: '', total_chlorine_bromine: '', free_chlorine: '', ph: '', total_alkalinity: '', cyanuric_acid: '' },
        spa_after_readings: { total_hardness: '', total_chlorine_bromine: '', free_chlorine: '', ph: '', total_alkalinity: '', cyanuric_acid: '' }
      });
      setPartsUsed([]);
      onSuccess();
    } catch (error) {
      console.error('Error adding service record:', error);
      toast({
        title: 'Error',
        description: 'Failed to add service record',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateReadings = (type: 'before_readings' | 'after_readings' | 'spa_before_readings' | 'spa_after_readings', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!triggerOpen && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Service Record
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className={`${useWizardMode ? 'max-w-lg' : 'max-w-4xl'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Add New Service Record</DialogTitle>
            <div className="flex items-center gap-2">
              <Toggle
                pressed={!useWizardMode}
                onPressedChange={(pressed) => setUseWizardMode(!pressed)}
                aria-label="Toggle form mode"
                size="sm"
                className="data-[state=on]:bg-primary/10"
              >
                <LayoutList className="h-4 w-4" />
              </Toggle>
              <Toggle
                pressed={useWizardMode}
                onPressedChange={(pressed) => setUseWizardMode(pressed)}
                aria-label="Toggle wizard mode"
                size="sm"
                className="data-[state=on]:bg-primary/10"
              >
                <Wand2 className="h-4 w-4" />
              </Toggle>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {useWizardMode ? 'Step-by-step wizard' : 'Full form view'}
          </p>
        </DialogHeader>
        
        {/* Draft continuation prompt */}
        {showDraftPrompt && (
          <Alert className="border-primary/50 bg-primary/5">
            <Clock className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-3">
              <span>
                You have an unsaved draft from <strong>{formatDraftTime()}</strong>. Would you like to continue where you left off?
              </span>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={handleContinueDraft} className="gap-1">
                  <RotateCcw className="h-3 w-3" />
                  Continue Draft
                </Button>
                <Button size="sm" variant="outline" onClick={handleStartFresh} className="gap-1">
                  <Trash2 className="h-3 w-3" />
                  Start Fresh
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!showDraftPrompt && (
          <>
        {useWizardMode ? (
          <ServiceRecordWizard
            formData={formData}
            updateFormData={updateFormData}
            updateReadings={updateReadings}
            partsUsed={partsUsed}
            onPartsUsedChange={setPartsUsed}
            hasStandaloneSpa={hasStandaloneSpa}
            loading={loading}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
          />
        ) : (
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
            <ServiceSelect
              value={formData.service_type}
              onChange={(value) => updateFormData('service_type', value)}
            />
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

          <PartsUsedSelector
            partsUsed={partsUsed}
            onPartsUsedChange={setPartsUsed}
          />

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


          {showChemicalReadings && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Pool Before Readings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ChemicalReadingSlider
                      id="before_total_hardness"
                      label="Total Hardness"
                      value={formData.before_readings.total_hardness}
                      onChange={(value) => updateReadings('before_readings', 'total_hardness', value)}
                      min={0}
                      max={1000}
                      step={25}
                      unit=" ppm"
                    />
                    <ChemicalReadingSlider
                      id="before_total_chlorine_bromine"
                      label="Total Chlorine / Bromine"
                      value={formData.before_readings.total_chlorine_bromine}
                      onChange={(value) => updateReadings('before_readings', 'total_chlorine_bromine', value)}
                      min={0}
                      max={10}
                      step={0.5}
                      unit=" ppm"
                    />
                    <ChemicalReadingSlider
                      id="before_free_chlorine"
                      label="Free Chlorine"
                      value={formData.before_readings.free_chlorine}
                      onChange={(value) => updateReadings('before_readings', 'free_chlorine', value)}
                      min={0}
                      max={10}
                      step={0.5}
                      unit=" ppm"
                    />
                    <ChemicalReadingSlider
                      id="before_ph"
                      label="pH"
                      value={formData.before_readings.ph}
                      onChange={(value) => updateReadings('before_readings', 'ph', value)}
                      min={6.0}
                      max={8.5}
                      step={0.1}
                    />
                    <ChemicalReadingSlider
                      id="before_total_alkalinity"
                      label="Total Alkalinity"
                      value={formData.before_readings.total_alkalinity}
                      onChange={(value) => updateReadings('before_readings', 'total_alkalinity', value)}
                      min={0}
                      max={300}
                      step={10}
                      unit=" ppm"
                    />
                    <ChemicalReadingSlider
                      id="before_cyanuric_acid"
                      label="Cyanuric Acid"
                      value={formData.before_readings.cyanuric_acid}
                      onChange={(value) => updateReadings('before_readings', 'cyanuric_acid', value)}
                      min={0}
                      max={200}
                      step={5}
                      unit=" ppm"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Pool After Readings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ChemicalReadingSlider
                      id="after_total_hardness"
                      label="Total Hardness"
                      value={formData.after_readings.total_hardness}
                      onChange={(value) => updateReadings('after_readings', 'total_hardness', value)}
                      min={0}
                      max={1000}
                      step={25}
                      unit=" ppm"
                    />
                    <ChemicalReadingSlider
                      id="after_total_chlorine_bromine"
                      label="Total Chlorine / Bromine"
                      value={formData.after_readings.total_chlorine_bromine}
                      onChange={(value) => updateReadings('after_readings', 'total_chlorine_bromine', value)}
                      min={0}
                      max={10}
                      step={0.5}
                      unit=" ppm"
                    />
                    <ChemicalReadingSlider
                      id="after_free_chlorine"
                      label="Free Chlorine"
                      value={formData.after_readings.free_chlorine}
                      onChange={(value) => updateReadings('after_readings', 'free_chlorine', value)}
                      min={0}
                      max={10}
                      step={0.5}
                      unit=" ppm"
                    />
                    <ChemicalReadingSlider
                      id="after_ph"
                      label="pH"
                      value={formData.after_readings.ph}
                      onChange={(value) => updateReadings('after_readings', 'ph', value)}
                      min={6.0}
                      max={8.5}
                      step={0.1}
                    />
                    <ChemicalReadingSlider
                      id="after_total_alkalinity"
                      label="Total Alkalinity"
                      value={formData.after_readings.total_alkalinity}
                      onChange={(value) => updateReadings('after_readings', 'total_alkalinity', value)}
                      min={0}
                      max={300}
                      step={10}
                      unit=" ppm"
                    />
                    <ChemicalReadingSlider
                      id="after_cyanuric_acid"
                      label="Cyanuric Acid"
                      value={formData.after_readings.cyanuric_acid}
                      onChange={(value) => updateReadings('after_readings', 'cyanuric_acid', value)}
                      min={0}
                      max={200}
                      step={5}
                      unit=" ppm"
                    />
                  </CardContent>
                </Card>
              </div>

              {hasStandaloneSpa && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-purple-200 dark:border-purple-800">
                    <CardHeader>
                      <CardTitle className="text-sm text-purple-700 dark:text-purple-300">Spa Before Readings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ChemicalReadingSlider
                        id="spa_before_total_hardness"
                        label="Total Hardness"
                        value={formData.spa_before_readings.total_hardness}
                        onChange={(value) => updateReadings('spa_before_readings', 'total_hardness', value)}
                        min={0}
                        max={1000}
                        step={25}
                        unit=" ppm"
                      />
                      <ChemicalReadingSlider
                        id="spa_before_total_chlorine_bromine"
                        label="Total Chlorine / Bromine"
                        value={formData.spa_before_readings.total_chlorine_bromine}
                        onChange={(value) => updateReadings('spa_before_readings', 'total_chlorine_bromine', value)}
                        min={0}
                        max={10}
                        step={0.5}
                        unit=" ppm"
                      />
                      <ChemicalReadingSlider
                        id="spa_before_free_chlorine"
                        label="Free Chlorine"
                        value={formData.spa_before_readings.free_chlorine}
                        onChange={(value) => updateReadings('spa_before_readings', 'free_chlorine', value)}
                        min={0}
                        max={10}
                        step={0.5}
                        unit=" ppm"
                      />
                      <ChemicalReadingSlider
                        id="spa_before_ph"
                        label="pH"
                        value={formData.spa_before_readings.ph}
                        onChange={(value) => updateReadings('spa_before_readings', 'ph', value)}
                        min={6.0}
                        max={8.5}
                        step={0.1}
                      />
                      <ChemicalReadingSlider
                        id="spa_before_total_alkalinity"
                        label="Total Alkalinity"
                        value={formData.spa_before_readings.total_alkalinity}
                        onChange={(value) => updateReadings('spa_before_readings', 'total_alkalinity', value)}
                        min={0}
                        max={300}
                        step={10}
                        unit=" ppm"
                      />
                      <ChemicalReadingSlider
                        id="spa_before_cyanuric_acid"
                        label="Cyanuric Acid"
                        value={formData.spa_before_readings.cyanuric_acid}
                        onChange={(value) => updateReadings('spa_before_readings', 'cyanuric_acid', value)}
                        min={0}
                        max={200}
                        step={5}
                        unit=" ppm"
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200 dark:border-purple-800">
                    <CardHeader>
                      <CardTitle className="text-sm text-purple-700 dark:text-purple-300">Spa After Readings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ChemicalReadingSlider
                        id="spa_after_total_hardness"
                        label="Total Hardness"
                        value={formData.spa_after_readings.total_hardness}
                        onChange={(value) => updateReadings('spa_after_readings', 'total_hardness', value)}
                        min={0}
                        max={1000}
                        step={25}
                        unit=" ppm"
                      />
                      <ChemicalReadingSlider
                        id="spa_after_total_chlorine_bromine"
                        label="Total Chlorine / Bromine"
                        value={formData.spa_after_readings.total_chlorine_bromine}
                        onChange={(value) => updateReadings('spa_after_readings', 'total_chlorine_bromine', value)}
                        min={0}
                        max={10}
                        step={0.5}
                        unit=" ppm"
                      />
                      <ChemicalReadingSlider
                        id="spa_after_free_chlorine"
                        label="Free Chlorine"
                        value={formData.spa_after_readings.free_chlorine}
                        onChange={(value) => updateReadings('spa_after_readings', 'free_chlorine', value)}
                        min={0}
                        max={10}
                        step={0.5}
                        unit=" ppm"
                      />
                      <ChemicalReadingSlider
                        id="spa_after_ph"
                        label="pH"
                        value={formData.spa_after_readings.ph}
                        onChange={(value) => updateReadings('spa_after_readings', 'ph', value)}
                        min={6.0}
                        max={8.5}
                        step={0.1}
                      />
                      <ChemicalReadingSlider
                        id="spa_after_total_alkalinity"
                        label="Total Alkalinity"
                        value={formData.spa_after_readings.total_alkalinity}
                        onChange={(value) => updateReadings('spa_after_readings', 'total_alkalinity', value)}
                        min={0}
                        max={300}
                        step={10}
                        unit=" ppm"
                      />
                      <ChemicalReadingSlider
                        id="spa_after_cyanuric_acid"
                        label="Cyanuric Acid"
                        value={formData.spa_after_readings.cyanuric_acid}
                        onChange={(value) => updateReadings('spa_after_readings', 'cyanuric_acid', value)}
                        min={0}
                        max={200}
                        step={5}
                        unit=" ppm"
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}

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
              <div className="flex items-center space-x-2 mt-3">
                <Checkbox
                  id="needs_follow_up"
                  checked={formData.needs_follow_up}
                  onCheckedChange={(checked) => updateFormData('needs_follow_up', checked)}
                />
                <Label htmlFor="needs_follow_up" className="text-sm font-medium cursor-pointer">
                  Follow-up needed
                </Label>
              </div>
            </div>
          </div>

          {formData.needs_follow_up && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
              <div>
                <Label htmlFor="follow_up_date">Follow-up Date</Label>
                <Input
                  id="follow_up_date"
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => updateFormData('follow_up_date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="follow_up_notes">Follow-up Notes</Label>
                <Textarea
                  id="follow_up_notes"
                  value={formData.follow_up_notes}
                  onChange={(e) => updateFormData('follow_up_notes', e.target.value)}
                  placeholder="Specific follow-up instructions..."
                  rows={2}
                />
              </div>
            </div>
          )}

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

          <div className="mb-4">
            <Label htmlFor="invoicing_status">Invoicing Status</Label>
            <Select value={formData.invoicing_status} onValueChange={(value) => updateFormData('invoicing_status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ready_for_qb">Ready for QB</SelectItem>
                <SelectItem value="not_to_be_invoiced">Not to be Invoiced</SelectItem>
                <SelectItem value="connected_to_future_record">Connected to Future Record</SelectItem>
                <SelectItem value="bill_to_company">Bill to Company</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Service Record'}
            </Button>
          </div>
        </form>
        )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
