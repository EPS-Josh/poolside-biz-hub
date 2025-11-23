import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Supplier {
  id: string;
  name: string;
  last_price_update: string | null;
}

interface InventoryItem {
  id: string;
  name: string | null;
  fps_item_number: string | null;
  item_number: string | null;
  sku: string | null;
  description: string | null;
}

interface PriceEntry {
  itemId: string;
  price: string;
}

export default function SupplierPriceEntry() {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [priceEntries, setPriceEntries] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name, last_price_update")
        .eq("is_active", true)
        .order("display_order")
        .order("name");
      
      if (error) throw error;
      return data as Supplier[];
    },
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ["inventory-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, fps_item_number, item_number, sku, description")
        .order("fps_item_number");
      
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  const savePricesMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const entries = Object.entries(priceEntries)
        .filter(([_, price]) => price && price.trim() !== "")
        .map(([itemId, price]) => ({
          user_id: user.id,
          supplier_id: selectedSupplierId,
          inventory_item_id: itemId,
          price: parseFloat(price),
        }));

      if (entries.length === 0) {
        throw new Error("No prices to save");
      }

      const { error } = await supabase
        .from("supplier_prices")
        .insert(entries);

      if (error) throw error;

      // Update supplier's last_price_update
      await supabase
        .from("suppliers")
        .update({ last_price_update: new Date().toISOString() })
        .eq("id", selectedSupplierId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-prices"] });
      setPriceEntries({});
      toast({
        title: "Success",
        description: `Saved ${Object.keys(priceEntries).length} price updates`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save prices",
        variant: "destructive",
      });
    },
  });

  const handlePriceChange = (itemId: string, price: string) => {
    setPriceEntries(prev => ({
      ...prev,
      [itemId]: price
    }));
  };

  const handleSave = () => {
    if (!selectedSupplierId) {
      toast({
        title: "Error",
        description: "Please select a supplier",
        variant: "destructive",
      });
      return;
    }
    savePricesMutation.mutate();
  };

  const filteredItems = inventoryItems.filter(item => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.name?.toLowerCase().includes(search) ||
      item.fps_item_number?.toLowerCase().includes(search) ||
      item.item_number?.toLowerCase().includes(search) ||
      item.sku?.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search)
    );
  });

  const updatedItemsCount = Object.keys(priceEntries).filter(key => priceEntries[key]).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/inventory/suppliers")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Quick Price Entry</h1>
              <p className="text-muted-foreground">Update supplier prices for your inventory</p>
            </div>
          </div>
          {updatedItemsCount > 0 && (
            <Button onClick={handleSave} disabled={savePricesMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              Save {updatedItemsCount} Price{updatedItemsCount !== 1 ? 's' : ''}
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Supplier</CardTitle>
            <CardDescription>Choose which supplier's prices you want to update</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                    {supplier.last_price_update && (
                      <span className="text-muted-foreground text-sm ml-2">
                        (Last updated: {new Date(supplier.last_price_update).toLocaleDateString()})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSupplierId && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {selectedSupplierId && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inventory Items</CardTitle>
                  <CardDescription>Enter prices for items that have changed</CardDescription>
                </div>
                {updatedItemsCount > 0 && (
                  <Badge variant="secondary">{updatedItemsCount} items updated</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchTerm ? "No items match your search" : "No inventory items found"}
                  </p>
                ) : (
                  filteredItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name || "Unnamed Item"}</p>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          {item.fps_item_number && <span>FPS: {item.fps_item_number}</span>}
                          {item.item_number && <span>MFG: {item.item_number}</span>}
                          {item.sku && <span>SKU: {item.sku}</span>}
                        </div>
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="$0.00"
                          value={priceEntries[item.id] || ""}
                          onChange={(e) => handlePriceChange(item.id, e.target.value)}
                          className="text-right"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
