import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Supplier {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  name: string | null;
  fps_item_number: string | null;
  item_number: string | null;
  description: string | null;
}

interface SupplierPrice {
  id: string;
  supplier_id: string;
  inventory_item_id: string;
  price: number;
  updated_at: string;
}

export default function SupplierPriceComparison() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name")
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
        .select("id, name, fps_item_number, item_number, description")
        .order("fps_item_number");
      
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  const { data: supplierPrices = [] } = useQuery({
    queryKey: ["supplier-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_prices")
        .select("*")
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data as SupplierPrice[];
    },
  });

  const pricesByItem = useMemo(() => {
    const grouped: Record<string, Record<string, { price: number; updated_at: string }>> = {};
    
    supplierPrices.forEach((sp) => {
      if (!grouped[sp.inventory_item_id]) {
        grouped[sp.inventory_item_id] = {};
      }
      
      // Keep only the most recent price for each supplier
      if (!grouped[sp.inventory_item_id][sp.supplier_id] ||
          new Date(sp.updated_at) > new Date(grouped[sp.inventory_item_id][sp.supplier_id].updated_at)) {
        grouped[sp.inventory_item_id][sp.supplier_id] = {
          price: sp.price,
          updated_at: sp.updated_at
        };
      }
    });
    
    return grouped;
  }, [supplierPrices]);

  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
      // Only show items that have at least one price
      if (!pricesByItem[item.id]) return false;
      
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        item.name?.toLowerCase().includes(search) ||
        item.fps_item_number?.toLowerCase().includes(search) ||
        item.item_number?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search)
      );
    });
  }, [inventoryItems, pricesByItem, searchTerm]);

  const getBestPrice = (itemId: string) => {
    const prices = pricesByItem[itemId];
    if (!prices) return null;
    
    let bestPrice = Infinity;
    let bestSupplierId = null;
    
    Object.entries(prices).forEach(([supplierId, data]) => {
      if (data.price < bestPrice) {
        bestPrice = data.price;
        bestSupplierId = supplierId;
      }
    });
    
    return { price: bestPrice, supplierId: bestSupplierId };
  };

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
              <h1 className="text-3xl font-bold">Price Comparison</h1>
              <p className="text-muted-foreground">Compare supplier prices across your inventory</p>
            </div>
          </div>
          <Button onClick={() => navigate("/inventory/price-entry")}>
            Update Prices
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Inventory</CardTitle>
            <CardDescription>Find and compare prices across all suppliers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by item name, FPS#, MFG#..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {suppliers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No active suppliers found</p>
              <Button onClick={() => navigate("/inventory/suppliers")}>
                Manage Suppliers
              </Button>
            </CardContent>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? "No items match your search" : "No prices available yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Price Comparison Table</CardTitle>
              <CardDescription>
                Showing {filteredItems.length} items with pricing data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Item</TableHead>
                      <TableHead>FPS #</TableHead>
                      {suppliers.map((supplier) => (
                        <TableHead key={supplier.id} className="text-right">
                          {supplier.name}
                        </TableHead>
                      ))}
                      <TableHead className="text-right">Best Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const bestPrice = getBestPrice(item.id);
                      const itemPrices = pricesByItem[item.id] || {};
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p>{item.name || "Unnamed Item"}</p>
                              {item.item_number && (
                                <p className="text-sm text-muted-foreground">MFG: {item.item_number}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.fps_item_number || "-"}
                          </TableCell>
                          {suppliers.map((supplier) => {
                            const priceData = itemPrices[supplier.id];
                            const isBest = bestPrice?.supplierId === supplier.id;
                            
                            return (
                              <TableCell key={supplier.id} className="text-right">
                                {priceData ? (
                                  <div className="flex flex-col items-end">
                                    <span className={isBest ? "font-bold text-green-600" : ""}>
                                      ${priceData.price.toFixed(2)}
                                    </span>
                                    {isBest && (
                                      <Badge variant="default" className="mt-1">
                                        <TrendingDown className="h-3 w-3 mr-1" />
                                        Best
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-right font-bold">
                            {bestPrice ? (
                              <span className="text-green-600">
                                ${bestPrice.price.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
