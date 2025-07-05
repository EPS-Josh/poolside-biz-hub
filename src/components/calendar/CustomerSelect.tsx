
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

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
  const [open, setOpen] = useState(false);

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

  const selectedCustomer = customers.find(customer => customer.id === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="customer">Customer</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCustomer
              ? `${selectedCustomer.last_name}, ${selectedCustomer.first_name}${
                  selectedCustomer.address && selectedCustomer.city
                    ? ` - ${selectedCustomer.address}, ${selectedCustomer.city}`
                    : ''
                }`
              : "Select a customer (optional)"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search customers..." />
            <CommandList>
              <CommandEmpty>No customers found.</CommandEmpty>
              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={`${customer.last_name} ${customer.first_name} ${customer.address || ''} ${customer.city || ''} ${customer.state || ''}`.toLowerCase()}
                    onSelect={() => {
                      onChange(customer.id === value ? "" : customer.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === customer.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{customer.last_name}, {customer.first_name}</span>
                      {customer.address && customer.city && (
                        <span className="text-sm text-muted-foreground">
                          {customer.address}, {customer.city}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
