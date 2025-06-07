
import React from 'react';
import { BasicInfoCard } from './BasicInfoCard';
import { AddressInfoCard } from './AddressInfoCard';
import { BusinessDetailsCard } from './BusinessDetailsCard';
import { InsuranceInfoCard } from './InsuranceInfoCard';
import { ProductDataCard } from './ProductDataCard';

interface CompanyData {
  companyName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  website: string;
  taxId: string;
  licenseNumber: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
}

interface CompanyDataFormProps {
  companyData: CompanyData;
  isEditing: boolean;
  valveData: { [manufacturer: string]: string[] };
  onInputChange: (field: string, value: string) => void;
  onValveDataFetched: (valves: { [manufacturer: string]: string[] }) => void;
}

export const CompanyDataForm = ({ 
  companyData, 
  isEditing, 
  valveData, 
  onInputChange, 
  onValveDataFetched 
}: CompanyDataFormProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <BasicInfoCard 
        companyData={companyData} 
        isEditing={isEditing} 
        onInputChange={onInputChange} 
      />
      
      <AddressInfoCard 
        companyData={companyData} 
        isEditing={isEditing} 
        onInputChange={onInputChange} 
      />
      
      <BusinessDetailsCard 
        companyData={companyData} 
        isEditing={isEditing} 
        onInputChange={onInputChange} 
      />
      
      <InsuranceInfoCard 
        companyData={companyData} 
        isEditing={isEditing} 
        onInputChange={onInputChange} 
      />
      
      <ProductDataCard 
        valveData={valveData} 
        onValveDataFetched={onValveDataFetched} 
      />
    </div>
  );
};
