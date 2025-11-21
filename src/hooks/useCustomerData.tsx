import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CustomerData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  company?: string;
  notes?: string;
  customer_user_id?: string;
  sms_opt_in?: boolean;
  sms_opt_in_date?: string;
  phone_verified?: boolean;
}

export const useCustomerData = () => {
  const { user } = useAuth();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCustomer(null);
      setLoading(false);
      return;
    }

    fetchCustomerData();
  }, [user]);

  const fetchCustomerData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('customer_user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      setCustomer(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching customer data:', err);
      setError('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const updateCustomerData = async (updates: Partial<CustomerData>) => {
    if (!customer) return { error: 'No customer data found' };

    try {
      const { error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', customer.id);

      if (error) throw error;

      await fetchCustomerData();
      return { error: null };
    } catch (err: any) {
      console.error('Error updating customer data:', err);
      return { error: err.message };
    }
  };

  return {
    customer,
    loading,
    error,
    refetch: fetchCustomerData,
    updateCustomer: updateCustomerData,
  };
};
