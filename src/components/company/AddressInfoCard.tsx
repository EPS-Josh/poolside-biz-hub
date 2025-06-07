
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

interface AddressInfoCardProps {
  companyData: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  isEditing: boolean;
  onInputChange: (field: string, value: string) => void;
}

export const AddressInfoCard = ({ companyData, isEditing, onInputChange }: AddressInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Address Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Street Address
          </label>
          <Input
            value={companyData.address}
            onChange={(e) => onInputChange('address', e.target.value)}
            disabled={!isEditing}
            className={!isEditing ? 'bg-gray-50' : ''}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <Input
              value={companyData.city}
              onChange={(e) => onInputChange('city', e.target.value)}
              disabled={!isEditing}
              className={!isEditing ? 'bg-gray-50' : ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <Input
              value={companyData.state}
              onChange={(e) => onInputChange('state', e.target.value)}
              disabled={!isEditing}
              className={!isEditing ? 'bg-gray-50' : ''}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ZIP Code
          </label>
          <Input
            value={companyData.zipCode}
            onChange={(e) => onInputChange('zipCode', e.target.value)}
            disabled={!isEditing}
            className={!isEditing ? 'bg-gray-50' : ''}
          />
        </div>
      </CardContent>
    </Card>
  );
};
