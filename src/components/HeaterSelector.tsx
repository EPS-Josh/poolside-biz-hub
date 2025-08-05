import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HeaterSelectorProps {
  label: string;
  heaterType: string;
  specificHeater: string;
  onHeaterTypeChange: (value: string) => void;
  onSpecificHeaterChange: (value: string) => void;
  heaterData: { [type: string]: string[] };
}

export const HeaterSelector = ({ 
  label, 
  heaterType, 
  specificHeater, 
  onHeaterTypeChange, 
  onSpecificHeaterChange,
  heaterData 
}: HeaterSelectorProps) => {
  const heaterTypeOptions = [
    'Gas Heater',
    'Electric Heater',
    'Heat Pump',
    'Solar Heater',
    'None'
  ];

  const handleHeaterTypeChange = (value: string) => {
    onHeaterTypeChange(value);
    // Reset specific heater when type changes
    onSpecificHeaterChange('');
  };

  const getSpecificHeaterOptions = () => {
    // Check if heater type is selected
    if (!heaterType) {
      return [];
    }
    
    // Convert heater type from value format (lowercase-with-dashes) back to display format for lookup
    const displayHeaterType = heaterTypeOptions.find(
      opt => opt.toLowerCase().replace(/\s+/g, '-') === heaterType
    );
    
    if (!displayHeaterType) {
      return [];
    }
    
    // Check if we have scraped heater data
    if (heaterData[displayHeaterType] && heaterData[displayHeaterType].length > 0) {
      return heaterData[displayHeaterType];
    }
    
    // Default options for different heater types
    switch (displayHeaterType) {
      case 'Gas Heater':
        return [
          'Pentair MasterTemp',
          'Hayward H-Series',
          'Jandy LXi Series',
          'Raypak Digital',
          'Pentair UltraTemp',
          'Hayward Universal H-Series'
        ];
      case 'Heat Pump':
        return [
          'Pentair UltraTemp Heat Pump',
          'Hayward HeatPro',
          'Jandy EnergyGuard',
          'Raypak Heat Pump',
          'AquaCal Heat Wave',
          'Pentair ThermalFlo'
        ];
      case 'Electric Heater':
        return [
          'Pentair Electric Spa Heater',
          'Hayward CSPAXI Electric',
          'Watkins Electric Heater',
          'Balboa Electric Heater'
        ];
      case 'Solar Heater':
        return [
          'Pentair SolarTouch',
          'Hayward Solar Panels',
          'FAFCO Solar Systems',
          'SunGrabber Solar Panels',
          'Heliocol Solar Panels'
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={heaterType} onValueChange={handleHeaterTypeChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select heater type" />
        </SelectTrigger>
        <SelectContent>
          {heaterTypeOptions.map((option) => (
            <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, '-')}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {heaterType && heaterType !== 'none' && (
        <Select value={specificHeater} onValueChange={onSpecificHeaterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select specific heater model" />
          </SelectTrigger>
          <SelectContent>
            {getSpecificHeaterOptions().map((heater) => (
              <SelectItem key={heater} value={heater.toLowerCase().replace(/\s+/g, '-')}>
                {heater}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};