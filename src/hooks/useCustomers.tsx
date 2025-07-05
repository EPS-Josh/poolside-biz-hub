
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

    console.log('useCustomers: Fetching all customers for user:', user.id, user.email);

    try {
      setLoading(true);
      
      // Fetch all customers in batches to avoid Supabase limits
      let allCustomers: Customer[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error, count } = await supabase
          .from('customers')
          .select('*', { count: 'exact' })
          .order('last_name', { ascending: true })
          .order('first_name', { ascending: true })
          .range(from, from + batchSize - 1);

        if (error) {
          throw error;
        }

        if (data) {
          allCustomers = [...allCustomers, ...data];
          console.log(`useCustomers: Fetched batch ${from}-${from + data.length - 1}, total so far: ${allCustomers.length}`);
        }

        // Check if we've fetched all records
        hasMore = data && data.length === batchSize && allCustomers.length < (count || 0);
        from += batchSize;
      }

      console.log('useCustomers: Total customers found:', allCustomers.length);
      setCustomers(allCustomers);
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
