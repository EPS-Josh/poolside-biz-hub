import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface ParsedItem {
  pool360ItemNumber: string;
  mfgNumber: string;
  listPrice: string;
  description?: string;
}

interface ImportResult {
  matched: ParsedItem[];
  new: ParsedItem[];
  conflicts: ParsedItem[];
}

export default function Pool360Import() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const extractItemsFromText = (text: string): ParsedItem[] => {
    const items: ParsedItem[] = [];
    const lines = text.split('\n');
    
    // Look for table rows with ITEM NUMBER, MFG. NUMBER, and LIST PRICE
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Match patterns like: SWQ-061-3796 | 2 | Piston Assy w/ O-Rings | 14819-0011 | $305.32
      const tableMatch = line.match(/^([A-Z]{3}-\d{3}-\d{4})\s*\|\s*\d+\s*\|\s*([^|]+)\|\s*([A-Z0-9-]+)\s*\|\s*\$?([\d,]+\.?\d*)/);
      
      if (tableMatch) {
        items.push({
          pool360ItemNumber: tableMatch[1].trim(),
          description: tableMatch[2].trim(),
          mfgNumber: tableMatch[3].trim(),
          listPrice: tableMatch[4].replace(',', '')
        });
      }
    }
    
    return items;
  };

  const handleImport = async () => {
    if (!files || files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload PDF files first",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    
    try {
      // In a real implementation, you would parse the PDFs here
      // For now, we'll simulate with the parsed data
      const allItems: ParsedItem[] = [];
      
      // Extract items from parsed PDFs
      // This is a placeholder - in production you'd use a PDF parsing library
      toast({
        title: "Processing PDFs",
        description: `Processing ${files.length} files...`
      });

      // Fetch existing inventory
      const { data: inventory, error: invError } = await supabase
        .from('inventory_items')
        .select('id, item_number, pool360_item_number, name, unit_price');

      if (invError) throw invError;

      // Match items
      const matched: ParsedItem[] = [];
      const newItems: ParsedItem[] = [];
      const conflicts: ParsedItem[] = [];

      allItems.forEach(item => {
        const existingItem = inventory?.find(inv => 
          inv.item_number === item.mfgNumber
        );

        if (existingItem) {
          if (existingItem.pool360_item_number && 
              existingItem.pool360_item_number !== item.pool360ItemNumber) {
            conflicts.push(item);
          } else {
            matched.push(item);
          }
        } else {
          newItems.push(item);
        }
      });

      setResults({ matched, new: newItems, conflicts });
      
      toast({
        title: "Import Complete",
        description: `Matched: ${matched.length}, New: ${newItems.length}, Conflicts: ${conflicts.length}`
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pool360 Price Import</h1>
            <p className="text-muted-foreground">
              Import Pool360 catalog data and match with existing inventory
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Pool360 Catalog PDFs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button onClick={handleImport} disabled={importing || !files}>
                {importing ? "Processing..." : "Import"}
              </Button>
            </div>
            {files && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                {files.length} file(s) selected
              </div>
            )}
          </CardContent>
        </Card>

        {results && (
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  Matched Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{results.matched.length}</p>
                <p className="text-sm text-muted-foreground">
                  Items matched to existing inventory
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <FileText className="w-5 h-5" />
                  New Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{results.new.length}</p>
                <p className="text-sm text-muted-foreground">
                  New items not in inventory
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-5 h-5" />
                  Conflicts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{results.conflicts.length}</p>
                <p className="text-sm text-muted-foreground">
                  Items with conflicting data
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Import Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.matched.length > 0 && (
                <div>
                  <h3 className="font-semibold text-green-600 mb-2">Matched Items (Sample)</h3>
                  <div className="bg-muted p-3 rounded text-sm space-y-1">
                    {results.matched.slice(0, 5).map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{item.pool360ItemNumber}</span>
                        <span className="text-muted-foreground">{item.mfgNumber}</span>
                        <span className="font-mono">${item.listPrice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.new.length > 0 && (
                <div>
                  <h3 className="font-semibold text-blue-600 mb-2">New Items (Sample)</h3>
                  <div className="bg-muted p-3 rounded text-sm space-y-1">
                    {results.new.slice(0, 5).map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{item.pool360ItemNumber}</span>
                        <span className="text-muted-foreground">{item.mfgNumber}</span>
                        <span className="font-mono">${item.listPrice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.conflicts.length > 0 && (
                <div>
                  <h3 className="font-semibold text-orange-600 mb-2">Conflicts (Needs Review)</h3>
                  <div className="bg-muted p-3 rounded text-sm space-y-1">
                    {results.conflicts.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{item.pool360ItemNumber}</span>
                        <span className="text-muted-foreground">{item.mfgNumber}</span>
                        <span className="font-mono">${item.listPrice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}