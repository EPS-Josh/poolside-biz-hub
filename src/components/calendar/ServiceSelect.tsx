
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SERVICES } from './constants';

interface ServiceSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const ServiceSelect: React.FC<ServiceSelectProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="service">Service *</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a service" />
        </SelectTrigger>
        <SelectContent>
          {SERVICES.map(service => (
            <SelectItem key={service} value={service}>
              {service}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
