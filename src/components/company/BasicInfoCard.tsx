
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Building } from 'lucide-react';

interface BasicInfoCardProps {
  companyData: {
    companyName: string;
    email: string;
    phone: string;
    website: string;
  };
  isEditing: boolean;
  onInputChange: (field: string, value: string) => void;
}

export const BasicInfoCard = ({ companyData, isEditing, onInputChange }: BasicInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building className="h-5 w-5" />
          <span>Basic Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name
          </label>
          <Input
            value={companyData.companyName}
            onChange={(e) => onInputChange('companyName', e.target.value)}
            disabled={!isEditing}
            className={!isEditing ? 'bg-gray-50' : ''}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <Input
            type="email"
            value={companyData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            disabled={!isEditing}
            className={!isEditing ? 'bg-gray-50' : ''}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <Input
            value={companyData.phone}
            onChange={(e) => onInputChange('phone', e.target.value)}
            disabled={!isEditing}
            className={!isEditing ? 'bg-gray-50' : ''}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Website
          </label>
          <Input
            value={companyData.website}
            onChange={(e) => onInputChange('website', e.target.value)}
            disabled={!isEditing}
            className={!isEditing ? 'bg-gray-50' : ''}
          />
        </div>
      </CardContent>
    </Card>
  );
};
