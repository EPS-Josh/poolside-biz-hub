
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Mail, Phone, Pencil } from 'lucide-react';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  created_at: string;
}

interface CustomerCardProps {
  customer: Customer;
  onCustomerClick: (customerId: string) => void;
  onEditCustomer: (customer: Customer) => void;
}

export const CustomerCard = ({ customer, onCustomerClick, onEditCustomer }: CustomerCardProps) => (
  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onCustomerClick(customer.id)}>
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-lg">
            {customer.first_name} {customer.last_name}
          </h3>
          {customer.company && (
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <Building className="h-3 w-3 mr-1" />
              {customer.company}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEditCustomer(customer);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-1">
        {customer.email && (
          <div className="flex items-center text-sm">
            <Mail className="h-3 w-3 mr-2" />
            {customer.email}
          </div>
        )}
        {customer.phone && (
          <div className="flex items-center text-sm">
            <Phone className="h-3 w-3 mr-2" />
            {customer.phone}
          </div>
        )}
        {(customer.city || customer.state) && (
          <div className="text-sm text-gray-600">
            {customer.city && customer.state 
              ? `${customer.city}, ${customer.state}`
              : customer.city || customer.state
            }
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        Added: {new Date(customer.created_at).toLocaleDateString()}
      </div>
    </CardContent>
  </Card>
);
