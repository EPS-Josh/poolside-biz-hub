import React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ColorZone {
  idealMin: number;
  idealMax: number;
  acceptableMin: number;
  acceptableMax: number;
}

interface ChemicalReadingSliderProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
  colorZone?: ColorZone;
}

// Default color zones for common pool chemicals
const DEFAULT_COLOR_ZONES: Record<string, ColorZone> = {
  'total_hardness': { idealMin: 200, idealMax: 400, acceptableMin: 150, acceptableMax: 500 },
  'th': { idealMin: 200, idealMax: 400, acceptableMin: 150, acceptableMax: 500 },
  'total_chlorine_bromine': { idealMin: 1, idealMax: 3, acceptableMin: 0.5, acceptableMax: 5 },
  'tcb': { idealMin: 1, idealMax: 3, acceptableMin: 0.5, acceptableMax: 5 },
  'free_chlorine': { idealMin: 1, idealMax: 3, acceptableMin: 0.5, acceptableMax: 5 },
  'fc': { idealMin: 1, idealMax: 3, acceptableMin: 0.5, acceptableMax: 5 },
  'ph': { idealMin: 7.2, idealMax: 7.6, acceptableMin: 7.0, acceptableMax: 7.8 },
  'total_alkalinity': { idealMin: 80, idealMax: 120, acceptableMin: 60, acceptableMax: 150 },
  'ta': { idealMin: 80, idealMax: 120, acceptableMin: 60, acceptableMax: 150 },
  'cyanuric_acid': { idealMin: 30, idealMax: 50, acceptableMin: 20, acceptableMax: 80 },
  'cya': { idealMin: 30, idealMax: 50, acceptableMin: 20, acceptableMax: 80 },
};

export const ChemicalReadingSlider: React.FC<ChemicalReadingSliderProps> = ({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit = '',
  colorZone,
}) => {
  const numericValue = parseFloat(value) || min;
  
  // Determine color zone based on field name from id
  const fieldName = id.split('_').slice(-2).join('_').replace('wizard_', '').replace('before_', '').replace('after_', '').replace('spa_', '');
  const zone = colorZone || DEFAULT_COLOR_ZONES[fieldName];
  
  const handleSliderChange = (values: number[]) => {
    onChange(values[0].toString());
  };

  // Calculate percentage positions for color zones
  const getPercentage = (val: number) => ((val - min) / (max - min)) * 100;
  
  const getValueStatus = (): 'ideal' | 'acceptable' | 'danger' => {
    if (!zone || !value) return 'acceptable';
    const num = parseFloat(value);
    if (num >= zone.idealMin && num <= zone.idealMax) return 'ideal';
    if (num >= zone.acceptableMin && num <= zone.acceptableMax) return 'acceptable';
    return 'danger';
  };

  const status = getValueStatus();
  const statusColors = {
    ideal: 'bg-green-500 text-green-950',
    acceptable: 'bg-yellow-500 text-yellow-950',
    danger: 'bg-red-500 text-red-950',
  };

  // Build gradient for the track background
  const buildGradient = () => {
    if (!zone) return 'hsl(var(--secondary))';
    
    const acceptableMinPct = Math.max(0, getPercentage(zone.acceptableMin));
    const idealMinPct = getPercentage(zone.idealMin);
    const idealMaxPct = getPercentage(zone.idealMax);
    const acceptableMaxPct = Math.min(100, getPercentage(zone.acceptableMax));

    return `linear-gradient(to right, 
      hsl(0, 70%, 50%) 0%, 
      hsl(0, 70%, 50%) ${acceptableMinPct}%, 
      hsl(45, 90%, 50%) ${acceptableMinPct}%, 
      hsl(45, 90%, 50%) ${idealMinPct}%, 
      hsl(120, 60%, 45%) ${idealMinPct}%, 
      hsl(120, 60%, 45%) ${idealMaxPct}%, 
      hsl(45, 90%, 50%) ${idealMaxPct}%, 
      hsl(45, 90%, 50%) ${acceptableMaxPct}%, 
      hsl(0, 70%, 50%) ${acceptableMaxPct}%, 
      hsl(0, 70%, 50%) 100%
    )`;
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
        <span className={`text-sm font-semibold px-2 py-0.5 rounded ${statusColors[status]}`}>
          {value || min}{unit}
        </span>
      </div>
      <SliderPrimitive.Root
        id={id}
        value={[numericValue]}
        onValueChange={handleSliderChange}
        min={min}
        max={max}
        step={step}
        className="relative flex w-full touch-none select-none items-center"
      >
        <SliderPrimitive.Track 
          className="relative h-3 w-full grow overflow-hidden rounded-full"
          style={{ background: buildGradient() }}
        >
          <SliderPrimitive.Range className="absolute h-full bg-transparent" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-6 w-6 rounded-full border-2 border-primary bg-background shadow-lg ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}{unit}</span>
        {zone && (
          <span className="text-green-600 dark:text-green-400 font-medium">
            Ideal: {zone.idealMin}-{zone.idealMax}{unit}
          </span>
        )}
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};
