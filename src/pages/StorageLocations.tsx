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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { StorageLocationTree } from "@/components/storage/StorageLocationTree";
import { StorageLocationDetail } from "@/components/storage/StorageLocationDetail";
import { FloorPlanCanvas } from "@/components/storage/FloorPlanCanvas";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Warehouse, ArrowLeft, LayoutGrid, List } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StorageLocation {
  id: string;
  name: string;
  description: string | null;
  location_type: string;
  parent_id: string | null;
  metadata: Record<string, any>;
  display_order: number;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const LOCATION_TYPES = [
  { value: "area", label: "Area / Building" },
  { value: "unit", label: "Shelving Unit" },
  { value: "shelf", label: "Shelf" },
  { value: "cabinet", label: "Cabinet" },
  { value: "rack", label: "Rack" },
  { value: "tote", label: "Tote / Bin" },
  { value: "column", label: "Column" },
  { value: "bin", label: "Bin Set" },
  { value: "other", label: "Other" },
];

const StorageLocations = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"tree" | "floorplan">("floorplan");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("area");
  const [formParentId, setFormParentId] = useState<string | null>(null);

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["storage-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storage_locations")
        .select("*")
        .eq("is_active", true)
        .order("display_order")
        .order("name");
      if (error) throw error;
      return data as StorageLocation[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (loc: Partial<StorageLocation>) => {
      const { error } = await supabase.from("storage_locations").insert({
        name: loc.name!,
        description: loc.description || null,
        location_type: loc.location_type || "area",
        parent_id: loc.parent_id || null,
        metadata: loc.metadata || {},
        display_order: loc.display_order || 0,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-locations"] });
      toast({ title: "Location created" });
      resetForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StorageLocation> & { id: string }) => {
      const { error } = await supabase.from("storage_locations").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-locations"] });
      toast({ title: "Location updated" });
      resetForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("storage_locations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-locations"] });
      setSelectedLocationId(null);
      toast({ title: "Location deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormType("area");
    setFormParentId(null);
    setIsAddDialogOpen(false);
    setEditingLocation(null);
    setParentIdForNew(null);
  };

  const openAddDialog = (parentId: string | null = null) => {
    resetForm();
    setParentIdForNew(parentId);
    setFormParentId(parentId);
    if (parentId) {
      // Default child type based on parent
      const parent = locations.find(l => l.id === parentId);
      if (parent?.location_type === "area") setFormType("unit");
      else if (parent?.location_type === "unit") setFormType("shelf");
      else if (parent?.location_type === "rack") setFormType("tote");
      else setFormType("shelf");
    }
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (loc: StorageLocation) => {
    setEditingLocation(loc);
    setFormName(loc.name);
    setFormDescription(loc.description || "");
    setFormType(loc.location_type);
    setFormParentId(loc.parent_id);
    setIsAddDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formName.trim()) return;
    if (editingLocation) {
      updateMutation.mutate({
        id: editingLocation.id,
        name: formName.trim(),
        description: formDescription.trim() || null,
        location_type: formType,
        parent_id: formParentId,
      });
    } else {
      createMutation.mutate({
        name: formName.trim(),
        description: formDescription.trim() || null,
        location_type: formType,
        parent_id: formParentId,
      });
    }
  };

  // Build tree structure
  const rootLocations = locations.filter(l => !l.parent_id);
  const getChildren = (parentId: string) => locations.filter(l => l.parent_id === parentId);
  const selectedLocation = locations.find(l => l.id === selectedLocationId) || null;

  // Stats
  const totalLocations = locations.length;
  const topLevelAreas = rootLocations.length;

  return (
    <ProtectedRoute excludedRoles={["guest"]}>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/inventory")}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Inventory
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Warehouse className="h-6 w-6" />
                  Storage Locations
                </h1>
                <p className="text-sm text-muted-foreground">
                  {topLevelAreas} areas • {totalLocations} total locations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => openAddDialog(null)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Area
              </Button>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "tree" | "floorplan")}>
                <TabsList className="h-9">
                  <TabsTrigger value="floorplan" className="text-xs gap-1">
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Floor Plan
                  </TabsTrigger>
                  <TabsTrigger value="tree" className="text-xs gap-1">
                    <List className="h-3.5 w-3.5" />
                    Tree
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {viewMode === "floorplan" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-4">
                    <FloorPlanCanvas
                      locations={locations}
                      getChildren={getChildren}
                      selectedId={selectedLocationId}
                      onSelect={setSelectedLocationId}
                      onPositionUpdate={(id, pos) => {
                        const loc = locations.find(l => l.id === id);
                        if (loc) {
                          updateMutation.mutate({
                            id,
                            metadata: { ...loc.metadata, floorplan_position: pos },
                          });
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-1">
                {selectedLocation ? (
                  <StorageLocationDetail
                    location={selectedLocation}
                    allLocations={locations}
                    getChildren={getChildren}
                    onEdit={openEditDialog}
                    onDelete={(id) => {
                      if (confirm("Delete this location and all its children?")) {
                        deleteMutation.mutate(id);
                      }
                    }}
                    onAddChild={openAddDialog}
                  />
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <Warehouse className="h-12 w-12 mb-3 opacity-40" />
                      <p className="text-sm">Select a location to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Location Hierarchy</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="p-4 text-sm text-muted-foreground">Loading...</div>
                    ) : rootLocations.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">
                        No storage locations yet. Click "Add Area" to create one.
                      </div>
                    ) : (
                      <div className="p-2">
                        <StorageLocationTree
                          locations={locations}
                          rootLocations={rootLocations}
                          getChildren={getChildren}
                          selectedId={selectedLocationId}
                          onSelect={setSelectedLocationId}
                          onAddChild={openAddDialog}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-2">
                {selectedLocation ? (
                  <StorageLocationDetail
                    location={selectedLocation}
                    allLocations={locations}
                    getChildren={getChildren}
                    onEdit={openEditDialog}
                    onDelete={(id) => {
                      if (confirm("Delete this location and all its children?")) {
                        deleteMutation.mutate(id);
                      }
                    }}
                    onAddChild={openAddDialog}
                  />
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <Warehouse className="h-12 w-12 mb-3 opacity-40" />
                      <p className="text-sm">Select a location from the tree to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )
          </div>

          {/* Add/Edit Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingLocation ? "Edit Location" : "Add Location"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. 39th Garage Shelving" />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LOCATION_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Parent Location</Label>
                  <Select value={formParentId || "none"} onValueChange={(v) => setFormParentId(v === "none" ? null : v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Top Level —</SelectItem>
                      {locations
                        .filter(l => l.id !== editingLocation?.id)
                        .map(l => (
                          <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Optional notes about this location" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetForm}>Cancel</Button>
                  <Button onClick={handleSubmit} disabled={!formName.trim()}>
                    {editingLocation ? "Save Changes" : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default StorageLocations;
