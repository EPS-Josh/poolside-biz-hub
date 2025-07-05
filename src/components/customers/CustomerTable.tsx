
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface CustomerTableProps {
  customers: Customer[];
  onCustomerClick: (customerId: string) => void;
  onEditCustomer: (customer: Customer) => void;
}

export const CustomerTable = ({ customers, onCustomerClick, onEditCustomer }: CustomerTableProps) => (
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>First Name</TableHead>
          <TableHead>Last Name</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Added</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell>
              <button
                onClick={() => onCustomerClick(customer.id)}
                className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
              >
                {customer.first_name}
              </button>
            </TableCell>
            <TableCell>
              <button
                onClick={() => onCustomerClick(customer.id)}
                className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
              >
                {customer.last_name}
              </button>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="flex items-center text-sm">
                  <Mail className="h-3 w-3 mr-1" />
                  {customer.email}
                </div>
                {customer.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-3 w-3 mr-1" />
                    {customer.phone}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              {customer.company && (
                <div className="flex items-center text-sm">
                  <Building className="h-3 w-3 mr-1" />
                  {customer.company}
                </div>
              )}
            </TableCell>
            <TableCell>
              {(customer.city || customer.state) && (
                <div className="text-sm">
                  {customer.city && customer.state 
                    ? `${customer.city}, ${customer.state}`
                    : customer.city || customer.state
                  }
                </div>
              )}
            </TableCell>
            <TableCell>
              <div className="text-sm text-gray-600">
                {new Date(customer.created_at).toLocaleDateString()}
              </div>
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditCustomer(customer)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
