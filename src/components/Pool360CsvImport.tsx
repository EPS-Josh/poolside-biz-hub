import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Pool360Item {
  pool360ItemNumber: string;
  mfgNumber: string;
  listPrice: number;
  description?: string;
}

interface ImportResult {
  matched: Pool360Item[];
  new: Pool360Item[];
  conflicts: Pool360Item[];
  updated: number;
}

export const Pool360CsvImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const csv = "pool360_item_number,mfg_number,list_price,description\n12345,MFG-001,99.99,Sample Part Description";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pool360_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): Pool360Item[] => {
    const lines = text.split("\n").filter(line => line.trim());
    const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
    
    const items: Pool360Item[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      
      const pool360Idx = headers.findIndex(h => h.includes("pool360") || h.includes("item"));
      const mfgIdx = headers.findIndex(h => h.includes("mfg") || h.includes("manufacturer"));
      const priceIdx = headers.findIndex(h => h.includes("price") || h.includes("list"));
      const descIdx = headers.findIndex(h => h.includes("desc"));
      
      if (pool360Idx >= 0 && values[pool360Idx]) {
        items.push({
          pool360ItemNumber: values[pool360Idx],
          mfgNumber: mfgIdx >= 0 ? values[mfgIdx] : "",
          listPrice: priceIdx >= 0 ? parseFloat(values[priceIdx].replace(/[^0-9.]/g, "")) || 0 : 0,
          description: descIdx >= 0 ? values[descIdx] : undefined
        });
      }
    }
    
    return items;
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);

    try {
      const text = await file.text();
      const items = parseCSV(text);
      
      toast({
        title: "Processing",
        description: `Found ${items.length} items to process...`,
      });

      setProgress(20);

      // Fetch existing inventory
      const { data: inventory, error } = await supabase
        .from("inventory_items")
        .select("*");

      if (error) throw error;

      setProgress(40);

      const matched: Pool360Item[] = [];
      const newItems: Pool360Item[] = [];
      const conflicts: Pool360Item[] = [];
      let updateCount = 0;

      // Process items in batches
      const batchSize = 100;
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        for (const item of batch) {
          const existing = inventory?.find(
            inv => inv.pool360_item_number === item.pool360ItemNumber
          );

          if (existing) {
            matched.push(item);
            
            // Update if price changed
            if (existing.list_price !== item.listPrice) {
              await supabase
                .from("inventory_items")
                .update({ 
                  list_price: item.listPrice,
                  pool360_item_number: item.pool360ItemNumber 
                })
                .eq("id", existing.id);
              updateCount++;
            }
          } else {
            newItems.push(item);
          }
        }

        setProgress(40 + (i / items.length) * 50);
      }

      setProgress(100);

      setResults({
        matched,
        new: newItems,
        conflicts,
        updated: updateCount
      });

      toast({
        title: "Import Complete",
        description: `Matched: ${matched.length}, New: ${newItems.length}, Updated: ${updateCount}`,
      });

    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pool360 CSV Import</CardTitle>
          <CardDescription>
            Import Pool360 catalog data from CSV. For large files (167MB+), split into smaller chunks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Upload CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground"
            />
          </div>

          {file && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Ready to import: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={handleImport} disabled={!file || importing} className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            {importing ? "Importing..." : "Import CSV"}
          </Button>

          {importing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">{progress.toFixed(0)}%</p>
            </div>
          )}
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950">
                <p className="text-2xl font-bold text-green-600">{results.matched.length}</p>
                <p className="text-sm text-muted-foreground">Matched Items</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
                <p className="text-2xl font-bold text-blue-600">{results.updated}</p>
                <p className="text-sm text-muted-foreground">Updated Prices</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <p className="text-2xl font-bold text-yellow-600">{results.new.length}</p>
                <p className="text-sm text-muted-foreground">New Items</p>
              </div>
            </div>

            {results.new.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">New Items (Sample)</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pool360 #</TableHead>
                      <TableHead>MFG #</TableHead>
                      <TableHead>List Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.new.slice(0, 5).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.pool360ItemNumber}</TableCell>
                        <TableCell>{item.mfgNumber}</TableCell>
                        <TableCell>${item.listPrice.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {results.new.length > 5 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    ...and {results.new.length - 5} more
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
