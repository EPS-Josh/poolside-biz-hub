
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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

export const useCustomers = (searchTerm: string = '') => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCustomers = async () => {
    if (!user) return;

    console.log('Fetching customers for user:', user.id, user.email);

    try {
      // Fetch all customers without any limit using range
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true })
        .range(0, 9999); // Use range to get up to 10,000 records

      if (error) {
        throw error;
      }

      console.log('Customers data received:', data);
      console.log('Number of customers found:', data?.length || 0);
      console.log('First customer:', data?.[0]);
      console.log('Last customer:', data?.[data.length - 1]);

      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) {
      return customers;
    }

    const lowercaseSearch = searchTerm.toLowerCase();
    return customers.filter(customer => {
      const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
      const email = customer.email?.toLowerCase() || '';
      const company = customer.company?.toLowerCase() || '';
      const city = customer.city?.toLowerCase() || '';
      const state = customer.state?.toLowerCase() || '';
      const phone = customer.phone?.toLowerCase() || '';

      return (
        fullName.includes(lowercaseSearch) ||
        email.includes(lowercaseSearch) ||
        company.includes(lowercaseSearch) ||
        city.includes(lowercaseSearch) ||
        state.includes(lowercaseSearch) ||
        phone.includes(lowercaseSearch)
      );
    });
  }, [customers, searchTerm]);

  return {
    customers: filteredCustomers,
    loading,
    fetchCustomers,
  };
};
