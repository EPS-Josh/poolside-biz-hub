import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import InventoryBulkUpload from "@/components/InventoryBulkUpload";

interface InventoryItem {
  id: string;
  name: string | null;
  description: string | null;
  sku: string | null;
  category: string | null;
  quantity_in_stock: number;
  unit_price: number | null;
  cost_price: number | null;
  low_stock_threshold: number;
  item_number: string | null;
  solution: string | null;
  type: string | null;
  pieces_per_part: number | null;
  min_order_qty: number | null;
  item_status: string | null;
  list_price: number | null;
  upc: string | null;
  superseded_item: string | null;
  pieces_per_case: number | null;
  pieces_per_pallet: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  created_at: string;
  updated_at: string;
}

const Inventory = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventoryItems = [], isLoading } = useQuery({
    queryKey: ["inventory-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("inventory_items").insert({
        user_id: user.id,
        item_number: formData.get("itemNumber") as string || null,
        name: formData.get("name") as string || null,
        description: formData.get("description") as string || null,
        solution: formData.get("solution") as string || null,
        type: formData.get("type") as string || null,
        pieces_per_part: parseInt(formData.get("piecesPerPart") as string) || null,
        min_order_qty: parseInt(formData.get("minOrderQty") as string) || null,
        item_status: formData.get("itemStatus") as string || null,
        list_price: parseFloat(formData.get("listPrice") as string) || null,
        upc: formData.get("upc") as string || null,
        superseded_item: formData.get("supersededItem") as string || null,
        pieces_per_case: parseInt(formData.get("piecesPerCase") as string) || null,
        pieces_per_pallet: parseInt(formData.get("piecesPerPallet") as string) || null,
        length: parseFloat(formData.get("length") as string) || null,
        width: parseFloat(formData.get("width") as string) || null,
        height: parseFloat(formData.get("height") as string) || null,
        weight: parseFloat(formData.get("weight") as string) || null,
        sku: formData.get("sku") as string || null,
        category: formData.get("category") as string || null,
        quantity_in_stock: parseInt(formData.get("quantity") as string) || 0,
        unit_price: parseFloat(formData.get("unitPrice") as string) || null,
        cost_price: parseFloat(formData.get("costPrice") as string) || null,
        low_stock_threshold: parseInt(formData.get("lowStockThreshold") as string) || 10,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Inventory item added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add inventory item",
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const { error } = await supabase.from("inventory_items").update({
        item_number: formData.get("itemNumber") as string || null,
        name: formData.get("name") as string || null,
        description: formData.get("description") as string || null,
        solution: formData.get("solution") as string || null,
        type: formData.get("type") as string || null,
        pieces_per_part: parseInt(formData.get("piecesPerPart") as string) || null,
        min_order_qty: parseInt(formData.get("minOrderQty") as string) || null,
        item_status: formData.get("itemStatus") as string || null,
        list_price: parseFloat(formData.get("listPrice") as string) || null,
        upc: formData.get("upc") as string || null,
        superseded_item: formData.get("supersededItem") as string || null,
        pieces_per_case: parseInt(formData.get("piecesPerCase") as string) || null,
        pieces_per_pallet: parseInt(formData.get("piecesPerPallet") as string) || null,
        length: parseFloat(formData.get("length") as string) || null,
        width: parseFloat(formData.get("width") as string) || null,
        height: parseFloat(formData.get("height") as string) || null,
        weight: parseFloat(formData.get("weight") as string) || null,
        sku: formData.get("sku") as string || null,
        category: formData.get("category") as string || null,
        quantity_in_stock: parseInt(formData.get("quantity") as string) || 0,
        unit_price: parseFloat(formData.get("unitPrice") as string) || null,
        cost_price: parseFloat(formData.get("costPrice") as string) || null,
        low_stock_threshold: parseInt(formData.get("lowStockThreshold") as string) || 10,
      }).eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      setEditingItem(null);
      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update inventory item",
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      });
    },
  });

  const deleteAllItemsMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("user_id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      toast({
        title: "Success",
        description: "All inventory items deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete inventory items",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>, isEdit: boolean = false) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (isEdit && editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, formData });
    } else {
      addItemMutation.mutate(formData);
    }
  };

  const filteredItems = inventoryItems.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity_in_stock === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (item.quantity_in_stock <= item.low_stock_threshold) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  const ItemForm = ({ item }: { item?: InventoryItem }) => (
    <form onSubmit={(e) => handleSubmit(e, !!item)} className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="itemNumber">Item #</Label>
            <Input
              id="itemNumber"
              name="itemNumber"
              defaultValue={item?.item_number || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="upc">UPC</Label>
            <Input
              id="upc"
              name="upc"
              defaultValue={item?.upc || ""}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={item?.description || ""}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="solution">Solution</Label>
            <Input
              id="solution"
              name="solution"
              defaultValue={item?.solution || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Input
              id="type"
              name="type"
              defaultValue={item?.type || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="itemStatus">Item Status</Label>
            <Input
              id="itemStatus"
              name="itemStatus"
              defaultValue={item?.item_status || ""}
            />
          </div>
        </div>
      </div>

      {/* Legacy Fields */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Legacy Fields</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={item?.name || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              name="sku"
              defaultValue={item?.sku || ""}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            defaultValue={item?.category || ""}
          />
        </div>
      </div>

      {/* Quantities & Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Quantities & Pricing</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="piecesPerPart">Pieces per Part</Label>
            <Input
              id="piecesPerPart"
              name="piecesPerPart"
              type="number"
              min="0"
              defaultValue={item?.pieces_per_part || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minOrderQty">Min Order Qty</Label>
            <Input
              id="minOrderQty"
              name="minOrderQty"
              type="number"
              min="0"
              defaultValue={item?.min_order_qty || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity in Stock</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="0"
              defaultValue={item?.quantity_in_stock || 0}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="piecesPerCase">Pieces per Case</Label>
            <Input
              id="piecesPerCase"
              name="piecesPerCase"
              type="number"
              min="0"
              defaultValue={item?.pieces_per_case || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="piecesPerPallet">Pieces per Pallet</Label>
            <Input
              id="piecesPerPallet"
              name="piecesPerPallet"
              type="number"
              min="0"
              defaultValue={item?.pieces_per_pallet || ""}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="listPrice">List Price</Label>
            <Input
              id="listPrice"
              name="listPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={item?.list_price || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitPrice">Unit Price</Label>
            <Input
              id="unitPrice"
              name="unitPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={item?.unit_price || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="costPrice">Cost Price</Label>
            <Input
              id="costPrice"
              name="costPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={item?.cost_price || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lowStockThreshold">Low Stock Alert</Label>
            <Input
              id="lowStockThreshold"
              name="lowStockThreshold"
              type="number"
              min="0"
              defaultValue={item?.low_stock_threshold || 10}
            />
          </div>
        </div>
      </div>

      {/* Physical Properties */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Physical Properties</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="length">Length</Label>
            <Input
              id="length"
              name="length"
              type="number"
              step="0.01"
              min="0"
              defaultValue={item?.length || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="width">Width</Label>
            <Input
              id="width"
              name="width"
              type="number"
              step="0.01"
              min="0"
              defaultValue={item?.width || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height</Label>
            <Input
              id="height"
              name="height"
              type="number"
              step="0.01"
              min="0"
              defaultValue={item?.height || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">Weight</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              step="0.01"
              min="0"
              defaultValue={item?.weight || ""}
            />
          </div>
        </div>
      </div>

      {/* Other */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Other</h3>
        <div className="space-y-2">
          <Label htmlFor="supersededItem">Superseded Item</Label>
          <Input
            id="supersededItem"
            name="supersededItem"
            defaultValue={item?.superseded_item || ""}
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => {
          setIsAddDialogOpen(false);
          setEditingItem(null);
        }}>
          Cancel
        </Button>
        <Button type="submit">
          {item ? "Update" : "Add"} Item
        </Button>
      </div>
    </form>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
              <p className="text-muted-foreground">Track and manage your inventory items</p>
            </div>
            <div className="flex space-x-2">
              {inventoryItems.length > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={() => deleteAllItemsMutation.mutate()}
                  disabled={deleteAllItemsMutation.isPending}
                >
                  {deleteAllItemsMutation.isPending ? "Clearing..." : "Clear All"}
                </Button>
              )}
              <InventoryBulkUpload />
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>Add New Inventory Item</DialogTitle>
                  </DialogHeader>
                  <ItemForm />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Inventory Items ({filteredItems.length})
                </CardTitle>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading inventory...</div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No inventory items found. Add your first item to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const stockStatus = getStockStatus(item);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.sku || "-"}</TableCell>
                          <TableCell>{item.category || "-"}</TableCell>
                          <TableCell>{item.quantity_in_stock}</TableCell>
                          <TableCell>
                            {item.unit_price ? `$${item.unit_price.toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingItem(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteItemMutation.mutate(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
            </DialogHeader>
            {editingItem && <ItemForm item={editingItem} />}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
};

export default Inventory;