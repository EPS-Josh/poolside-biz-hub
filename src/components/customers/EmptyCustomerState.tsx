
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';

interface EmptyCustomerStateProps {
  onAddCustomer: () => void;
  onBulkUpload: () => void;
}

export const EmptyCustomerState = ({ onAddCustomer, onBulkUpload }: EmptyCustomerStateProps) => (
  <div className="text-center py-8">
    <p className="text-gray-500 mb-4">No customers found</p>
    <div className="flex gap-2 justify-center">
      <Button variant="outline" onClick={onBulkUpload}>
        <Upload className="h-4 w-4 mr-2" />
        Bulk Upload
      </Button>
      <Button onClick={onAddCustomer}>
        <Plus className="h-4 w-4 mr-2" />
        Add Your First Customer
      </Button>
    </div>
  </div>
);
