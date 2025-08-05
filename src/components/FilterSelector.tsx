import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterSelectorProps {
  label: string;
  filterType: string;
  specificFilter: string;
  onFilterTypeChange: (value: string) => void;
  onSpecificFilterChange: (value: string) => void;
  filterData: { [type: string]: string[] };
}

export const FilterSelector = ({ 
  label, 
  filterType, 
  specificFilter, 
  onFilterTypeChange, 
  onSpecificFilterChange,
  filterData 
}: FilterSelectorProps) => {
  const filterTypeOptions = [
    'Sand Filter',
    'Cartridge Filter',
    'DE Filter',
    'None'
  ];

  const handleFilterTypeChange = (value: string) => {
    onFilterTypeChange(value);
    // Reset specific filter when type changes
    onSpecificFilterChange('');
  };

  const getSpecificFilterOptions = () => {
    // Check if filter type is selected
    if (!filterType) {
      return [];
    }
    
    // Convert filter type from value format (lowercase-with-dashes) back to display format for lookup
    const displayFilterType = filterTypeOptions.find(
      opt => opt.toLowerCase().replace(/\s+/g, '-') === filterType
    );
    
    if (!displayFilterType) {
      return [];
    }
    
    // Check if we have scraped filter data
    if (filterData[displayFilterType] && filterData[displayFilterType].length > 0) {
      return filterData[displayFilterType];
    }
    
    // Default options for different filter types
    switch (displayFilterType) {
      case 'Sand Filter':
        return [
          'Pentair Sand Dollar',
          'Hayward Pro Series Sand',
          'Jandy JS Series',
          'Sta-Rite Cristal-Flo',
          'Pentair Tagelus',
          'Hayward Sand Master'
        ];
      case 'Cartridge Filter':
        return [
          'Pentair Clean & Clear',
          'Hayward Star-Clear',
          'Jandy CV Series',
          'Sta-Rite System:3',
          'Pentair FNS Plus',
          'Hayward SwimClear'
        ];
      case 'DE Filter':
        return [
          'Pentair FNS Plus DE',
          'Hayward Perflex',
          'Jandy DEV Series',
          'Sta-Rite System:3 DE',
          'Pentair Quad DE',
          'Hayward Pro-Grid'
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={filterType} onValueChange={handleFilterTypeChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select filter type" />
        </SelectTrigger>
        <SelectContent>
          {filterTypeOptions.map((option) => (
            <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, '-')}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {filterType && filterType !== 'none' && (
        <Select value={specificFilter} onValueChange={onSpecificFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select specific filter model" />
          </SelectTrigger>
          <SelectContent>
            {getSpecificFilterOptions().map((filter) => (
              <SelectItem key={filter} value={filter.toLowerCase().replace(/\s+/g, '-')}>
                {filter}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};