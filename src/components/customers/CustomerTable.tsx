
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Building, Mail, Phone, Pencil, MapPin, Shield, Trash2 } from 'lucide-react';

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
  pima_county_resident?: boolean;
  verification_status?: string;
  customer_user_id?: string;
}

interface CustomerTableProps {
  customers: Customer[];
  onCustomerClick: (customerId: string) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
}

export const CustomerTable = ({ customers, onCustomerClick, onEditCustomer, onDeleteCustomer }: CustomerTableProps) => {
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);
  const [deleteCustomerName, setDeleteCustomerName] = useState<string>('');

  const handleDeleteClick = (customer: Customer) => {
    setDeleteCustomerId(customer.id);
    setDeleteCustomerName(`${customer.first_name} ${customer.last_name}`);
  };

  const handleDeleteConfirm = () => {
    if (deleteCustomerId) {
      onDeleteCustomer(deleteCustomerId);
      setDeleteCustomerId(null);
      setDeleteCustomerName('');
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>First Name</TableHead>
          <TableHead>Last Name</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Pool Builder</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Added</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onCustomerClick(customer.id)}
                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                >
                  {customer.first_name}
                </button>
                {customer.pima_county_resident === false && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <MapPin className="h-3 w-3" />
                    Non-Pima
                  </Badge>
                )}
                {customer.customer_user_id && (
                  <Badge variant="default" className="gap-1 text-xs">
                    <Shield className="h-3 w-3" />
                    Portal
                  </Badge>
                )}
              </div>
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
              {customer.address && (
                <div className="text-sm">
                  {customer.address}
                </div>
              )}
            </TableCell>
            <TableCell>
              <div className="text-sm text-gray-600">
                {new Date(customer.created_at).toLocaleDateString()}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditCustomer(customer)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(customer)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>

  <AlertDialog open={!!deleteCustomerId} onOpenChange={(open) => !open && setDeleteCustomerId(null)}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete Customer</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete <strong>{deleteCustomerName}</strong>? This action cannot be undone and will remove all associated service records, photos, and documents.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</>
  );
};
