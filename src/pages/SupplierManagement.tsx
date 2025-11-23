import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Building2, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  notes: string | null;
  last_price_update: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function SupplierManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("display_order")
        .order("name");
      
      if (error) throw error;
      return data as Supplier[];
    },
  });

  const addSupplierMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("suppliers").insert({
        user_id: user.id,
        name: formData.get("name") as string,
        contact_name: formData.get("contactName") as string || null,
        contact_email: formData.get("contactEmail") as string || null,
        contact_phone: formData.get("contactPhone") as string || null,
        website: formData.get("website") as string || null,
        notes: formData.get("notes") as string || null,
        display_order: parseInt(formData.get("displayOrder") as string) || 0,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Supplier added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add supplier",
        variant: "destructive",
      });
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const { error } = await supabase.from("suppliers").update({
        name: formData.get("name") as string,
        contact_name: formData.get("contactName") as string || null,
        contact_email: formData.get("contactEmail") as string || null,
        contact_phone: formData.get("contactPhone") as string || null,
        website: formData.get("website") as string || null,
        notes: formData.get("notes") as string || null,
        display_order: parseInt(formData.get("displayOrder") as string) || 0,
      }).eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setEditingSupplier(null);
      toast({
        title: "Success",
        description: "Supplier updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update supplier",
        variant: "destructive",
      });
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete supplier",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>, isEdit: boolean = false) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (isEdit && editingSupplier) {
      updateSupplierMutation.mutate({ id: editingSupplier.id, formData });
    } else {
      addSupplierMutation.mutate(formData);
    }
  };

  const SupplierForm = ({ supplier }: { supplier?: Supplier }) => (
    <form onSubmit={(e) => handleSubmit(e, !!supplier)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Supplier Name *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={supplier?.name || ""}
          required
          placeholder="e.g. Best Pool Supply"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactName">Contact Name</Label>
          <Input
            id="contactName"
            name="contactName"
            defaultValue={supplier?.contact_name || ""}
            placeholder="John Doe"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="displayOrder">Display Order</Label>
          <Input
            id="displayOrder"
            name="displayOrder"
            type="number"
            defaultValue={supplier?.display_order || 0}
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={supplier?.contact_email || ""}
            placeholder="john@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Contact Phone</Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            defaultValue={supplier?.contact_phone || ""}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          name="website"
          defaultValue={supplier?.website || ""}
          placeholder="https://example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={supplier?.notes || ""}
          placeholder="Any special ordering instructions, minimum quantities, etc."
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full">
        {supplier ? "Update Supplier" : "Add Supplier"}
      </Button>
    </form>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Supplier Management</h1>
            <p className="text-muted-foreground">Manage your supplier contacts and information</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/inventory/price-entry")} variant="outline">
              <DollarSign className="mr-2 h-4 w-4" />
              Update Prices
            </Button>
            <Button onClick={() => navigate("/inventory/price-comparison")} variant="outline">
              Price Comparison
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Supplier</DialogTitle>
                </DialogHeader>
                <SupplierForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Loading suppliers...</p>
            </CardContent>
          </Card>
        ) : suppliers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Suppliers Yet</h3>
              <p className="text-muted-foreground mb-4">Add your first supplier to start tracking prices</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((supplier) => (
              <Card key={supplier.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{supplier.name}</CardTitle>
                      {supplier.last_price_update && (
                        <CardDescription>
                          Last updated: {format(new Date(supplier.last_price_update), "MMM d, yyyy")}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={supplier.is_active ? "default" : "secondary"}>
                      {supplier.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {supplier.contact_name && (
                    <p className="text-sm"><span className="font-medium">Contact:</span> {supplier.contact_name}</p>
                  )}
                  {supplier.contact_email && (
                    <p className="text-sm"><span className="font-medium">Email:</span> {supplier.contact_email}</p>
                  )}
                  {supplier.contact_phone && (
                    <p className="text-sm"><span className="font-medium">Phone:</span> {supplier.contact_phone}</p>
                  )}
                  {supplier.website && (
                    <p className="text-sm">
                      <span className="font-medium">Website:</span>{" "}
                      <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {supplier.website}
                      </a>
                    </p>
                  )}
                  {supplier.notes && (
                    <p className="text-sm text-muted-foreground">{supplier.notes}</p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditingSupplier(supplier)}
                    >
                      <Edit className="mr-2 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this supplier?")) {
                          deleteSupplierMutation.mutate(supplier.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editingSupplier} onOpenChange={(open) => !open && setEditingSupplier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>
          {editingSupplier && <SupplierForm supplier={editingSupplier} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
