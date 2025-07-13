import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryItem {
  id: string;
  name: string | null;
  description: string | null;
  sku: string | null;
  fps_item_number: string | null;
  category: string | null;
  quantity_in_stock: number;
  unit_price: number | null;
  low_stock_threshold: number;
}

interface PartUsed {
  inventoryItemId: string;
  quantity: number;
  itemName: string;
  unitPrice: number | null;
}

interface PartsUsedSelectorProps {
  partsUsed: PartUsed[];
  onPartsUsedChange: (parts: PartUsed[]) => void;
}

export const PartsUsedSelector: React.FC<PartsUsedSelectorProps> = ({
  partsUsed,
  onPartsUsedChange
}) => {
  const [openComboboxes, setOpenComboboxes] = useState<{ [key: number]: boolean }>({});

  // Fetch inventory items
  const { data: inventoryItems = [], isLoading } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, name, description, sku, fps_item_number, category, quantity_in_stock, unit_price, low_stock_threshold')
        .order('description');
      
      if (error) throw error;
      console.log('Inventory items fetched:', data);
      return data as InventoryItem[];
    }
  });


  const addPartUsed = () => {
    const newPart: PartUsed = {
      inventoryItemId: '',
      quantity: 1,
      itemName: '',
      unitPrice: null
    };
    onPartsUsedChange([...partsUsed, newPart]);
  };

  const updatePartUsed = (index: number, field: keyof PartUsed, value: any) => {
    const updatedParts = [...partsUsed];
    if (field === 'inventoryItemId') {
      const selectedItem = inventoryItems.find(item => item.id === value);
      if (selectedItem) {
        updatedParts[index] = {
          ...updatedParts[index],
          inventoryItemId: value,
          itemName: selectedItem.name || selectedItem.description || '',
          unitPrice: selectedItem.unit_price
        };
      }
    } else {
      updatedParts[index] = { ...updatedParts[index], [field]: value };
    }
    onPartsUsedChange(updatedParts);
  };

  const removePartUsed = (index: number) => {
    const updatedParts = partsUsed.filter((_, i) => i !== index);
    onPartsUsedChange(updatedParts);
  };

  if (isLoading) {
    return <div>Loading inventory items...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          Parts Used
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPartUsed}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Part
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {partsUsed.length === 0 ? (
          <p className="text-sm text-muted-foreground">No parts selected. Click "Add Part" to add inventory items used.</p>
        ) : (
          partsUsed.map((part, index) => (
            <div key={index} className="flex items-end space-x-2 p-3 border rounded-lg">
              <div className="flex-1">
                <Label htmlFor={`part-${index}`}>Inventory Item</Label>
                <Popover open={openComboboxes[index]} onOpenChange={(open) => 
                  setOpenComboboxes(prev => ({ ...prev, [index]: open }))
                }>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openComboboxes[index]}
                      className="w-full justify-between"
                    >
                      {part.inventoryItemId
                        ? inventoryItems.find((item) => item.id === part.inventoryItemId)?.name || 
                          inventoryItems.find((item) => item.id === part.inventoryItemId)?.description ||
                          "Select item..."
                        : "Select item..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search inventory items..." />
                      <CommandList>
                        <CommandEmpty>No items found.</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-auto">
                          {inventoryItems.map((item) => (
                            <CommandItem
                              key={item.id}
                              value={`${item.name || ''} ${item.description || ''} ${item.sku || ''} ${item.fps_item_number || ''}`}
                              onSelect={() => {
                                updatePartUsed(index, 'inventoryItemId', item.id);
                                setOpenComboboxes(prev => ({ ...prev, [index]: false }));
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  part.inventoryItemId === item.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{item.name || item.description || 'Unnamed Item'}</span>
                                {item.fps_item_number && (
                                  <span className="text-xs text-muted-foreground">FPS #: {item.fps_item_number}</span>
                                )}
                                {item.sku && (
                                  <span className="text-xs text-muted-foreground">SKU: {item.sku}</span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  In Stock: {item.quantity_in_stock}
                                  {item.unit_price && ` • $${item.unit_price}`}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="w-24">
                <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                <Input
                  id={`quantity-${index}`}
                  type="number"
                  min="1"
                  value={part.quantity}
                  onChange={(e) => updatePartUsed(index, 'quantity', parseInt(e.target.value) || 1)}
                />
              </div>
              {part.unitPrice && (
                <div className="w-20 text-sm text-muted-foreground">
                  <Label>Total</Label>
                  <div className="mt-1 font-medium">
                    ${(part.unitPrice * part.quantity).toFixed(2)}
                  </div>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removePartUsed(index)}
                className="mb-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};