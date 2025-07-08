
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';

interface CustomerData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
}

interface BulkUploadResult {
  success: number;
  errors: { row: number; error: string }[];
}

interface CustomerBulkUploadProps {
  onSuccess: () => void;
}

export const CustomerBulkUpload = ({ onSuccess }: CustomerBulkUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const downloadTemplate = () => {
    const headers = [
      'first_name',
      'last_name', 
      'email',
      'phone',
      'company',
      'address',
      'city',
      'state',
      'zip_code',
      'notes'
    ];
    
    const sampleData = [
      'John,Doe,john.doe@email.com,(555) 123-4567,Acme Inc,123 Main St,New York,NY,10001,VIP customer'
    ];
    
    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Handle escaped quotes
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    
    return result;
  };

  const removeQuotes = (value: string): string => {
    return value.replace(/^"(.+)"$/, '$1').replace(/""/g, '"');
  };

  const parseCSV = (text: string): CustomerData[] => {
    const lines = text.trim().split('\n');
    const headers = parseCSVLine(lines[0]).map(h => removeQuotes(h).trim().toLowerCase());
    
    const expectedHeaders = ['first_name', 'last_name'];
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }
    
    return lines.slice(1).map((line, index) => {
      const values = parseCSVLine(line).map(v => removeQuotes(v));
      const customer: CustomerData = {
        first_name: '',
        last_name: ''
      };
      
      headers.forEach((header, i) => {
        const value = values[i] || '';
        if (header in customer || ['email', 'phone', 'company', 'address', 'city', 'state', 'zip_code', 'notes'].includes(header)) {
          (customer as any)[header] = value || undefined;
        }
      });
      
      if (!customer.first_name || !customer.last_name) {
        throw new Error(`Row ${index + 2}: first_name and last_name are required`);
      }
      
      return customer;
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a CSV file',
          variant: 'destructive'
        });
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    setResult(null);

    try {
      const text = await file.text();
      const customers = parseCSV(text);
      
      const results: BulkUploadResult = {
        success: 0,
        errors: []
      };

      for (let i = 0; i < customers.length; i++) {
        try {
          const customerData = {
            ...customers[i],
            user_id: user.id,
            email: customers[i].email || null,
            phone: customers[i].phone || null,
            company: customers[i].company || null,
            address: customers[i].address || null,
            city: customers[i].city || null,
            state: customers[i].state || null,
            zip_code: customers[i].zip_code || null,
            notes: customers[i].notes || null,
          };

          const { error } = await supabase
            .from('customers')
            .insert(customerData);

          if (error) {
            results.errors.push({
              row: i + 2,
              error: error.message
            });
          } else {
            results.success++;
          }
        } catch (error) {
          results.errors.push({
            row: i + 2,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      setResult(results);
      
      if (results.success > 0) {
        toast({
          title: 'Upload completed',
          description: `Successfully uploaded ${results.success} customers${results.errors.length > 0 ? ` with ${results.errors.length} errors` : ''}`,
        });
        onSuccess();
      }

      if (results.errors.length > 0 && results.success === 0) {
        toast({
          title: 'Upload failed',
          description: 'No customers were uploaded due to errors',
          variant: 'destructive'
        });
      }

    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to process file',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Upload Customers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
          <p className="text-sm text-muted-foreground">
            Download a CSV template to get started
          </p>
        </div>

        <div className="space-y-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload Customers'}
          </Button>
          {(file || result) && (
            <Button variant="outline" onClick={resetUpload} disabled={uploading}>
              Reset
            </Button>
          )}
        </div>

        {result && (
          <div className="space-y-3">
            {result.success > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Successfully uploaded {result.success} customers
                </AlertDescription>
              </Alert>
            )}
            
            {result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">{result.errors.length} errors occurred:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {result.errors.map((error, index) => (
                        <div key={index} className="text-sm">
                          Row {error.row}: {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>CSV Format Requirements:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Required columns: first_name, last_name</li>
            <li>Optional columns: email, phone, company, address, city, state, zip_code, notes</li>
            <li>Use comma-separated values</li>
            <li>Include header row with column names</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
