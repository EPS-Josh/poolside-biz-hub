
import React, { useState, useEffect, useRef } from 'react';
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
  const commandListRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-select'],
    queryFn: async () => {
      console.log('CustomerSelect: Fetching all customers...');
      
      // Fetch all customers in batches to avoid Supabase limits
      let allCustomers: Customer[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error, count } = await supabase
          .from('customers')
          .select('id, first_name, last_name, address, city, state', { count: 'exact' })
          .order('last_name', { ascending: true })
          .order('first_name', { ascending: true })
          .range(from, from + batchSize - 1);
        
        if (error) {
          console.error('Error fetching customers batch:', error);
          throw error;
        }
        
        if (data) {
          allCustomers = [...allCustomers, ...data];
          console.log(`CustomerSelect: Fetched batch ${from}-${from + data.length - 1}, total so far: ${allCustomers.length}`);
        }
        
        // Check if we've fetched all records
        hasMore = data && data.length === batchSize && allCustomers.length < (count || 0);
        from += batchSize;
      }
      
      console.log('CustomerSelect: Total customers fetched:', allCustomers.length);
      return allCustomers;
    },
    enabled: !!user
  });

  const selectedCustomer = customers.find(customer => customer.id === value);

  // Reset scroll position when popover opens
  useEffect(() => {
    if (open && commandListRef.current) {
      const el = commandListRef.current;
      requestAnimationFrame(() => {
        el.scrollTop = 0;
      });
    }
  }, [open, search]);

  return (
    <div className="space-y-2">
      <Label htmlFor="customer">Customer</Label>
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(''); }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCustomer
              ? `${selectedCustomer.last_name}, ${selectedCustomer.first_name}`
              : "Select a customer (optional)"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command value={search} onValueChange={setSearch}>
            <CommandInput placeholder="Search by last name..." />
            <CommandList ref={commandListRef} className="max-h-[200px] overflow-y-auto">
              <CommandEmpty>No customers found.</CommandEmpty>
              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.last_name.toLowerCase()}
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
                    <div className="flex flex-col w-full">
                      <span className="font-medium">{customer.last_name}, {customer.first_name}</span>
                      {customer.address && customer.city && (
                        <span className="text-xs text-muted-foreground mt-1 pl-0">
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
      
      {/* Show selected customer address in a separate box */}
      {selectedCustomer && selectedCustomer.address && selectedCustomer.city && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded border">
          <strong>Property Address:</strong> {selectedCustomer.address}, {selectedCustomer.city}
          {selectedCustomer.state && `, ${selectedCustomer.state}`}
        </div>
      )}
    </div>
  );
};
