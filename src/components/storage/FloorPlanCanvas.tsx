import React, { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Home, Package, Warehouse, Layers, Archive, Box, GripVertical } from "lucide-react";

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

interface FloorPlanCanvasProps {
  locations: StorageLocation[];
  getChildren: (parentId: string) => StorageLocation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPositionUpdate?: (id: string, position: { x: number; y: number }) => void;
}

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  area: { bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-300 dark:border-blue-700", text: "text-blue-900 dark:text-blue-100", icon: "text-blue-500" },
  unit: { bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-300 dark:border-emerald-700", text: "text-emerald-900 dark:text-emerald-100", icon: "text-emerald-500" },
  shelf: { bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-300 dark:border-amber-700", text: "text-amber-900 dark:text-amber-100", icon: "text-amber-500" },
  cabinet: { bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-300 dark:border-purple-700", text: "text-purple-900 dark:text-purple-100", icon: "text-purple-500" },
  rack: { bg: "bg-cyan-50 dark:bg-cyan-950/40", border: "border-cyan-300 dark:border-cyan-700", text: "text-cyan-900 dark:text-cyan-100", icon: "text-cyan-500" },
  tote: { bg: "bg-orange-50 dark:bg-orange-950/40", border: "border-orange-300 dark:border-orange-700", text: "text-orange-900 dark:text-orange-100", icon: "text-orange-500" },
  column: { bg: "bg-indigo-50 dark:bg-indigo-950/40", border: "border-indigo-300 dark:border-indigo-700", text: "text-indigo-900 dark:text-indigo-100", icon: "text-indigo-500" },
  bin: { bg: "bg-pink-50 dark:bg-pink-950/40", border: "border-pink-300 dark:border-pink-700", text: "text-pink-900 dark:text-pink-100", icon: "text-pink-500" },
  other: { bg: "bg-gray-50 dark:bg-gray-950/40", border: "border-gray-300 dark:border-gray-700", text: "text-gray-900 dark:text-gray-100", icon: "text-gray-500" },
};

const TYPE_LABELS: Record<string, string> = {
  area: "Area",
  unit: "Unit",
  shelf: "Shelf",
  cabinet: "Cabinet",
  rack: "Rack",
  tote: "Tote",
  column: "Column",
  bin: "Bin Set",
  other: "Other",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  area: Warehouse,
  unit: Layers,
  shelf: Package,
  cabinet: Archive,
  rack: Layers,
  tote: Box,
  column: Layers,
  bin: Box,
  other: Package,
};

// Calculate auto-layout positions for items in a grid
const getAutoPosition = (index: number, total: number, containerWidth: number): { x: number; y: number } => {
  const cardWidth = 200;
  const cardHeight = 120;
  const gap = 20;
  const cols = Math.max(1, Math.floor((containerWidth - gap) / (cardWidth + gap)));
  const col = index % cols;
  const row = Math.floor(index / cols);
  return {
    x: gap + col * (cardWidth + gap),
    y: gap + row * (cardHeight + gap),
  };
};

interface DraggableCardProps {
  location: StorageLocation;
  position: { x: number; y: number };
  isSelected: boolean;
  childCount: number;
  onClick: () => void;
  onDoubleClick: () => void;
  onDragEnd: (pos: { x: number; y: number }) => void;
}

const DraggableCard: React.FC<DraggableCardProps> = ({
  location,
  position,
  isSelected,
  childCount,
  onClick,
  onDoubleClick,
  onDragEnd,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState(position);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) setCurrentPos(position);
  }, [position, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start drag from the grip handle
    if (!(e.target as HTMLElement).closest('[data-drag-handle]')) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragOffset({ x: e.clientX - currentPos.x, y: e.clientY - currentPos.y });
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      setCurrentPos({
        x: Math.max(0, e.clientX - dragOffset.x),
        y: Math.max(0, e.clientY - dragOffset.y),
      });
    };
    const handleUp = () => {
      setIsDragging(false);
      onDragEnd(currentPos);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging, dragOffset, currentPos, onDragEnd]);

  const colors = TYPE_COLORS[location.location_type] || TYPE_COLORS.other;
  const Icon = TYPE_ICONS[location.location_type] || Package;

  return (
    <div
      ref={cardRef}
      className={cn(
        "absolute w-[200px] rounded-lg border-2 shadow-sm cursor-pointer select-none transition-shadow",
        colors.bg,
        colors.border,
        isSelected && "ring-2 ring-primary shadow-lg",
        isDragging && "shadow-xl opacity-90 z-50"
      )}
      style={{
        left: currentPos.x,
        top: currentPos.y,
        transition: isDragging ? "none" : "left 0.2s, top 0.2s",
      }}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          onClick();
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Drag handle */}
      <div
        data-drag-handle
        className="absolute top-1 right-1 p-1 cursor-grab active:cursor-grabbing rounded opacity-40 hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Icon className={cn("h-4 w-4 shrink-0", colors.icon)} />
          <span className={cn("text-sm font-semibold truncate", colors.text)}>
            {location.name}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            {TYPE_LABELS[location.location_type] || location.location_type}
          </span>
          {childCount > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
              {childCount} {childCount === 1 ? "child" : "children"}
            </Badge>
          )}
        </div>
        {location.description && (
          <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">
            {location.description}
          </p>
        )}
      </div>

      {/* Double-click hint for items with children */}
      {childCount > 0 && (
        <div className="border-t border-dashed px-3 py-1 text-[10px] text-muted-foreground text-center opacity-60">
          Double-click to explore
        </div>
      )}
    </div>
  );
};

export const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({
  locations,
  getChildren,
  selectedId,
  onSelect,
  onPositionUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [drillPath, setDrillPath] = useState<string[]>([]);
  const [containerWidth, setContainerWidth] = useState(800);

  // Observe container width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Current parent context
  const currentParentId = drillPath.length > 0 ? drillPath[drillPath.length - 1] : null;

  // Items to display at current drill level
  const displayLocations = currentParentId
    ? getChildren(currentParentId)
    : locations.filter((l) => !l.parent_id);

  // Build breadcrumb trail
  const breadcrumbItems: { id: string | null; name: string }[] = [{ id: null, name: "All Areas" }];
  for (const pathId of drillPath) {
    const loc = locations.find((l) => l.id === pathId);
    if (loc) breadcrumbItems.push({ id: loc.id, name: loc.name });
  }

  const handleDrillDown = useCallback(
    (locationId: string) => {
      const children = getChildren(locationId);
      if (children.length > 0) {
        setDrillPath((prev) => [...prev, locationId]);
      }
    },
    [getChildren]
  );

  const handleBreadcrumbClick = useCallback((index: number) => {
    setDrillPath((prev) => prev.slice(0, index));
  }, []);

  const handleDragEnd = useCallback(
    (id: string, pos: { x: number; y: number }) => {
      onPositionUpdate?.(id, pos);
    },
    [onPositionUpdate]
  );

  // Calculate canvas height
  const cardHeight = 120;
  const gap = 20;
  const cols = Math.max(1, Math.floor((containerWidth - gap) / (200 + gap)));
  const rows = Math.ceil(displayLocations.length / cols);
  const canvasHeight = Math.max(300, gap + rows * (cardHeight + gap) + gap);

  return (
    <div className="space-y-3">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1 text-sm flex-wrap">
        {breadcrumbItems.map((item, i) => (
          <React.Fragment key={item.id ?? "root"}>
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            <button
              className={cn(
                "px-2 py-0.5 rounded-md transition-colors",
                i === breadcrumbItems.length - 1
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              onClick={() => handleBreadcrumbClick(i)}
            >
              {i === 0 && <Home className="h-3.5 w-3.5 inline mr-1" />}
              {item.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative border rounded-lg bg-muted/30 overflow-auto"
        style={{ minHeight: canvasHeight }}
        onClick={() => {
          // Deselect on background click — don't deselect
        }}
      >
        {displayLocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <Package className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">No locations at this level</p>
            {drillPath.length > 0 && (
              <p className="text-xs mt-1">Navigate up using the breadcrumbs above</p>
            )}
          </div>
        ) : (
          displayLocations.map((loc, index) => {
            // Use saved position from metadata or auto-calculate
            const savedPos = loc.metadata?.floorplan_position;
            const autoPos = getAutoPosition(index, displayLocations.length, containerWidth);
            const position = savedPos || autoPos;

            return (
              <DraggableCard
                key={loc.id}
                location={loc}
                position={position}
                isSelected={selectedId === loc.id}
                childCount={getChildren(loc.id).length}
                onClick={() => onSelect(loc.id)}
                onDoubleClick={() => handleDrillDown(loc.id)}
                onDragEnd={(pos) => handleDragEnd(loc.id, pos)}
              />
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground px-1">
        <span className="font-medium">Legend:</span>
        {Object.entries(TYPE_LABELS).map(([type, label]) => {
          const colors = TYPE_COLORS[type];
          return (
            <span key={type} className="flex items-center gap-1">
              <span className={cn("w-2.5 h-2.5 rounded-sm border", colors.bg, colors.border)} />
              {label}
            </span>
          );
        })}
        <span className="ml-auto italic">Click to select • Double-click to drill down • Drag handle to reposition</span>
      </div>
    </div>
  );
};
