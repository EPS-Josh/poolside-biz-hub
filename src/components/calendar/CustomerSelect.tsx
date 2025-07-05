
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
    queryKey: ['customers-all'],
    queryFn: async () => {
      console.log('CustomerSelect: Fetching all customers...');
      
      const { data, error, count } = await supabase
        .from('customers')
        .select('id, first_name, last_name, address, city, state', { count: 'exact' })
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });
      
      if (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }
      
      console.log('CustomerSelect: Total customers found:', count);
      console.log('CustomerSelect: Customers data:', data?.length || 0, 'records');
      
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
        <SelectContent className="max-h-[300px] w-full">
          <ScrollArea className="h-[280px] w-full">
            {customers.map(customer => (
              <SelectItem key={customer.id} value={customer.id} className="w-full">
                <div className="w-full truncate">
                  {customer.last_name}, {customer.first_name}
                  {customer.address && customer.city && (
                    <span className="text-sm text-muted-foreground ml-2">
                      - {customer.address}, {customer.city}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
            {customers.length === 0 && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No customers found
              </div>
            )}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
};
