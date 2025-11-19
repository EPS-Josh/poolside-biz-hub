
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
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
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [weeklyFilter, setWeeklyFilter] = useState(false);
  const { customers, loading, fetchCustomers } = useCustomers(searchTerm);
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showEmailCampaign, setShowEmailCampaign] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Fetch weekly customer IDs when filter is active
  const { data: weeklyCustomerIds } = useQuery({
    queryKey: ['weekly-customer-ids'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('customer_id')
        .in('service_type', ['Weekly Pool Cleaning', 'Weekly Chemical Test'])
        .not('customer_id', 'is', null);

      if (error) throw error;
      
      // Get unique customer IDs
      const uniqueIds = [...new Set(data?.map(apt => apt.customer_id).filter(Boolean))];
      return uniqueIds as string[];
    },
    enabled: weeklyFilter,
  });

  // Filter customers based on weekly filter
  const filteredCustomers = weeklyFilter && weeklyCustomerIds
    ? customers.filter(customer => weeklyCustomerIds.includes(customer.id))
    : customers;

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

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;

      toast({
        title: 'Customer Deleted',
        description: 'Customer has been successfully deleted',
      });

      fetchCustomers();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete customer. You may need admin permissions.',
        variant: 'destructive',
      });
    }
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
        filterActive={weeklyFilter}
        onFilterToggle={() => setWeeklyFilter(!weeklyFilter)}
      />
      
      <CardContent>
        <CustomerSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Search by name, email, pool builder, or location..."
        />

        {filteredCustomers.length === 0 && !searchTerm && !weeklyFilter ? (
          <EmptyCustomerState
            onAddCustomer={handleAddCustomer}
            onBulkUpload={handleBulkUpload}
          />
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {weeklyFilter 
                ? "No weekly customers found" 
                : `No customers found matching "${searchTerm}"`}
            </p>
          </div>
        ) : isMobile ? (
          <div className="space-y-3">
            {filteredCustomers.map((customer) => (
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
            customers={filteredCustomers}
            onCustomerClick={handleCustomerClick}
            onEditCustomer={handleEditCustomer}
            onDeleteCustomer={handleDeleteCustomer}
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
            customers={filteredCustomers} 
            onClose={handleCloseEmailCampaign} 
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};
