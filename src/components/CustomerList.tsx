
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CustomerForm } from '@/components/CustomerForm';
import { CustomerBulkUpload } from '@/components/CustomerBulkUpload';
import { CustomerCard } from '@/components/customers/CustomerCard';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { CustomerListHeader } from '@/components/customers/CustomerListHeader';
import { CustomerSearch } from '@/components/customers/CustomerSearch';
import { EmptyCustomerState } from '@/components/customers/EmptyCustomerState';
import { CustomerEmailCampaign } from '@/components/email/CustomerEmailCampaign';
import { useCustomers } from '@/hooks/useCustomers';
import { useIsMobile } from '@/hooks/use-mobile';

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
  customer_user_id?: string;
}

export const CustomerList = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const { customers, loading, fetchCustomers } = useCustomers(searchTerm);
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showEmailCampaign, setShowEmailCampaign] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const handleFormSuccess = () => {
    fetchCustomers();
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleBulkUpload = () => {
    setShowBulkUpload(true);
  };

  const handleEmailCampaign = () => {
    setShowEmailCampaign(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleCloseBulkUpload = () => {
    setShowBulkUpload(false);
  };

  const handleCloseEmailCampaign = () => {
    setShowEmailCampaign(false);
  };

  const handleCustomerClick = (customerId: string) => {
    navigate(`/customer/${customerId}`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div>Loading customers...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CustomerListHeader
        isMobile={isMobile}
        onAddCustomer={handleAddCustomer}
        onBulkUpload={handleBulkUpload}
        onEmailCampaign={handleEmailCampaign}
      />
      
      <CardContent>
        <CustomerSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Search by name, email, pool builder, or location..."
        />

        {customers.length === 0 && !searchTerm ? (
          <EmptyCustomerState
            onAddCustomer={handleAddCustomer}
            onBulkUpload={handleBulkUpload}
          />
        ) : customers.length === 0 && searchTerm ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No customers found matching "{searchTerm}"</p>
          </div>
        ) : isMobile ? (
          <div className="space-y-3">
            {customers.map((customer) => (
              <CustomerCard 
                key={customer.id} 
                customer={customer}
                onCustomerClick={handleCustomerClick}
                onEditCustomer={handleEditCustomer}
              />
            ))}
          </div>
        ) : (
          <CustomerTable 
            customers={customers}
            onCustomerClick={handleCustomerClick}
            onEditCustomer={handleEditCustomer}
          />
        )}
      </CardContent>

      <CustomerForm
        open={showForm}
        onOpenChange={handleCloseForm}
        onSuccess={handleFormSuccess}
        customer={editingCustomer}
      />

      <Dialog open={showBulkUpload} onOpenChange={handleCloseBulkUpload}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Upload Customers</DialogTitle>
            <DialogDescription>
              Upload multiple customers at once using a CSV file
            </DialogDescription>
          </DialogHeader>
          <CustomerBulkUpload onSuccess={handleFormSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={showEmailCampaign} onOpenChange={handleCloseEmailCampaign}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Campaign</DialogTitle>
            <DialogDescription>
              Send emails to your customers about offers and updates
            </DialogDescription>
          </DialogHeader>
          <CustomerEmailCampaign 
            customers={customers} 
            onClose={handleCloseEmailCampaign} 
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};
