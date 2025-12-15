import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface ChemicalReadingSliderProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

export const ChemicalReadingSlider: React.FC<ChemicalReadingSliderProps> = ({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit = '',
}) => {
  const numericValue = parseFloat(value) || min;
  
  const handleSliderChange = (values: number[]) => {
    onChange(values[0].toString());
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
        <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
          {value || min}{unit}
        </span>
      </div>
      <Slider
        id={id}
        value={[numericValue]}
        onValueChange={handleSliderChange}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};
