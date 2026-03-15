import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Plus, Warehouse, Box, Layers, Archive, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface StorageLocation {
  id: string;
  name: string;
  description: string | null;
  location_type: string;
  parent_id: string | null;
  metadata: Record<string, any>;
  display_order: number;
  is_active: boolean;
}

interface Props {
  locations: StorageLocation[];
  rootLocations: StorageLocation[];
  getChildren: (parentId: string) => StorageLocation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string) => void;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  area: Warehouse,
  unit: Layers,
  shelf: Package,
  cabinet: Archive,
  rack: Layers,
  tote: Box,
  bin: Box,
  other: Package,
};

const TreeNode: React.FC<{
  location: StorageLocation;
  getChildren: (id: string) => StorageLocation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string) => void;
  depth: number;
}> = ({ location, getChildren, selectedId, onSelect, onAddChild, depth }) => {
  const [expanded, setExpanded] = useState(depth < 1);
  const children = getChildren(location.id);
  const hasChildren = children.length > 0;
  const Icon = TYPE_ICONS[location.location_type] || Package;
  const isSelected = selectedId === location.id;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer group text-sm transition-colors",
          isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(location.id)}
      >
        <button
          className="p-0.5 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {hasChildren ? (
            expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <span className="w-3.5" />
          )}
        </button>
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate flex-1">{location.name}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onAddChild(location.id);
          }}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      {expanded && hasChildren && (
        <div>
          {children.map(child => (
            <TreeNode
              key={child.id}
              location={child}
              getChildren={getChildren}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const StorageLocationTree: React.FC<Props> = ({
  rootLocations,
  getChildren,
  selectedId,
  onSelect,
  onAddChild,
}) => {
  return (
    <div className="space-y-0.5">
      {rootLocations.map(loc => (
        <TreeNode
          key={loc.id}
          location={loc}
          getChildren={getChildren}
          selectedId={selectedId}
          onSelect={onSelect}
          onAddChild={onAddChild}
          depth={0}
        />
      ))}
    </div>
  );
};
