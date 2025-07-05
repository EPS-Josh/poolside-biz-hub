
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
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
      // Fetch ALL customers by removing any limits or range restrictions
      let allCustomers = [];
      let from = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from('customers')
          .select('id, first_name, last_name, address, city, state')
          .order('last_name', { ascending: true })
          .order('first_name', { ascending: true })
          .range(from, from + pageSize - 1);
        
        if (error) {
          console.error('Error fetching customers:', error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          break;
        }
        
        allCustomers = [...allCustomers, ...data];
        
        // If we got less than pageSize, we've reached the end
        if (data.length < pageSize) {
          break;
        }
        
        from += pageSize;
      }
      
      console.log('CustomerSelect: Total customers found:', allCustomers.length);
      console.log('CustomerSelect: First customer:', allCustomers[0]);
      console.log('CustomerSelect: Last customer:', allCustomers[allCustomers.length - 1]);
      
      return allCustomers;
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
        <SelectContent className="max-h-[400px]">
          <ScrollArea className="h-[380px] w-full">
            {customers.map(customer => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.last_name}, {customer.first_name} - {customer.address}, {customer.city}
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
};
