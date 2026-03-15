import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Plus, Package, Warehouse, Layers, Archive, Box } from "lucide-react";

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

interface Props {
  location: StorageLocation;
  allLocations: StorageLocation[];
  getChildren: (parentId: string) => StorageLocation[];
  onEdit: (loc: StorageLocation) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  area: "Area / Building",
  unit: "Shelving Unit",
  shelf: "Shelf",
  cabinet: "Cabinet",
  rack: "Rack",
  tote: "Tote / Bin",
  bin: "Bin Set",
  other: "Other",
};

const TYPE_COLORS: Record<string, string> = {
  area: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  unit: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  shelf: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  cabinet: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  rack: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  tote: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  bin: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export const StorageLocationDetail: React.FC<Props> = ({
  location,
  allLocations,
  getChildren,
  onEdit,
  onDelete,
  onAddChild,
}) => {
  const children = getChildren(location.id);
  const parent = allLocations.find(l => l.id === location.parent_id);

  // Count all descendants
  const countDescendants = (id: string): number => {
    const kids = getChildren(id);
    return kids.length + kids.reduce((sum, k) => sum + countDescendants(k.id), 0);
  };

  // Fetch items stored at this location
  const { data: itemLocations = [] } = useQuery({
    queryKey: ["item-locations", location.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_item_locations")
        .select("*, inventory_items(id, name, description, item_number, fps_item_number, sku)")
        .eq("storage_location_id", location.id);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{location.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={TYPE_COLORS[location.location_type] || TYPE_COLORS.other}>
                  {TYPE_LABELS[location.location_type] || location.location_type}
                </Badge>
                {parent && (
                  <span className="text-xs text-muted-foreground">in {parent.name}</span>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => onAddChild(location.id)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Sub-Location
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(location)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDelete(location.id)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {location.description && (
            <p className="text-sm text-muted-foreground mb-4">{location.description}</p>
          )}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Direct Children</span>
              <p className="font-medium">{children.length}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Total Descendants</span>
              <p className="font-medium">{countDescendants(location.id)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Items Stored Here</span>
              <p className="font-medium">{itemLocations.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Children list */}
      {children.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Sub-Locations ({children.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {children.map(child => (
                <div key={child.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn(TYPE_COLORS[child.location_type] || TYPE_COLORS.other, "text-xs")}>
                      {TYPE_LABELS[child.location_type] || child.location_type}
                    </Badge>
                    <span>{child.name}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {getChildren(child.id).length} children
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items at this location */}
      {itemLocations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Items Stored Here ({itemLocations.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>MFG #</TableHead>
                  <TableHead>FPS #</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemLocations.map((il: any) => (
                  <TableRow key={il.id}>
                    <TableCell className="font-medium">
                      {il.inventory_items?.name || il.inventory_items?.description || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {il.inventory_items?.item_number || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {il.inventory_items?.fps_item_number || "—"}
                    </TableCell>
                    <TableCell className="text-right">{il.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper for className concatenation
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
