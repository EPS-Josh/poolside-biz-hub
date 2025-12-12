import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ServiceSelect } from '@/components/calendar/ServiceSelect';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { PartsUsedSelector } from '@/components/PartsUsedSelector';

interface PartUsed {
  inventoryItemId: string;
  quantity: number;
  itemName: string;
  unitPrice: number | null;
}

interface WizardFormData {
  service_date: string;
  service_time: string;
  service_type: string;
  technician_name: string;
  work_performed: string;
  chemicals_added: string;
  equipment_serviced: string;
  customer_notes: string;
  technician_notes: string;
  next_service_date: string;
  total_time_minutes: string;
  service_status: string;
  invoicing_status: string;
  needs_follow_up: boolean;
  follow_up_notes: string;
  follow_up_date: string;
  before_readings: {
    total_hardness: string;
    total_chlorine_bromine: string;
    free_chlorine: string;
    ph: string;
    total_alkalinity: string;
    cyanuric_acid: string;
  };
  after_readings: {
    total_hardness: string;
    total_chlorine_bromine: string;
    free_chlorine: string;
    ph: string;
    total_alkalinity: string;
    cyanuric_acid: string;
  };
  spa_before_readings: {
    total_hardness: string;
    total_chlorine_bromine: string;
    free_chlorine: string;
    ph: string;
    total_alkalinity: string;
    cyanuric_acid: string;
  };
  spa_after_readings: {
    total_hardness: string;
    total_chlorine_bromine: string;
    free_chlorine: string;
    ph: string;
    total_alkalinity: string;
    cyanuric_acid: string;
  };
}

interface ServiceRecordWizardProps {
  formData: WizardFormData;
  updateFormData: (field: string, value: any) => void;
  updateReadings: (type: 'before_readings' | 'after_readings' | 'spa_before_readings' | 'spa_after_readings', field: string, value: string) => void;
  partsUsed: PartUsed[];
  onPartsUsedChange: (parts: PartUsed[]) => void;
  hasStandaloneSpa: boolean;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

// Service types that require chemical readings
const CHEMICAL_READING_SERVICES = [
  'Weekly Pool Cleaning',
  'Bi-Weekly Pool Cleaning',
  'One-Time Pool Cleaning',
  'Chemical Balancing'
];

const ALL_WIZARD_STEPS = [
  { id: 'service-info', title: 'Service Info', shortTitle: 'Info', alwaysShow: true },
  { id: 'before-readings', title: 'Before Readings', shortTitle: 'Before', alwaysShow: false },
  { id: 'work-performed', title: 'Work Performed', shortTitle: 'Work', alwaysShow: true },
  { id: 'after-readings', title: 'After Readings', shortTitle: 'After', alwaysShow: false },
  { id: 'parts-notes', title: 'Parts & Notes', shortTitle: 'Notes', alwaysShow: true },
];

export const ServiceRecordWizard: React.FC<ServiceRecordWizardProps> = ({
  formData,
  updateFormData,
  updateReadings,
  partsUsed,
  onPartsUsedChange,
  hasStandaloneSpa,
  loading,
  onSubmit,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Check if current service type requires chemical readings
  const showChemicalReadings = CHEMICAL_READING_SERVICES.includes(formData.service_type);

  // Filter steps based on service type
  const WIZARD_STEPS = ALL_WIZARD_STEPS.filter(step => step.alwaysShow || showChemicalReadings);

  const totalSteps = WIZARD_STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Reset to valid step if current step is out of bounds after service type change
  React.useEffect(() => {
    if (currentStep >= WIZARD_STEPS.length) {
      setCurrentStep(WIZARD_STEPS.length - 1);
    }
  }, [showChemicalReadings, currentStep, WIZARD_STEPS.length]);

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  const renderStepIndicator = () => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        {WIZARD_STEPS.map((step, index) => (
          <button
            key={step.id}
            type="button"
            onClick={() => setCurrentStep(index)}
            className={`flex flex-col items-center flex-1 ${
              index === currentStep 
                ? 'text-primary' 
                : index < currentStep 
                  ? 'text-muted-foreground' 
                  : 'text-muted-foreground/50'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${
              index === currentStep 
                ? 'bg-primary text-primary-foreground' 
                : index < currentStep 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-muted text-muted-foreground'
            }`}>
              {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <span className="text-xs hidden sm:block">{step.shortTitle}</span>
          </button>
        ))}
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );

  const renderServiceInfoStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Service Information</h3>
      
      <div>
        <Label htmlFor="wizard_service_date">Service Date *</Label>
        <Input
          id="wizard_service_date"
          type="date"
          value={formData.service_date}
          onChange={(e) => updateFormData('service_date', e.target.value)}
          required
          className="h-12 text-base"
        />
      </div>
      
      <div>
        <Label htmlFor="wizard_service_time">Service Time</Label>
        <Input
          id="wizard_service_time"
          type="time"
          value={formData.service_time}
          onChange={(e) => updateFormData('service_time', e.target.value)}
          className="h-12 text-base"
        />
      </div>
      
      <ServiceSelect
        value={formData.service_type}
        onChange={(value) => updateFormData('service_type', value)}
      />
      
      <div>
        <Label htmlFor="wizard_technician_name">Technician Name</Label>
        <Input
          id="wizard_technician_name"
          value={formData.technician_name}
          onChange={(e) => updateFormData('technician_name', e.target.value)}
          placeholder="Enter technician name"
          className="h-12 text-base"
        />
      </div>
    </div>
  );

  const renderBeforeReadingsStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pool Before Readings</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="wizard_before_th" className="text-sm">Total Hardness</Label>
          <Input
            id="wizard_before_th"
            value={formData.before_readings.total_hardness}
            onChange={(e) => updateReadings('before_readings', 'total_hardness', e.target.value)}
            placeholder="200"
            inputMode="numeric"
            className="h-12 text-base"
          />
        </div>
        <div>
          <Label htmlFor="wizard_before_tcb" className="text-sm">Total Cl/Br</Label>
          <Input
            id="wizard_before_tcb"
            value={formData.before_readings.total_chlorine_bromine}
            onChange={(e) => updateReadings('before_readings', 'total_chlorine_bromine', e.target.value)}
            placeholder="3.0"
            inputMode="decimal"
            className="h-12 text-base"
          />
        </div>
        <div>
          <Label htmlFor="wizard_before_fc" className="text-sm">Free Chlorine</Label>
          <Input
            id="wizard_before_fc"
            value={formData.before_readings.free_chlorine}
            onChange={(e) => updateReadings('before_readings', 'free_chlorine', e.target.value)}
            placeholder="1.5"
            inputMode="decimal"
            className="h-12 text-base"
          />
        </div>
        <div>
          <Label htmlFor="wizard_before_ph" className="text-sm">pH</Label>
          <Input
            id="wizard_before_ph"
            value={formData.before_readings.ph}
            onChange={(e) => updateReadings('before_readings', 'ph', e.target.value)}
            placeholder="7.2"
            inputMode="decimal"
            className="h-12 text-base"
          />
        </div>
        <div>
          <Label htmlFor="wizard_before_ta" className="text-sm">Total Alkalinity</Label>
          <Input
            id="wizard_before_ta"
            value={formData.before_readings.total_alkalinity}
            onChange={(e) => updateReadings('before_readings', 'total_alkalinity', e.target.value)}
            placeholder="120"
            inputMode="numeric"
            className="h-12 text-base"
          />
        </div>
        <div>
          <Label htmlFor="wizard_before_cya" className="text-sm">Cyanuric Acid</Label>
          <Input
            id="wizard_before_cya"
            value={formData.before_readings.cyanuric_acid}
            onChange={(e) => updateReadings('before_readings', 'cyanuric_acid', e.target.value)}
            placeholder="30"
            inputMode="numeric"
            className="h-12 text-base"
          />
        </div>
      </div>

      {hasStandaloneSpa && (
        <>
          <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mt-6">Spa Before Readings</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="wizard_spa_before_th" className="text-sm">Total Hardness</Label>
              <Input
                id="wizard_spa_before_th"
                value={formData.spa_before_readings.total_hardness}
                onChange={(e) => updateReadings('spa_before_readings', 'total_hardness', e.target.value)}
                placeholder="200"
                inputMode="numeric"
                className="h-12 text-base"
              />
            </div>
            <div>
              <Label htmlFor="wizard_spa_before_tcb" className="text-sm">Total Cl/Br</Label>
              <Input
                id="wizard_spa_before_tcb"
                value={formData.spa_before_readings.total_chlorine_bromine}
                onChange={(e) => updateReadings('spa_before_readings', 'total_chlorine_bromine', e.target.value)}
                placeholder="3.0"
                inputMode="decimal"
                className="h-12 text-base"
              />
            </div>
            <div>
              <Label htmlFor="wizard_spa_before_fc" className="text-sm">Free Chlorine</Label>
              <Input
                id="wizard_spa_before_fc"
                value={formData.spa_before_readings.free_chlorine}
                onChange={(e) => updateReadings('spa_before_readings', 'free_chlorine', e.target.value)}
                placeholder="1.5"
                inputMode="decimal"
                className="h-12 text-base"
              />
            </div>
            <div>
              <Label htmlFor="wizard_spa_before_ph" className="text-sm">pH</Label>
              <Input
                id="wizard_spa_before_ph"
                value={formData.spa_before_readings.ph}
                onChange={(e) => updateReadings('spa_before_readings', 'ph', e.target.value)}
                placeholder="7.2"
                inputMode="decimal"
                className="h-12 text-base"
              />
            </div>
            <div>
              <Label htmlFor="wizard_spa_before_ta" className="text-sm">Total Alkalinity</Label>
              <Input
                id="wizard_spa_before_ta"
                value={formData.spa_before_readings.total_alkalinity}
                onChange={(e) => updateReadings('spa_before_readings', 'total_alkalinity', e.target.value)}
                placeholder="120"
                inputMode="numeric"
                className="h-12 text-base"
              />
            </div>
            <div>
              <Label htmlFor="wizard_spa_before_cya" className="text-sm">Cyanuric Acid</Label>
              <Input
                id="wizard_spa_before_cya"
                value={formData.spa_before_readings.cyanuric_acid}
                onChange={(e) => updateReadings('spa_before_readings', 'cyanuric_acid', e.target.value)}
                placeholder="30"
                inputMode="numeric"
                className="h-12 text-base"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderWorkPerformedStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Work Performed</h3>
      
      <div>
        <Label htmlFor="wizard_work_performed">Work Performed</Label>
        <Textarea
          id="wizard_work_performed"
          value={formData.work_performed}
          onChange={(e) => updateFormData('work_performed', e.target.value)}
          placeholder="Describe the work performed..."
          rows={4}
          className="text-base"
        />
      </div>
      
      <div>
        <Label htmlFor="wizard_chemicals_added">Chemicals Added</Label>
        <Textarea
          id="wizard_chemicals_added"
          value={formData.chemicals_added}
          onChange={(e) => updateFormData('chemicals_added', e.target.value)}
          placeholder="List chemicals added and quantities..."
          rows={3}
          className="text-base"
        />
      </div>
      
      <div>
        <Label htmlFor="wizard_equipment_serviced">Equipment Serviced</Label>
        <Textarea
          id="wizard_equipment_serviced"
          value={formData.equipment_serviced}
          onChange={(e) => updateFormData('equipment_serviced', e.target.value)}
          placeholder="List equipment serviced or repaired..."
          rows={3}
          className="text-base"
        />
      </div>
    </div>
  );

  const renderAfterReadingsStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pool After Readings</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="wizard_after_th" className="text-sm">Total Hardness</Label>
          <Input
            id="wizard_after_th"
            value={formData.after_readings.total_hardness}
            onChange={(e) => updateReadings('after_readings', 'total_hardness', e.target.value)}
            placeholder="200"
            inputMode="numeric"
            className="h-12 text-base"
          />
        </div>
        <div>
          <Label htmlFor="wizard_after_tcb" className="text-sm">Total Cl/Br</Label>
          <Input
            id="wizard_after_tcb"
            value={formData.after_readings.total_chlorine_bromine}
            onChange={(e) => updateReadings('after_readings', 'total_chlorine_bromine', e.target.value)}
            placeholder="3.0"
            inputMode="decimal"
            className="h-12 text-base"
          />
        </div>
        <div>
          <Label htmlFor="wizard_after_fc" className="text-sm">Free Chlorine</Label>
          <Input
            id="wizard_after_fc"
            value={formData.after_readings.free_chlorine}
            onChange={(e) => updateReadings('after_readings', 'free_chlorine', e.target.value)}
            placeholder="2.0"
            inputMode="decimal"
            className="h-12 text-base"
          />
        </div>
        <div>
          <Label htmlFor="wizard_after_ph" className="text-sm">pH</Label>
          <Input
            id="wizard_after_ph"
            value={formData.after_readings.ph}
            onChange={(e) => updateReadings('after_readings', 'ph', e.target.value)}
            placeholder="7.4"
            inputMode="decimal"
            className="h-12 text-base"
          />
        </div>
        <div>
          <Label htmlFor="wizard_after_ta" className="text-sm">Total Alkalinity</Label>
          <Input
            id="wizard_after_ta"
            value={formData.after_readings.total_alkalinity}
            onChange={(e) => updateReadings('after_readings', 'total_alkalinity', e.target.value)}
            placeholder="125"
            inputMode="numeric"
            className="h-12 text-base"
          />
        </div>
        <div>
          <Label htmlFor="wizard_after_cya" className="text-sm">Cyanuric Acid</Label>
          <Input
            id="wizard_after_cya"
            value={formData.after_readings.cyanuric_acid}
            onChange={(e) => updateReadings('after_readings', 'cyanuric_acid', e.target.value)}
            placeholder="35"
            inputMode="numeric"
            className="h-12 text-base"
          />
        </div>
      </div>

      {hasStandaloneSpa && (
        <>
          <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mt-6">Spa After Readings</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="wizard_spa_after_th" className="text-sm">Total Hardness</Label>
              <Input
                id="wizard_spa_after_th"
                value={formData.spa_after_readings.total_hardness}
                onChange={(e) => updateReadings('spa_after_readings', 'total_hardness', e.target.value)}
                placeholder="200"
                inputMode="numeric"
                className="h-12 text-base"
              />
            </div>
            <div>
              <Label htmlFor="wizard_spa_after_tcb" className="text-sm">Total Cl/Br</Label>
              <Input
                id="wizard_spa_after_tcb"
                value={formData.spa_after_readings.total_chlorine_bromine}
                onChange={(e) => updateReadings('spa_after_readings', 'total_chlorine_bromine', e.target.value)}
                placeholder="3.0"
                inputMode="decimal"
                className="h-12 text-base"
              />
            </div>
            <div>
              <Label htmlFor="wizard_spa_after_fc" className="text-sm">Free Chlorine</Label>
              <Input
                id="wizard_spa_after_fc"
                value={formData.spa_after_readings.free_chlorine}
                onChange={(e) => updateReadings('spa_after_readings', 'free_chlorine', e.target.value)}
                placeholder="2.0"
                inputMode="decimal"
                className="h-12 text-base"
              />
            </div>
            <div>
              <Label htmlFor="wizard_spa_after_ph" className="text-sm">pH</Label>
              <Input
                id="wizard_spa_after_ph"
                value={formData.spa_after_readings.ph}
                onChange={(e) => updateReadings('spa_after_readings', 'ph', e.target.value)}
                placeholder="7.4"
                inputMode="decimal"
                className="h-12 text-base"
              />
            </div>
            <div>
              <Label htmlFor="wizard_spa_after_ta" className="text-sm">Total Alkalinity</Label>
              <Input
                id="wizard_spa_after_ta"
                value={formData.spa_after_readings.total_alkalinity}
                onChange={(e) => updateReadings('spa_after_readings', 'total_alkalinity', e.target.value)}
                placeholder="125"
                inputMode="numeric"
                className="h-12 text-base"
              />
            </div>
            <div>
              <Label htmlFor="wizard_spa_after_cya" className="text-sm">Cyanuric Acid</Label>
              <Input
                id="wizard_spa_after_cya"
                value={formData.spa_after_readings.cyanuric_acid}
                onChange={(e) => updateReadings('spa_after_readings', 'cyanuric_acid', e.target.value)}
                placeholder="35"
                inputMode="numeric"
                className="h-12 text-base"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderPartsNotesStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Parts & Notes</h3>
      
      <PartsUsedSelector
        partsUsed={partsUsed}
        onPartsUsedChange={onPartsUsedChange}
      />

      <div>
        <Label htmlFor="wizard_customer_notes">Customer Notes</Label>
        <Textarea
          id="wizard_customer_notes"
          value={formData.customer_notes}
          onChange={(e) => updateFormData('customer_notes', e.target.value)}
          placeholder="Any notes from the customer..."
          rows={2}
          className="text-base"
        />
      </div>
      
      <div>
        <Label htmlFor="wizard_technician_notes">Technician Notes</Label>
        <Textarea
          id="wizard_technician_notes"
          value={formData.technician_notes}
          onChange={(e) => updateFormData('technician_notes', e.target.value)}
          placeholder="Internal technician notes..."
          rows={2}
          className="text-base"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="wizard_needs_follow_up"
          checked={formData.needs_follow_up}
          onCheckedChange={(checked) => updateFormData('needs_follow_up', checked)}
        />
        <Label htmlFor="wizard_needs_follow_up" className="text-sm font-medium cursor-pointer">
          Follow-up needed
        </Label>
      </div>

      {formData.needs_follow_up && (
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="wizard_follow_up_date">Follow-up Date</Label>
              <Input
                id="wizard_follow_up_date"
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => updateFormData('follow_up_date', e.target.value)}
                className="h-12 text-base"
              />
            </div>
            <div>
              <Label htmlFor="wizard_follow_up_notes">Follow-up Notes</Label>
              <Textarea
                id="wizard_follow_up_notes"
                value={formData.follow_up_notes}
                onChange={(e) => updateFormData('follow_up_notes', e.target.value)}
                placeholder="Specific follow-up instructions..."
                rows={2}
                className="text-base"
              />
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="wizard_total_time">Total Time (min)</Label>
          <Input
            id="wizard_total_time"
            type="number"
            value={formData.total_time_minutes}
            onChange={(e) => updateFormData('total_time_minutes', e.target.value)}
            placeholder="60"
            inputMode="numeric"
            className="h-12 text-base"
          />
        </div>
        <div>
          <Label htmlFor="wizard_service_status">Service Status</Label>
          <Select value={formData.service_status} onValueChange={(value) => updateFormData('service_status', value)}>
            <SelectTrigger className="h-12">
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

      <div>
        <Label htmlFor="wizard_invoicing_status">Invoicing Status</Label>
        <Select value={formData.invoicing_status} onValueChange={(value) => updateFormData('invoicing_status', value)}>
          <SelectTrigger className="h-12">
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

      <div>
        <Label htmlFor="wizard_next_service_date">Next Service Date</Label>
        <Input
          id="wizard_next_service_date"
          type="date"
          value={formData.next_service_date}
          onChange={(e) => updateFormData('next_service_date', e.target.value)}
          className="h-12 text-base"
        />
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    const currentStepId = WIZARD_STEPS[currentStep]?.id;
    switch (currentStepId) {
      case 'service-info':
        return renderServiceInfoStep();
      case 'before-readings':
        return renderBeforeReadingsStep();
      case 'work-performed':
        return renderWorkPerformedStep();
      case 'after-readings':
        return renderAfterReadingsStep();
      case 'parts-notes':
        return renderPartsNotesStep();
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {renderStepIndicator()}
      
      <div className="flex-1 overflow-y-auto pb-4">
        {renderCurrentStep()}
      </div>
      
      {/* Navigation buttons - fixed at bottom */}
      <div className="flex justify-between items-center pt-4 border-t bg-background">
        <Button
          type="button"
          variant="outline"
          onClick={currentStep === 0 ? onCancel : goPrev}
          className="h-12 px-6"
        >
          {currentStep === 0 ? (
            'Cancel'
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </>
          )}
        </Button>
        
        {currentStep === totalSteps - 1 ? (
          <Button type="submit" disabled={loading} className="h-12 px-6">
            {loading ? 'Saving...' : 'Save Record'}
          </Button>
        ) : (
          <Button type="button" onClick={goNext} className="h-12 px-6">
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </form>
  );
};
