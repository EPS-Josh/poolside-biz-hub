import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PumpSelectorProps {
  label: string;
  pumpType: string;
  specificPump: string;
  pumpHorsepower: string;
  onPumpTypeChange: (value: string) => void;
  onSpecificPumpChange: (value: string) => void;
  onPumpHorsepowerChange: (value: string) => void;
  pumpData: { [type: string]: string[] };
}

export const PumpSelector = ({ 
  label, 
  pumpType, 
  specificPump, 
  pumpHorsepower,
  onPumpTypeChange, 
  onSpecificPumpChange,
  onPumpHorsepowerChange,
  pumpData 
}: PumpSelectorProps) => {
  const pumpTypeOptions = [
    'Single Speed',
    'Dual Speed',
    'Variable Speed',
    'None'
  ];

  const handlePumpTypeChange = (value: string) => {
    onPumpTypeChange(value);
    // Reset specific pump and horsepower when type changes
    onSpecificPumpChange('');
    onPumpHorsepowerChange('');
  };

  const handleSpecificPumpChange = (value: string) => {
    onSpecificPumpChange(value);
    // Reset horsepower when pump model changes
    onPumpHorsepowerChange('');
  };

  const getSpecificPumpOptions = () => {
    // Check if pump type is selected
    if (!pumpType) {
      return [];
    }
    
    // Convert pump type from value format (lowercase-with-dashes) back to display format for lookup
    const displayPumpType = pumpTypeOptions.find(
      opt => opt.toLowerCase().replace(/\s+/g, '-') === pumpType
    );
    
    if (!displayPumpType) {
      return [];
    }
    
    // Check if we have scraped pump data
    if (pumpData[displayPumpType] && pumpData[displayPumpType].length > 0) {
      return pumpData[displayPumpType];
    }
    
    // Default options for different pump types
    switch (displayPumpType) {
      case 'Variable Speed':
        return [
          'Pentair IntelliFlo VSF',
          'Pentair SuperFlo VST',
          'Hayward TriStar VS',
          'Hayward MaxFlo VS',
          'Jandy FloPro VS',
          'Sta-Rite IntelliPro VSF',
          'Pentair IntelliFlo3 VSF'
        ];
      case 'Single Speed':
        return [
          'Pentair SuperFlo',
          'Hayward Super Pump',
          'Hayward Matrix',
          'Sta-Rite Dura-Glas',
          'Jandy FloPro',
          'Pentair WhisperFlo'
        ];
      case 'Dual Speed':
        return [
          'Pentair SuperFlo Dual Speed',
          'Hayward Super Pump Dual Speed',
          'Sta-Rite Dura-Glas II Dual Speed',
          'Jandy FloPro Dual Speed'
        ];
      default:
        return [];
    }
  };

  const getHorsepowerOptions = () => {
    // Check if both pump type and specific pump are selected
    if (!pumpType || !specificPump) {
      return [];
    }

    // Convert pump type from value format back to display format
    const displayPumpType = pumpTypeOptions.find(
      opt => opt.toLowerCase().replace(/\s+/g, '-') === pumpType
    );

    if (!displayPumpType) {
      return [];
    }

    // HP options based on pump type
    switch (displayPumpType) {
      case 'Variable Speed':
        return ['0.75 HP', '1 HP', '1.5 HP', '1.65 HP', '1.85 HP', '2 HP', '2.7 HP', '3 HP'];
      case 'Single Speed':
        return ['0.5 HP', '0.75 HP', '1 HP', '1.5 HP', '1.65 HP', '1.85 HP', '2 HP', '3 HP'];
      case 'Dual Speed':
        return ['0.75 HP', '1 HP', '1.5 HP', '1.65 HP', '1.85 HP', '2 HP'];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={pumpType} onValueChange={handlePumpTypeChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select pump type" />
        </SelectTrigger>
        <SelectContent className="bg-background border shadow-md z-50">
          {pumpTypeOptions.map((option) => (
            <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, '-')}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {pumpType && pumpType !== 'none' && (
        <Select value={specificPump} onValueChange={handleSpecificPumpChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select specific pump model" />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-md z-50">
            {getSpecificPumpOptions().map((pump) => (
              <SelectItem key={pump} value={pump.toLowerCase().replace(/\s+/g, '-')}>
                {pump}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {pumpType && pumpType !== 'none' && specificPump && (
        <Select value={pumpHorsepower} onValueChange={onPumpHorsepowerChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select horsepower (HP)" />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-md z-50">
            {getHorsepowerOptions().map((hp) => (
              <SelectItem key={hp} value={hp.toLowerCase().replace(/\s+/g, '-')}>
                {hp}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};