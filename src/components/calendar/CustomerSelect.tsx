
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  address?: string;
  city?: string;
  state?: string;
}

interface CustomerSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const CustomerSelect: React.FC<CustomerSelectProps> = ({ value, onChange }) => {
  const { user } = useAuth();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      // Explicitly set a high limit to ensure we get all customers
      const { data, error, count } = await supabase
        .from('customers')
        .select('id, first_name, last_name, address, city, state', { count: 'exact' })
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true })
        .limit(10000); // Set a high limit to ensure we get all customers
      
      if (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }
      
      console.log('CustomerSelect: Total customers found:', data?.length || 0);
      console.log('CustomerSelect: Total customer count from DB:', count);
      
      return data || [];
    },
    enabled: !!user
  });

  return (
    <div className="space-y-2">
      <Label htmlFor="customer">Customer</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a customer (optional)" />
        </SelectTrigger>
        <SelectContent className="max-h-[400px] overflow-y-auto">
          {customers.map(customer => (
            <SelectItem key={customer.id} value={customer.id}>
              {customer.last_name}, {customer.first_name} - {customer.address}, {customer.city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
