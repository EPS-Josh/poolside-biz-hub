
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ValveSelectorProps {
  label: string;
  manufacturer: string;
  specificValve: string;
  onManufacturerChange: (value: string) => void;
  onSpecificValveChange: (value: string) => void;
  valveData: { [manufacturer: string]: string[] };
}

export const ValveSelector = ({ 
  label, 
  manufacturer, 
  specificValve, 
  onManufacturerChange, 
  onSpecificValveChange,
  valveData 
}: ValveSelectorProps) => {
  const manufacturerOptions = [
    'Jandy',
    'Pentair',
    'Hayward',
    'Manual Valve',
    'None'
  ];

  const handleManufacturerChange = (value: string) => {
    onManufacturerChange(value);
    // Reset specific valve when manufacturer changes
    onSpecificValveChange('');
  };

  const getSpecificValveOptions = () => {
    if (manufacturer === 'Jandy' && valveData['Jandy']) {
      return valveData['Jandy'];
    }
    
    // Default options for other manufacturers
    switch (manufacturer) {
      case 'Pentair':
        return ['3-Way Valve', '2-Way Valve', 'Diverter Valve', 'Ball Valve'];
      case 'Hayward':
        return ['3-Way Valve', '2-Way Valve', 'Multiport Valve', 'Ball Valve'];
      case 'Manual Valve':
        return ['Ball Valve', 'Gate Valve', 'Butterfly Valve'];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={manufacturer} onValueChange={handleManufacturerChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select manufacturer" />
        </SelectTrigger>
        <SelectContent>
          {manufacturerOptions.map((option) => (
            <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, '-')}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {manufacturer && manufacturer !== 'none' && manufacturer !== 'manual-valve' && (
        <Select value={specificValve} onValueChange={onSpecificValveChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select specific valve" />
          </SelectTrigger>
          <SelectContent>
            {getSpecificValveOptions().map((valve) => (
              <SelectItem key={valve} value={valve.toLowerCase().replace(/\s+/g, '-')}>
                {valve}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};
