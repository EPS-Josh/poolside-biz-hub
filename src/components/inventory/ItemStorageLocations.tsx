import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, MapPin, ChevronRight, ChevronDown, FolderOpen, Folder } from "lucide-react";

interface StorageLocation {
  id: string;
  name: string;
  location_type: string;
  parent_id: string | null;
}

interface ItemLocation {
  id: string;
  storage_location_id: string;
  quantity: number;
  notes: string | null;
  storage_locations?: StorageLocation;
}

interface Props {
  itemId: string;
}

const buildLocationPath = (locationId: string, allLocations: StorageLocation[]): string => {
  const parts: string[] = [];
  let current = allLocations.find(l => l.id === locationId);
  while (current) {
    parts.unshift(current.name);
    current = current.parent_id ? allLocations.find(l => l.id === current!.parent_id) : undefined;
  }
  return parts.join(" › ");
};

// Drill-down tree node for location selection
const LocationTreeNode: React.FC<{
  location: StorageLocation;
  allLocations: StorageLocation[];
  assignedIds: Set<string>;
  onSelect: (id: string) => void;
  depth: number;
}> = ({ location, allLocations, assignedIds, onSelect, depth }) => {
  const [expanded, setExpanded] = useState(false);
  const children = allLocations.filter(l => l.parent_id === location.id);
  const hasChildren = children.length > 0;
  const isAssigned = assignedIds.has(location.id);

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1.5 px-2 rounded-md text-sm cursor-pointer transition-colors
          ${isAssigned ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent'}
        `}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (isAssigned) return;
          if (hasChildren) {
            setExpanded(!expanded);
          } else {
            onSelect(location.id);
          }
        }}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {hasChildren ? (
          expanded ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary" /> : <Folder className="h-3.5 w-3.5 shrink-0 text-primary" />
        ) : (
          <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        <span className={`truncate ${isAssigned ? 'line-through' : ''}`}>
          {location.name}
        </span>
        {isAssigned && (
          <span className="text-xs text-muted-foreground ml-auto shrink-0">(assigned)</span>
        )}
        {!hasChildren && !isAssigned && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-5 px-2 text-xs shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(location.id);
            }}
          >
            Select
          </Button>
        )}
      </div>
      {expanded && children
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(child => (
          <LocationTreeNode
            key={child.id}
            location={child}
            allLocations={allLocations}
            assignedIds={assignedIds}
            onSelect={onSelect}
            depth={depth + 1}
          />
        ))
      }
    </div>
  );
};

export const ItemStorageLocations: React.FC<Props> = ({ itemId }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdding, setIsAdding] = useState(false);

  const { data: allLocations = [] } = useQuery({
    queryKey: ["storage-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storage_locations")
        .select("id, name, location_type, parent_id")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as StorageLocation[];
    },
  });

  const { data: itemLocations = [] } = useQuery({
    queryKey: ["item-locations", itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_item_locations")
        .select("id, storage_location_id, quantity, notes, storage_locations(id, name, location_type, parent_id)")
        .eq("inventory_item_id", itemId);
      if (error) throw error;
      return (data || []) as unknown as ItemLocation[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async ({ locationId, qty }: { locationId: string; qty: number }) => {
      const { error } = await supabase.from("inventory_item_locations").insert({
        inventory_item_id: itemId,
        storage_location_id: locationId,
        quantity: qty,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item-locations", itemId] });
      setSelectedLocationId("");
      setQuantity(1);
      setIsAdding(false);
      toast({ title: "Storage location added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateQtyMutation = useMutation({
    mutationFn: async ({ id, qty }: { id: string; qty: number }) => {
      const { error } = await supabase
        .from("inventory_item_locations")
        .update({ quantity: qty })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item-locations", itemId] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory_item_locations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item-locations", itemId] });
      toast({ title: "Location removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const assignedIds = new Set(itemLocations.map(il => il.storage_location_id));

  // Root-level locations for the tree
  const rootLocations = useMemo(() =>
    allLocations
      .filter(l => !l.parent_id)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [allLocations]
  );

  const selectedPath = selectedLocationId
    ? buildLocationPath(selectedLocationId, allLocations)
    : "";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Storage Locations
        </h3>
        {!isAdding && (
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Assign Location
          </Button>
        )}
      </div>

      {/* Current assignments */}
      {itemLocations.length > 0 ? (
        <div className="space-y-2">
          {itemLocations.map((il) => {
            const path = buildLocationPath(il.storage_location_id, allLocations);
            return (
              <div key={il.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{path}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Label className="text-xs text-muted-foreground">Qty:</Label>
                  <Input
                    type="number"
                    min={0}
                    className="w-16 h-7 text-sm"
                    defaultValue={il.quantity}
                    onBlur={(e) => {
                      const newQty = parseInt(e.target.value) || 0;
                      if (newQty !== il.quantity) {
                        updateQtyMutation.mutate({ id: il.id, qty: newQty });
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => removeMutation.mutate(il.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !isAdding && (
          <p className="text-sm text-muted-foreground italic">No storage locations assigned</p>
        )
      )}

      {/* Add new assignment - drill-down tree */}
      {isAdding && (
        <div className="p-3 rounded-md border border-dashed space-y-3">
          {selectedLocationId ? (
            <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/20">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-sm font-medium flex-1 truncate">{selectedPath}</span>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setSelectedLocationId("")}>
                Change
              </Button>
            </div>
          ) : (
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Drill down to select a location:</Label>
              <div className="max-h-48 overflow-y-auto rounded-md border bg-background p-1">
                {rootLocations.map(loc => (
                  <LocationTreeNode
                    key={loc.id}
                    location={loc}
                    allLocations={allLocations}
                    assignedIds={assignedIds}
                    onSelect={setSelectedLocationId}
                    depth={0}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="w-20">
              <Label className="text-xs">Qty</Label>
              <Input
                type="number"
                min={1}
                className="h-8 text-sm"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <Button
              size="sm"
              className="h-8"
              disabled={!selectedLocationId}
              onClick={() => addMutation.mutate({ locationId: selectedLocationId, qty: quantity })}
            >
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => { setIsAdding(false); setSelectedLocationId(""); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
