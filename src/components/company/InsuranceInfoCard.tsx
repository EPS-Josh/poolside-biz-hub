
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Building } from 'lucide-react';

interface InsuranceInfoCardProps {
  companyData: {
    insuranceProvider: string;
    insurancePolicyNumber: string;
  };
  isEditing: boolean;
  onInputChange: (field: string, value: string) => void;
}

export const InsuranceInfoCard = ({ companyData, isEditing, onInputChange }: InsuranceInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building className="h-5 w-5" />
          <span>Insurance Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Insurance Provider
          </label>
          <Input
            value={companyData.insuranceProvider}
            onChange={(e) => onInputChange('insuranceProvider', e.target.value)}
            disabled={!isEditing}
            className={!isEditing ? 'bg-gray-50' : ''}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Policy Number
          </label>
          <Input
            value={companyData.insurancePolicyNumber}
            onChange={(e) => onInputChange('insurancePolicyNumber', e.target.value)}
            disabled={!isEditing}
            className={!isEditing ? 'bg-gray-50' : ''}
          />
        </div>
      </CardContent>
    </Card>
  );
};
