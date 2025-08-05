import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PumpSelectorProps {
  label: string;
  pumpType: string;
  specificPump: string;
  onPumpTypeChange: (value: string) => void;
  onSpecificPumpChange: (value: string) => void;
  pumpData: { [type: string]: string[] };
}

export const PumpSelector = ({ 
  label, 
  pumpType, 
  specificPump, 
  onPumpTypeChange, 
  onSpecificPumpChange,
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
    // Reset specific pump when type changes
    onSpecificPumpChange('');
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

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={pumpType} onValueChange={handlePumpTypeChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select pump type" />
        </SelectTrigger>
        <SelectContent>
          {pumpTypeOptions.map((option) => (
            <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, '-')}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {pumpType && pumpType !== 'none' && (
        <Select value={specificPump} onValueChange={onSpecificPumpChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select specific pump model" />
          </SelectTrigger>
          <SelectContent>
            {getSpecificPumpOptions().map((pump) => (
              <SelectItem key={pump} value={pump.toLowerCase().replace(/\s+/g, '-')}>
                {pump}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};