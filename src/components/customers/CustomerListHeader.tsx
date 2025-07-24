
import React from 'react';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Upload, Mail } from 'lucide-react';

interface CustomerListHeaderProps {
  isMobile: boolean;
  onAddCustomer: () => void;
  onBulkUpload: () => void;
  onEmailCampaign: () => void;
}

export const CustomerListHeader = ({ isMobile, onAddCustomer, onBulkUpload, onEmailCampaign }: CustomerListHeaderProps) => (
  <CardHeader className="flex flex-row items-center justify-between space-y-0">
    <CardTitle>Customers</CardTitle>
    <div className="flex gap-2">
      <Button variant="outline" onClick={onEmailCampaign} size={isMobile ? "sm" : "default"}>
        <Mail className="h-4 w-4 mr-2" />
        {isMobile ? "Email" : "Email Campaign"}
      </Button>
      <Button variant="outline" onClick={onBulkUpload} size={isMobile ? "sm" : "default"}>
        <Upload className="h-4 w-4 mr-2" />
        {isMobile ? "Upload" : "Bulk Upload"}
      </Button>
      <Button onClick={onAddCustomer} size={isMobile ? "sm" : "default"}>
        <Plus className="h-4 w-4 mr-2" />
        {isMobile ? "Add" : "Add Customer"}
      </Button>
    </div>
  </CardHeader>
);
