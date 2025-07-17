import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, User, Package } from "lucide-react";
import { format } from "date-fns";

interface InventoryHistoryProps {
  inventoryItemId: string;
  itemName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ServiceRecord {
  id: string;
  service_date: string;
  service_type: string;
  technician_name: string | null;
  parts_used: any;
  customers: {
    first_name: string;
    last_name: string;
  } | null;
}

interface HistoryEntry {
  id: string;
  date: string;
  serviceType: string;
  customerName: string;
  technicianName: string;
  quantityUsed: number;
  recordId: string;
}

export const InventoryHistory: React.FC<InventoryHistoryProps> = ({
  inventoryItemId,
  itemName,
  isOpen,
  onClose,
}) => {
  const { data: serviceRecords = [], isLoading } = useQuery({
    queryKey: ["inventory-history", inventoryItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_records")
        .select(`
          id,
          service_date,
          service_type,
          technician_name,
          parts_used,
          customers (
            first_name,
            last_name
          )
        `)
        .not("parts_used", "is", null)
        .order("service_date", { ascending: false });

      if (error) throw error;
      return data as ServiceRecord[];
    },
    enabled: isOpen,
  });

  // Process service records to find transactions for this specific inventory item
  const historyEntries: HistoryEntry[] = React.useMemo(() => {
    const entries: HistoryEntry[] = [];

    serviceRecords.forEach((record) => {
      if (record.parts_used && Array.isArray(record.parts_used)) {
        record.parts_used.forEach((part: any) => {
          if (part.inventoryItemId === inventoryItemId) {
            entries.push({
              id: `${record.id}-${part.inventoryItemId}`,
              date: record.service_date,
              serviceType: record.service_type,
              customerName: record.customers 
                ? `${record.customers.first_name} ${record.customers.last_name}`
                : "Unknown Customer",
              technicianName: record.technician_name || "Unknown Technician",
              quantityUsed: part.quantity || 0,
              recordId: record.id,
            });
          }
        });
      }
    });

    return entries;
  }, [serviceRecords, inventoryItemId]);

  const getServiceTypeBadge = (serviceType: string) => {
    const badgeMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      "Weekly Pool Cleaning": { variant: "default", label: "Weekly Cleaning" },
      "equipment-repair": { variant: "secondary", label: "Equipment Repair" },
      "equipment-installation": { variant: "outline", label: "Installation" },
      "Collar Set": { variant: "secondary", label: "Collar Set" },
    };

    const config = badgeMap[serviceType] || { variant: "outline" as const, label: serviceType };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Transaction History for {itemName || "Unknown Item"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading transaction history...</div>
            </div>
          ) : historyEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground">
                This inventory item hasn't been used in any service records yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead className="text-right">Quantity Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(entry.date), "MMM dd, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getServiceTypeBadge(entry.serviceType)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {entry.customerName}
                      </div>
                    </TableCell>
                    <TableCell>{entry.technicianName}</TableCell>
                    <TableCell className="text-right font-medium">
                      -{entry.quantityUsed}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        {historyEntries.length > 0 && (
          <div className="border-t pt-4 flex justify-between items-center text-sm text-muted-foreground">
            <span>Total transactions: {historyEntries.length}</span>
            <span>
              Total quantity used: {historyEntries.reduce((sum, entry) => sum + entry.quantityUsed, 0)}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};