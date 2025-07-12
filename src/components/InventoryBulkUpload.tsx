import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Download, FileText, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UploadResult {
  success: number;
  failed: number;
  errors: string[];
}

const InventoryBulkUpload = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const downloadTemplate = () => {
    const headers = [
      'name',
      'description', 
      'sku',
      'category',
      'quantity_in_stock',
      'unit_price',
      'cost_price',
      'low_stock_threshold'
    ];
    
    const sampleData = [
      [
        'Pool Chlorine Tablets',
        'Fast-dissolving chlorine tablets for pool sanitation',
        'CHT-001',
        'Chemicals',
        '100',
        '29.99',
        '18.50',
        '20'
      ],
      [
        'Pool Brush',
        'Heavy-duty pool cleaning brush',
        'PB-002',
        'Equipment',
        '15',
        '24.99',
        '12.00',
        '5'
      ]
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventory_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded successfully",
    });
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const items = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const item: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        switch (header) {
          case 'quantity_in_stock':
          case 'low_stock_threshold':
            item[header] = value ? parseInt(value) || 0 : 0;
            break;
          case 'unit_price':
          case 'cost_price':
            item[header] = value ? parseFloat(value) || null : null;
            break;
          case 'name':
            item[header] = value;
            break;
          case 'description':
          case 'sku':
          case 'category':
            item[header] = value || null;
            break;
          default:
            item[header] = value || null;
        }
      });

      if (item.name) {
        items.push(item);
      }
    }

    return items;
  };

  const bulkUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const text = await file.text();
      const items = parseCSV(text);
      
      if (items.length === 0) {
        throw new Error("No valid items found in CSV file");
      }

      const results: UploadResult = {
        success: 0,
        failed: 0,
        errors: []
      };

      // Process items in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        const itemsWithUserId = batch.map(item => ({
          ...item,
          user_id: user.id
        }));

        try {
          const { error } = await supabase
            .from("inventory_items")
            .insert(itemsWithUserId);

          if (error) {
            results.failed += batch.length;
            results.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
          } else {
            results.success += batch.length;
          }
        } catch (err) {
          results.failed += batch.length;
          results.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setUploadResult(results);
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      
      if (results.success > 0) {
        toast({
          title: "Upload Complete",
          description: `Successfully uploaded ${results.success} items${results.failed > 0 ? ` (${results.failed} failed)` : ''}`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload inventory items",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setUploadResult(null);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      e.target.value = '';
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      bulkUploadMutation.mutate(selectedFile);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Inventory Items</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileText className="mr-2 h-5 w-5" />
                Download Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Download the CSV template with sample data to ensure your file has the correct format.
              </p>
              <Button onClick={downloadTemplate} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download CSV Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Upload className="mr-2 h-5 w-5" />
                Upload CSV File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csvFile">Select CSV File</Label>
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>

              {selectedFile && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    File selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-2">
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || bulkUploadMutation.isPending}
                  className="flex-1"
                >
                  {bulkUploadMutation.isPending ? "Uploading..." : "Upload Items"}
                </Button>
                <Button onClick={resetUpload} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          {uploadResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  {uploadResult.success > 0 ? (
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="mr-2 h-5 w-5 text-red-500" />
                  )}
                  Upload Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium text-green-600">Success:</span> {uploadResult.success} items
                  </p>
                  {uploadResult.failed > 0 && (
                    <p className="text-sm">
                      <span className="font-medium text-red-600">Failed:</span> {uploadResult.failed} items
                    </p>
                  )}
                  
                  {uploadResult.errors.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-red-600 mb-2">Errors:</p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {uploadResult.errors.map((error, index) => (
                          <p key={index} className="text-xs text-red-500 bg-red-50 p-2 rounded">
                            {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>CSV Format Requirements:</strong></p>
            <p>• First row must contain column headers</p>
            <p>• Required column: name</p>
            <p>• Optional columns: description, sku, category, quantity_in_stock, unit_price, cost_price, low_stock_threshold</p>
            <p>• Numbers should not contain currency symbols or commas</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryBulkUpload;