import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, MapPin, AlertTriangle, CheckCircle, ExternalLink, Download } from 'lucide-react';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useCustomers } from '@/hooks/useCustomers';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AssessorRecord {
  parcelNumber: string;
  ownerName: string;
  mailingAddress: string;
  propertyAddress: string;
  assessedValue: string;
  lastUpdated: string;
}

interface VerificationResult {
  customer: any;
  assessorRecord: AssessorRecord | null;
  status: 'match' | 'mismatch' | 'not_found' | 'error';
  issues: string[];
}

export default function PropertyVerification() {
  const navigate = useNavigate();
  const { customers } = useCustomers();
  const { toast } = useToast();
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    batchNumber: number;
    progress: number;
    totalRecords: number;
    inserted: number;
    hasMoreBatches: boolean;
  } | null>(null);

  const abbreviateStreetTypes = (address: string): string => {
    const streetTypeMap: Record<string, string> = {
      'Street': 'St',
      'Avenue': 'Ave', 
      'Boulevard': 'Blvd',
      'Drive': 'Dr',
      'Lane': 'Ln',
      'Road': 'Rd',
      'Circle': 'Cir',
      'Court': 'Ct',
      'Place': 'Pl',
      'Way': 'Way',
      'Trail': 'Trl',
      'Parkway': 'Pkwy'
    };

    let abbreviated = address;
    Object.entries(streetTypeMap).forEach(([full, abbrev]) => {
      const regex = new RegExp(`\\b${full}\\b`, 'gi');
      abbreviated = abbreviated.replace(regex, abbrev);
    });
    
    return abbreviated;
  };

  const searchAssessorRecords = async (address: string): Promise<AssessorRecord | null> => {
    try {
      console.log('Calling Pima Assessor lookup for:', address);
      
      // Try original address first
      let result = await attemptAssessorLookup(address);
      
      // If no result, try with abbreviated street types
      if (!result) {
        const abbreviatedAddress = abbreviateStreetTypes(address);
        if (abbreviatedAddress !== address) {
          console.log('Retrying with abbreviated address:', abbreviatedAddress);
          result = await attemptAssessorLookup(abbreviatedAddress);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error calling assessor lookup:', error);
      throw error;
    }
  };

  const attemptAssessorLookup = async (address: string): Promise<AssessorRecord | null> => {
    try {
      console.log('Searching database for address:', address);
      
      // Search the local Pima County database
      const { data, error } = await supabase
        .from('pima_assessor_records')
        .select('*')
        .ilike('property_address', `%${address}%`)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Database error:', error);
        throw error;
      }

      if (data) {
        console.log('Found assessor record:', data);
        return {
          parcelNumber: data.parcel_number,
          ownerName: data.owner_name || 'Unknown',
          mailingAddress: data.mailing_address || data.property_address || '',
          propertyAddress: data.property_address || '',
          assessedValue: data.assessed_value ? `$${data.assessed_value.toLocaleString()}` : 'Unknown',
          lastUpdated: data.updated_at ? new Date(data.updated_at).toLocaleDateString() : 'Unknown'
        };
      }

      console.log('No assessor record found for address:', address);
      return null;
    } catch (error) {
      console.error('Error in assessor lookup attempt:', error);
      throw error;
    }
  };

  const handleImportAssessorData = async (batchNumber = 0) => {
    setIsVerifying(true);
    try {
      if (batchNumber === 0) {
        setImportProgress(null);
        toast({
          title: 'Starting Import',
          description: 'Downloading and processing Pima County data...',
        });
      }

      const { data, error } = await supabase.functions.invoke('import-pima-assessor-data', {
        body: { batchNumber, batchSize: 1000 }
      });

      if (error) {
        throw error;
      }

      setImportProgress({
        batchNumber: data.batchNumber,
        progress: data.progress,
        totalRecords: data.totalRecords,
        inserted: data.inserted,
        hasMoreBatches: data.hasMoreBatches
      });

      if (data.hasMoreBatches) {
        toast({
          title: `Batch ${data.batchNumber + 1} Complete`,
          description: `Imported ${data.inserted} records (${data.progress}% complete)`,
        });
      } else {
        toast({
          title: 'Import Complete',
          description: `Successfully imported all ${data.totalRecords} records!`,
        });
        setImportProgress(null);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import assessor data',
        variant: 'destructive'
      });
      setImportProgress(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleContinueImport = () => {
    if (importProgress?.hasMoreBatches) {
      handleImportAssessorData(importProgress.batchNumber + 1);
    }
  };

  const compareRecords = (customer: any, assessorRecord: AssessorRecord | null): VerificationResult => {
    if (!assessorRecord) {
      return {
        customer,
        assessorRecord: null,
        status: 'not_found',
        issues: ['Property not found in Pima County Assessor records']
      };
    }

    const issues: string[] = [];
    const customerName = `${customer.first_name} ${customer.last_name}`.toUpperCase();
    const assessorName = assessorRecord.ownerName.toUpperCase();

    // Check name match
    if (!assessorName.includes(customer.last_name.toUpperCase())) {
      issues.push(`Name mismatch: Customer "${customerName}" vs Assessor "${assessorName}"`);
    }

    // Check address match (simplified)
    const customerAddress = customer.address?.toUpperCase() || '';
    const assessorAddress = assessorRecord.propertyAddress.toUpperCase();
    
    if (customerAddress && !assessorAddress.includes(customerAddress.split(' ')[0])) {
      issues.push(`Address mismatch: Customer "${customer.address}" vs Assessor "${assessorRecord.propertyAddress}"`);
    }

    return {
      customer,
      assessorRecord,
      status: issues.length === 0 ? 'match' : 'mismatch',
      issues
    };
  };

  const handleVerifyCustomer = async (customer: any) => {
    if (!customer.address) {
      toast({
        title: 'Missing Address',
        description: 'Customer address is required for verification',
        variant: 'destructive'
      });
      return;
    }

    setIsVerifying(true);
    try {
      const assessorRecord = await searchAssessorRecords(customer.address);
      const result = compareRecords(customer, assessorRecord);
      
      setVerificationResults(prev => {
        const filtered = prev.filter(r => r.customer.id !== customer.id);
        return [...filtered, result];
      });

      toast({
        title: 'Verification Complete',
        description: `Checked ${customer.first_name} ${customer.last_name}`,
      });
    } catch (error) {
      toast({
        title: 'Verification Error',
        description: 'Failed to verify property records',
        variant: 'destructive'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBulkVerify = async () => {
    const customersWithAddresses = customers.filter(c => c.address);
    
    if (customersWithAddresses.length === 0) {
      toast({
        title: 'No Addresses Found',
        description: 'No customers have addresses to verify',
        variant: 'destructive'
      });
      return;
    }

    setIsVerifying(true);
    const results: VerificationResult[] = [];

    for (const customer of customersWithAddresses.slice(0, 5)) { // Limit for demo
      try {
        const assessorRecord = await searchAssessorRecords(customer.address);
        const result = compareRecords(customer, assessorRecord);
        results.push(result);
      } catch (error) {
        results.push({
          customer,
          assessorRecord: null,
          status: 'error',
          issues: ['Failed to retrieve assessor data']
        });
      }
    }

    setVerificationResults(results);
    setIsVerifying(false);

    toast({
      title: 'Bulk Verification Complete',
      description: `Verified ${results.length} customers`,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'match':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'mismatch':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'not_found':
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'match':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'mismatch':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'not_found':
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/customers')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Customers
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Property Verification</h1>
              <p className="text-muted-foreground">
                Verify customer records against Pima County Assessor data
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="grid gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Verification Tools
                </CardTitle>
                <CardDescription>
                  Check individual customers or run bulk verification against Pima County Assessor records
                </CardDescription>
              </CardHeader>
               <CardContent className="space-y-4">
                <div className="flex gap-4 flex-wrap">
                  <Button 
                    onClick={handleBulkVerify}
                    disabled={isVerifying}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    {isVerifying ? 'Verifying...' : 'Bulk Verify All Customers'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleImportAssessorData()}
                    disabled={isVerifying}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {importProgress ? 'Importing...' : 'Start Import'}
                  </Button>
                  {importProgress?.hasMoreBatches && (
                    <Button
                      variant="default"
                      onClick={handleContinueImport}
                      disabled={isVerifying}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Continue Import
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => window.open('https://www.asr.pima.gov/search/', '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Assessor Website
                  </Button>
                 </div>
                 
                 {/* Progress Bar */}
                 {importProgress && (
                   <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                       <span>Import Progress</span>
                       <span>{importProgress.progress}%</span>
                     </div>
                     <Progress value={importProgress.progress} className="w-full" />
                     <div className="text-xs text-muted-foreground">
                       Batch {importProgress.batchNumber + 1} • {importProgress.inserted} records imported
                       {importProgress.hasMoreBatches && ' • More batches remaining'}
                     </div>
                   </div>
                 )}
                </CardContent>
            </Card>
          </div>

          {/* Customer List for Individual Verification */}
          <div className="grid gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Customer List</CardTitle>
                <CardDescription>
                  Click "Verify" next to any customer to check their property records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {customers.slice(0, 10).map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {customer.first_name} {customer.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {customer.address ? customer.address : 'No address on file'}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerifyCustomer(customer)}
                        disabled={isVerifying || !customer.address}
                      >
                        Verify
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Verification Results */}
          {verificationResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Verification Results</CardTitle>
                <CardDescription>
                  Comparison between your customer records and Pima County Assessor data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {verificationResults.map((result) => (
                    <div key={result.customer.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {result.customer.first_name} {result.customer.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {result.customer.address}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <Badge className={getStatusColor(result.status)}>
                            {result.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      {result.assessorRecord && (
                        <>
                          <Separator className="my-4" />
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Your Records</h4>
                              <div className="text-sm space-y-1">
                                <p><strong>Name:</strong> {result.customer.first_name} {result.customer.last_name}</p>
                                <p><strong>Address:</strong> {result.customer.address}</p>
                                <p><strong>City/State:</strong> {result.customer.city}, {result.customer.state}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Assessor Records</h4>
                              <div className="text-sm space-y-1">
                                <p><strong>Owner:</strong> {result.assessorRecord.ownerName}</p>
                                <p><strong>Property:</strong> {result.assessorRecord.propertyAddress}</p>
                                <p><strong>Parcel #:</strong> {result.assessorRecord.parcelNumber}</p>
                                <p><strong>Value:</strong> {result.assessorRecord.assessedValue}</p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {result.issues.length > 0 && (
                        <>
                          <Separator className="my-4" />
                          <div>
                            <h4 className="font-medium mb-2 text-red-700">Issues Found</h4>
                            <ul className="text-sm space-y-1">
                              {result.issues.map((issue, index) => (
                                <li key={index} className="text-red-600">• {issue}</li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}