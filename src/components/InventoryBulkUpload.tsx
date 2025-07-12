import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Download, FileText, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UploadResult {
  success: number;
  failed: number;
  errors: string[];
}

interface ColumnMapping {
  csvColumn: string;
  dbField: string;
}

interface ParsedData {
  headers: string[];
  rows: string[][];
}

const InventoryBulkUpload = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Database field options for mapping
  const dbFields = [
    { value: "skip", label: "Skip Column" },
    { value: "fps_item_number", label: "FPS Item #" },
    { value: "item_number", label: "MFG Item #" },
    { value: "upc", label: "UPC" },
    { value: "description", label: "Description" },
    { value: "solution", label: "Solution" },
    { value: "type", label: "Type" },
    { value: "item_status", label: "Item Status" },
    { value: "name", label: "Name" },
    { value: "sku", label: "SKU" },
    { value: "category", label: "Category" },
    { value: "pieces_per_part", label: "Pieces Per Part" },
    { value: "min_order_qty", label: "Min Order Qty" },
    { value: "quantity_in_stock", label: "Quantity in Stock" },
    { value: "pieces_per_case", label: "Pieces Per Case" },
    { value: "pieces_per_pallet", label: "Pieces Per Pallet" },
    { value: "list_price", label: "List Price" },
    { value: "unit_price", label: "Unit Price" },
    { value: "cost_price", label: "Cost Price" },
    { value: "fps_sales_price", label: "FPS Sales Price" },
    { value: "markup_percentage", label: "Markup Percentage" },
    { value: "low_stock_threshold", label: "Low Stock Threshold" },
    { value: "length", label: "Length" },
    { value: "width", label: "Width" },
    { value: "height", label: "Height" },
    { value: "weight", label: "Weight" },
    { value: "supplier_1_name", label: "Supplier 1 Name" },
    { value: "supplier_1_price", label: "Supplier 1 Price" },
    { value: "supplier_2_name", label: "Supplier 2 Name" },
    { value: "supplier_2_price", label: "Supplier 2 Price" },
    { value: "supplier_3_name", label: "Supplier 3 Name" },
    { value: "supplier_3_price", label: "Supplier 3 Price" },
    { value: "supplier_4_name", label: "Supplier 4 Name" },
    { value: "supplier_4_price", label: "Supplier 4 Price" },
    { value: "supplier_5_name", label: "Supplier 5 Name" },
    { value: "supplier_5_price", label: "Supplier 5 Price" },
    { value: "superseded_item", label: "Superseded Item" }
  ];

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

  // Auto-suggest mapping based on header similarity
  const suggestMapping = (csvHeader: string): string => {
    const normalized = csvHeader.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Exact matches first
    for (const field of dbFields) {
      if (field.label.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized) {
        return field.value;
      }
    }
    
    // Partial matches
    for (const field of dbFields) {
      const fieldNormalized = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (fieldNormalized.includes(normalized) || normalized.includes(fieldNormalized)) {
        return field.value;
      }
    }
    
    return 'skip';
  };

  const parseCSVForPreview = (text: string): ParsedData | null => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return null;

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => 
      line.split(',').map(v => v.trim().replace(/"/g, ''))
    );

    return { headers, rows };
  };

  const processDataWithMapping = (): any[] => {
    if (!parsedData) return [];
    
    const items = [];
    for (const row of parsedData.rows) {
      const item: any = { user_id: '' }; // Will be set during upload
      
      columnMappings.forEach((mapping, index) => {
        if (mapping.dbField && mapping.dbField !== 'skip' && row[index] !== undefined) {
          const value = row[index] || '';
          
          // Apply the same data type conversions as before
          if (mapping.dbField === 'quantity_in_stock') {
            // quantity_in_stock is required (NOT NULL), default to 0 for empty values
            const numValue = parseInt(value);
            item[mapping.dbField] = isNaN(numValue) ? 0 : numValue;
          } else if (['pieces_per_part', 'min_order_qty', 'pieces_per_case', 'pieces_per_pallet', 'low_stock_threshold'].includes(mapping.dbField)) {
            // Other integer fields can be null
            const numValue = parseInt(value);
            item[mapping.dbField] = isNaN(numValue) ? null : numValue;
          } else if (['list_price', 'unit_price', 'cost_price', 'fps_sales_price', 'markup_percentage', 'length', 'width', 'height', 'weight', 'supplier_1_price', 'supplier_2_price', 'supplier_3_price', 'supplier_4_price', 'supplier_5_price'].includes(mapping.dbField)) {
            // Numeric fields can be null
            const numValue = parseFloat(value);
            item[mapping.dbField] = isNaN(numValue) ? null : numValue;
          } else {
            // Text fields
            item[mapping.dbField] = value || null;
          }
        }
      });
      
      items.push(item);
    }

    return items;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setUploadResult(null);
      
      // Parse file for preview
      const text = await file.text();
      const parsed = parseCSVForPreview(text);
      
      if (parsed) {
        setParsedData(parsed);
        
        // Auto-suggest mappings
        const mappings = parsed.headers.map(header => ({
          csvColumn: header,
          dbField: suggestMapping(header)
        }));
        setColumnMappings(mappings);
        setShowPreview(true);
      }
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const updateMapping = (index: number, dbField: string) => {
    const updated = [...columnMappings];
    updated[index].dbField = dbField;
    setColumnMappings(updated);
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !parsedData) throw new Error("No file selected or parsed");

      const items = processDataWithMapping();

      if (items.length === 0) {
        throw new Error("No valid data found in CSV file");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

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

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Inventory Items</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="csvFile">Select CSV File</Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="mt-1"
              />
            </div>

            {selectedFile && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </AlertDescription>
              </Alert>
            )}
          </div>

          {showPreview && parsedData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Column Mapping</h3>
                <Button 
                  onClick={() => {
                    setShowPreview(false);
                    setParsedData(null);
                    setColumnMappings([]);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Start Over
                </Button>
              </div>
              
              <Alert>
                <AlertDescription>
                  Map your CSV columns to database fields. Columns can be skipped if not needed.
                </AlertDescription>
              </Alert>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CSV Column</TableHead>
                      <TableHead>Sample Data</TableHead>
                      <TableHead></TableHead>
                      <TableHead>Database Field</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {columnMappings.map((mapping, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {mapping.csvColumn}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {parsedData.rows[0]?.[index] || 'N/A'}
                        </TableCell>
                        <TableCell className="text-center">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={mapping.dbField}
                            onValueChange={(value) => updateMapping(index, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select field..." />
                            </SelectTrigger>
                            <SelectContent>
                              {dbFields.map((field) => (
                                <SelectItem key={field.value} value={field.value}>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-medium mb-2">Data Preview ({parsedData.rows.length} rows)</h4>
                <div className="text-sm text-muted-foreground mb-2">
                  Showing first 3 rows with current mapping:
                </div>
                <div className="border rounded-lg bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columnMappings
                          .filter(m => m.dbField && m.dbField !== 'skip')
                          .map((mapping, index) => (
                            <TableHead key={index} className="text-xs">
                              {dbFields.find(f => f.value === mapping.dbField)?.label || mapping.dbField}
                            </TableHead>
                          ))
                        }
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.rows.slice(0, 3).map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {columnMappings
                            .filter(m => m.dbField && m.dbField !== 'skip')
                            .map((mapping, colIndex) => {
                              const originalIndex = columnMappings.findIndex(m => m === mapping);
                              return (
                                <TableCell key={colIndex} className="text-xs">
                                  {row[originalIndex] || '—'}
                                </TableCell>
                              );
                            })
                          }
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={downloadTemplate} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
            
            {selectedFile && showPreview && (
              <Button 
                onClick={() => uploadMutation.mutate()}
                disabled={uploadMutation.isPending || !columnMappings.some(m => m.dbField && m.dbField !== 'skip')}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {uploadMutation.isPending ? "Uploading..." : "Upload Data"}
              </Button>
            )}
          </div>

          {uploadResult && (
            <Alert className={uploadResult.failed === 0 ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
              {uploadResult.failed === 0 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-yellow-600" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <div>
                    Successfully uploaded: {uploadResult.success} items
                    {uploadResult.failed > 0 && (
                      <span className="text-red-600 ml-2">
                        Failed: {uploadResult.failed} items
                      </span>
                    )}
                  </div>
                  {uploadResult.errors.length > 0 && (
                    <div className="text-sm text-red-600">
                      <div className="font-medium">Errors:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {uploadResult.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {uploadResult.errors.length > 5 && (
                          <li>... and {uploadResult.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryBulkUpload;