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
      'FPS ITEM #',
      'MFG ITEM #',
      'UPC',
      'DESCRIPTION',
      'SOLUTION',
      'TYPE',
      'ITEM STATUS',
      'NAME',
      'SKU',
      'CATEGORY',
      'PIECES PER PART',
      'MIN ORDER QTY',
      'QUANTITY IN STOCK',
      'PIECES PER CASE',
      'PIECES PER PALLET',
      'LIST PRICE',
      'UNIT PRICE',
      'COST PRICE',
      'FPS SALES PRICE',
      'MARKUP PERCENTAGE',
      'LOW STOCK THRESHOLD',
      'LENGTH',
      'WIDTH',
      'HEIGHT',
      'WEIGHT',
      'SUPPLIER 1 NAME',
      'SUPPLIER 1 PRICE',
      'SUPPLIER 2 NAME',
      'SUPPLIER 2 PRICE',
      'SUPPLIER 3 NAME',
      'SUPPLIER 3 PRICE',
      'SUPPLIER 4 NAME',
      'SUPPLIER 4 PRICE',
      'SUPPLIER 5 NAME',
      'SUPPLIER 5 PRICE',
      'SUPERSEDED ITEM'
    ];
    
    const sampleData = [
      [
        'FPS-CHT-001',
        'CHT-001',
        '123456789012',
        'Fast-dissolving chlorine tablets for pool sanitation',
        'Pool Maintenance',
        'Chemical',
        'Active',
        'Chlorine Tablets',
        'CHT-001-SKU',
        'Pool Chemicals',
        '1',
        '10',
        '50',
        '24',
        '48',
        '29.99',
        '24.99',
        '18.50',
        '27.99',
        '1.3',
        '10',
        '12.5',
        '8.0',
        '6.0',
        '25.5',
        'Supplier ABC',
        '22.00',
        'Supplier XYZ',
        '21.50',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ],
      [
        'FPS-PB-002',
        'PB-002',
        '987654321098',
        'Heavy-duty pool cleaning brush',
        'Cleaning Equipment',
        'Tool',
        'Active',
        'Pool Brush',
        'PB-002-SKU',
        'Pool Equipment',
        '1',
        '5',
        '25',
        '12',
        '24',
        '24.99',
        '19.99',
        '15.00',
        '22.49',
        '1.4',
        '5',
        '18.0',
        '6.0',
        '3.0',
        '2.5',
        'Supplier DEF',
        '18.00',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
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
        
        // Map CSV headers to database field names
        let fieldName = header;
        switch (header) {
          case 'FPS ITEM #':
            fieldName = 'fps_item_number';
            break;
          case 'MFG ITEM #':
            fieldName = 'item_number';
            break;
          case 'UPC':
            fieldName = 'upc';
            break;
          case 'DESCRIPTION':
            fieldName = 'description';
            break;
          case 'SOLUTION':
            fieldName = 'solution';
            break;
          case 'TYPE':
            fieldName = 'type';
            break;
          case 'ITEM STATUS':
            fieldName = 'item_status';
            break;
          case 'NAME':
            fieldName = 'name';
            break;
          case 'SKU':
            fieldName = 'sku';
            break;
          case 'CATEGORY':
            fieldName = 'category';
            break;
          case 'PIECES PER PART':
            fieldName = 'pieces_per_part';
            break;
          case 'MIN ORDER QTY':
            fieldName = 'min_order_qty';
            break;
          case 'QUANTITY IN STOCK':
            fieldName = 'quantity_in_stock';
            break;
          case 'PIECES PER CASE':
            fieldName = 'pieces_per_case';
            break;
          case 'PIECES PER PALLET':
            fieldName = 'pieces_per_pallet';
            break;
          case 'LIST PRICE':
            fieldName = 'list_price';
            break;
          case 'UNIT PRICE':
            fieldName = 'unit_price';
            break;
          case 'COST PRICE':
            fieldName = 'cost_price';
            break;
          case 'FPS SALES PRICE':
            fieldName = 'fps_sales_price';
            break;
          case 'MARKUP PERCENTAGE':
            fieldName = 'markup_percentage';
            break;
          case 'LOW STOCK THRESHOLD':
            fieldName = 'low_stock_threshold';
            break;
          case 'LENGTH':
            fieldName = 'length';
            break;
          case 'WIDTH':
            fieldName = 'width';
            break;
          case 'HEIGHT':
            fieldName = 'height';
            break;
          case 'WEIGHT':
            fieldName = 'weight';
            break;
          case 'SUPPLIER 1 NAME':
            fieldName = 'supplier_1_name';
            break;
          case 'SUPPLIER 1 PRICE':
            fieldName = 'supplier_1_price';
            break;
          case 'SUPPLIER 2 NAME':
            fieldName = 'supplier_2_name';
            break;
          case 'SUPPLIER 2 PRICE':
            fieldName = 'supplier_2_price';
            break;
          case 'SUPPLIER 3 NAME':
            fieldName = 'supplier_3_name';
            break;
          case 'SUPPLIER 3 PRICE':
            fieldName = 'supplier_3_price';
            break;
          case 'SUPPLIER 4 NAME':
            fieldName = 'supplier_4_name';
            break;
          case 'SUPPLIER 4 PRICE':
            fieldName = 'supplier_4_price';
            break;
          case 'SUPPLIER 5 NAME':
            fieldName = 'supplier_5_name';
            break;
          case 'SUPPLIER 5 PRICE':
            fieldName = 'supplier_5_price';
            break;
          case 'SUPERSEDED ITEM':
            fieldName = 'superseded_item';
            break;
        }
        
        // Parse values based on field type
        switch (fieldName) {
          case 'pieces_per_part':
          case 'min_order_qty':
          case 'pieces_per_case':
          case 'pieces_per_pallet':
          case 'low_stock_threshold':
            item[fieldName] = value ? parseInt(value) || null : null;
            break;
          case 'quantity_in_stock':
            item[fieldName] = value ? parseInt(value) || 0 : 0;
            break;
          case 'list_price':
          case 'unit_price':
          case 'cost_price':
          case 'fps_sales_price':
          case 'markup_percentage':
          case 'supplier_1_price':
          case 'supplier_2_price':
          case 'supplier_3_price':
          case 'supplier_4_price':
          case 'supplier_5_price':
          case 'length':
          case 'width':
          case 'height':
          case 'weight':
            item[fieldName] = value ? parseFloat(value) || null : null;
            break;
          default:
            item[fieldName] = value || null;
        }
      });

      if (item.item_number || item.description) {
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
            <p>• First row must contain column headers exactly as shown in template</p>
            <p>• Required: Either ITEM # or DESCRIPTION</p>
            <p>• All other columns are optional</p>
            <p>• Numbers should not contain currency symbols or commas</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryBulkUpload;