
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Globe } from 'lucide-react';

interface BusinessDetailsCardProps {
  companyData: {
    taxId: string;
    licenseNumber: string;
  };
  isEditing: boolean;
  onInputChange: (field: string, value: string) => void;
}

export const BusinessDetailsCard = ({ companyData, isEditing, onInputChange }: BusinessDetailsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Globe className="h-5 w-5" />
          <span>Business Details</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tax ID / EIN
          </label>
          <Input
            value={companyData.taxId}
            onChange={(e) => onInputChange('taxId', e.target.value)}
            disabled={!isEditing}
            className={!isEditing ? 'bg-gray-50' : ''}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business License Number
          </label>
          <Input
            value={companyData.licenseNumber}
            onChange={(e) => onInputChange('licenseNumber', e.target.value)}
            disabled={!isEditing}
            className={!isEditing ? 'bg-gray-50' : ''}
          />
        </div>
      </CardContent>
    </Card>
  );
};
