import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, MapPin, AlertTriangle, CheckCircle, ExternalLink, Download, Edit2, Save, X, Users, ShieldCheck } from 'lucide-react';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useCustomers } from '@/hooks/useCustomers';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AssessorRecord {
  id?: string;
  parcelNumber: string;
  ownerName: string;
  mailingAddress: string;
  propertyAddress: string;
  assessedValue: string;
  lastUpdated: string;
  updatedOwnerName?: string;
  isOwnerUpdated?: boolean;
  ownerUpdatedAt?: string;
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
  const { user } = useAuth();
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [editingOwner, setEditingOwner] = useState<string | null>(null);
  const [editOwnerName, setEditOwnerName] = useState('');
  const [showUpdateCustomerDialog, setShowUpdateCustomerDialog] = useState(false);
  const [currentAssessorRecord, setCurrentAssessorRecord] = useState<AssessorRecord | null>(null);
  const [matchingCustomer, setMatchingCustomer] = useState<any>(null);
  const [importProgress, setImportProgress] = useState<{
    batchNumber: number;
    progress: number;
    totalRecords: number;
    inserted: number;
    hasMoreBatches: boolean;
  } | null>(null);

  const normalizeText = (text: string): string => {
    return text
      .toUpperCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  const normalizeAddress = (address: string): string => {
    const streetTypeMap: Record<string, string[]> = {
      'ST': ['STREET', 'ST'],
      'AVE': ['AVENUE', 'AVE'],
      'BLVD': ['BOULEVARD', 'BLVD'],
      'DR': ['DRIVE', 'DR'],
      'LN': ['LANE', 'LN'],
      'RD': ['ROAD', 'RD'],
      'CIR': ['CIRCLE', 'CIR'],
      'CT': ['COURT', 'CT'],
      'PL': ['PLACE', 'PL'],
      'WAY': ['WAY'],
      'TRL': ['TRAIL', 'TRL'],
      'PKWY': ['PARKWAY', 'PKWY'],
      'LOOP': ['LOOP'],
      'PASS': ['PASS'],
      'RIDGE': ['RIDGE'],
      'TERRACE': ['TERRACE', 'TER'],
      'PLAZA': ['PLAZA', 'PLZ']
    };

    let normalized = normalizeText(address);
    
    // Standardize street types
    Object.entries(streetTypeMap).forEach(([standard, variants]) => {
      variants.forEach(variant => {
        const regex = new RegExp(`\\b${variant}\\b`, 'g');
        normalized = normalized.replace(regex, standard);
      });
    });
    
    return normalized;
  };

  const normalizeName = (name: string): string => {
    return normalizeText(name)
      .replace(/\b(JR|SR|III|II|IV)\b/g, '') // Remove suffixes
      .replace(/\s+/g, ' ')
      .trim();
  };

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
      
      // Search both Mail2 and Mail3 fields using OR condition
      const { data, error } = await supabase
        .from('pima_assessor_records')
        .select('*')
        .or(`Mail2.ilike.%${address}%,Mail3.ilike.%${address}%`)
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Database error:', error);
        throw error;
      }

      if (data) {
        console.log('Found assessor record:', data);
        
        // Combine mailing address fields (using uppercase column names from actual DB)
        const mailingAddress = [(data as any).Mail1, (data as any).Mail2, (data as any).Mail3, (data as any).Mail4, (data as any).Mail5]
          .filter(Boolean)
          .join(' ');
        
        // Combine zip fields (using uppercase column names)
        const zipCode = data.Zip4 ? `${data.Zip}-${data.Zip4}` : data.Zip;
        
        // Determine property address - use Mail3 if Mail2 contains "ATTN:"
        let propertyAddress = (data as any).Mail2 || '';
        if (propertyAddress.toUpperCase().includes('ATTN:')) {
          propertyAddress = (data as any).Mail3 || '';
        }
        
        return {
          id: data.id,
          parcelNumber: data.Parcel || 'Unknown',
          ownerName: data.Mail1 || 'Unknown',
          mailingAddress: mailingAddress || '',
          propertyAddress: propertyAddress,
          assessedValue: 'Unknown',
          lastUpdated: data.updated_at ? new Date(data.updated_at).toLocaleDateString() : 'Unknown',
          updatedOwnerName: data.updated_owner_name,
          isOwnerUpdated: data.is_owner_updated,
          ownerUpdatedAt: data.owner_updated_at ? new Date(data.owner_updated_at).toLocaleDateString() : undefined
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
          description: `Successfully imported all ${data.totalRecords} records! You can now run bulk verification.`,
        });
        setImportProgress({
          batchNumber: data.batchNumber,
          progress: 100,
          totalRecords: data.totalRecords,
          inserted: data.inserted,
          hasMoreBatches: false
        });
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
    
    // Normalize names for comparison
    const customerFirstName = normalizeName(customer.first_name || '');
    const customerLastName = normalizeName(customer.last_name || '');
    const customerFullName = `${customerFirstName} ${customerLastName}`.trim();
    const assessorName = normalizeName(assessorRecord.ownerName || '');

    // Check name match - look for individual name parts in assessor record
    const hasFirstName = customerFirstName && assessorName.includes(customerFirstName);
    const hasLastName = customerLastName && assessorName.includes(customerLastName);
    
    if (!hasFirstName && !hasLastName && customerFullName && assessorName) {
      // Also try splitting assessor name and checking for partial matches
      const assessorNameParts = assessorName.split(' ');
      const customerNameParts = customerFullName.split(' ');
      
      const hasAnyMatch = customerNameParts.some(customerPart => 
        assessorNameParts.some(assessorPart => 
          customerPart.length > 2 && assessorPart.includes(customerPart)
        )
      );
      
      if (!hasAnyMatch) {
        issues.push(`Name mismatch: Customer "${customer.first_name} ${customer.last_name}" vs Assessor "${assessorRecord.ownerName}"`);
      }
    }

    // Check address match with normalization
    if (customer.address && assessorRecord.propertyAddress) {
      const customerAddress = normalizeAddress(customer.address);
      const assessorAddress = normalizeAddress(assessorRecord.propertyAddress);
      
      // Extract house number from customer address
      const customerHouseNumber = customerAddress.split(' ')[0];
      const assessorHouseNumber = assessorAddress.split(' ')[0];
      
      // Check if house numbers match and if any significant part of the street name matches
      const houseNumberMatch = customerHouseNumber === assessorHouseNumber;
      const streetMatch = customerAddress.split(' ').slice(1).some(part => 
        part.length > 2 && assessorAddress.includes(part)
      );
      
      if (!houseNumberMatch || !streetMatch) {
        issues.push(`Address mismatch: Customer "${customer.address}" vs Assessor "${assessorRecord.propertyAddress}"`);
      }
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

  const handleEditOwner = (assessorRecord: AssessorRecord) => {
    if (!assessorRecord.id) return;
    setEditingOwner(assessorRecord.id);
    setEditOwnerName(assessorRecord.updatedOwnerName || assessorRecord.ownerName);
  };

  const handleSaveOwnerName = async (assessorRecordId: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('pima_assessor_records')
        .update({
          updated_owner_name: editOwnerName,
          is_owner_updated: true,
          owner_updated_at: new Date().toISOString(),
          owner_updated_by: user.id
        })
        .eq('id', assessorRecordId);

      if (error) throw error;

      // Update the verification results to reflect the change
      setVerificationResults(prev => 
        prev.map(result => {
          if (result.assessorRecord?.id === assessorRecordId) {
            return {
              ...result,
              assessorRecord: {
                ...result.assessorRecord,
                updatedOwnerName: editOwnerName,
                isOwnerUpdated: true,
                ownerUpdatedAt: new Date().toLocaleDateString()
              }
            };
          }
          return result;
        })
      );

      setEditingOwner(null);
      setEditOwnerName('');

      toast({
        title: 'Owner Updated',
        description: 'Property owner name has been updated successfully',
      });
    } catch (error) {
      console.error('Error updating owner:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update owner name',
        variant: 'destructive'
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingOwner(null);
    setEditOwnerName('');
  };

  const handleUpdateCustomer = (assessorRecord: AssessorRecord, customer: any) => {
    setCurrentAssessorRecord(assessorRecord);
    setMatchingCustomer(customer);
    setShowUpdateCustomerDialog(true);
  };

  const handleMarkAsVerified = async (customer: any) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          owner_verified_at: new Date().toISOString(),
          owner_verified_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', customer.id);

      if (error) throw error;

      // Remove this customer from verification results
      setVerificationResults(prev => prev.filter(result => result.customer.id !== customer.id));

      toast({
        title: 'Owner Verified',
        description: `${customer.first_name} ${customer.last_name} has been marked as owner verified`,
      });
    } catch (error) {
      console.error('Error marking customer as verified:', error);
      toast({
        title: 'Verification Failed',
        description: 'Failed to mark customer as owner verified',
        variant: 'destructive'
      });
    }
  };

  const handleConfirmCustomerUpdate = async () => {
    if (!currentAssessorRecord || !matchingCustomer || !user?.id) return;

    const newOwnerName = currentAssessorRecord.updatedOwnerName || currentAssessorRecord.ownerName;
    const names = newOwnerName.split(' ');
    const firstName = names[0] || '';
    const lastName = names.slice(1).join(' ') || '';

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          previous_first_name: matchingCustomer.first_name,
          previous_last_name: matchingCustomer.last_name,
          first_name: firstName,
          last_name: lastName,
          owner_changed_date: new Date().toISOString(),
          owner_changed_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', matchingCustomer.id);

      if (error) throw error;

      // Update the verification results to reflect the customer change
      setVerificationResults(prev => 
        prev.map(result => {
          if (result.customer.id === matchingCustomer.id) {
            return {
              ...result,
              customer: {
                ...result.customer,
                previous_first_name: matchingCustomer.first_name,
                previous_last_name: matchingCustomer.last_name,
                first_name: firstName,
                last_name: lastName,
                owner_changed_date: new Date().toISOString()
              }
            };
          }
          return result;
        })
      );

      setShowUpdateCustomerDialog(false);
      setCurrentAssessorRecord(null);
      setMatchingCustomer(null);

      toast({
        title: 'Customer Updated',
        description: `Customer record updated to ${firstName} ${lastName}. Previous owner information has been preserved.`,
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update customer record',
        variant: 'destructive'
      });
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
                  {customers.filter(c => c.address && !c.owner_verified_at).map((customer) => (
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
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium flex items-center gap-2">
                                    Assessor Records
                                    {result.assessorRecord.id && (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditOwner(result.assessorRecord!)}
                                          className="h-6 w-6 p-0"
                                          title="Edit assessor owner name"
                                        >
                                          <Edit2 className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleUpdateCustomer(result.assessorRecord!, result.customer)}
                                          className="h-6 w-6 p-0"
                                          title="Update customer with new owner"
                                        >
                                          <Users className="h-3 w-3" />
                                        </Button>
                                      </>
                                    )}
                                  </h4>
                                  {result.status === 'match' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleMarkAsVerified(result.customer)}
                                      className="text-green-700 border-green-300 hover:bg-green-50"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Mark as Owner Verified
                                    </Button>
                                  )}
                                </div>
                              <div className="text-sm space-y-1">
                                <div className="flex items-center gap-2">
                                  <strong>Owner:</strong>
                                  {editingOwner === result.assessorRecord.id ? (
                                    <div className="flex items-center gap-2 flex-1">
                                      <Input
                                        value={editOwnerName}
                                        onChange={(e) => setEditOwnerName(e.target.value)}
                                        className="h-7 flex-1"
                                        placeholder="Enter owner name"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSaveOwnerName(result.assessorRecord!.id!)}
                                        className="h-7 w-7 p-0"
                                      >
                                        <Save className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCancelEdit}
                                        className="h-7 w-7 p-0"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className={result.assessorRecord.isOwnerUpdated ? 'line-through text-muted-foreground' : ''}>
                                        {result.assessorRecord.ownerName}
                                      </span>
                                      {result.assessorRecord.isOwnerUpdated && (
                                        <>
                                          <span className="text-blue-600 font-medium">
                                            {result.assessorRecord.updatedOwnerName}
                                          </span>
                                          <Badge variant="secondary" className="text-xs">
                                            Not Original Owner
                                          </Badge>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <p><strong>Property:</strong> {result.assessorRecord.propertyAddress}</p>
                                <p><strong>Parcel #:</strong> {result.assessorRecord.parcelNumber}</p>
                                <p><strong>Value:</strong> {result.assessorRecord.assessedValue}</p>
                                {result.assessorRecord.isOwnerUpdated && result.assessorRecord.ownerUpdatedAt && (
                                  <p className="text-xs text-muted-foreground">
                                    <strong>Owner updated on:</strong> {result.assessorRecord.ownerUpdatedAt}
                                  </p>
                                )}
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

          {/* Update Customer Dialog */}
          <Dialog open={showUpdateCustomerDialog} onOpenChange={setShowUpdateCustomerDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Customer Record</DialogTitle>
                <DialogDescription>
                  This will update your customer record with the new owner information from the assessor data.
                  The previous owner information will be preserved for your records.
                </DialogDescription>
              </DialogHeader>
              
              {currentAssessorRecord && matchingCustomer && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-sm text-muted-foreground mb-2">Current Customer</h5>
                      <p className="font-medium">{matchingCustomer.first_name} {matchingCustomer.last_name}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm text-muted-foreground mb-2">New Owner (from Assessor)</h5>
                      <p className="font-medium">{currentAssessorRecord.updatedOwnerName || currentAssessorRecord.ownerName}</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">What will happen:</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Customer name will be updated to the new owner</li>
                      <li>• Previous owner information will be saved in history fields</li>
                      <li>• Owner change date and user will be recorded</li>
                      <li>• All service history will remain linked to this property</li>
                    </ul>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowUpdateCustomerDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleConfirmCustomerUpdate}>
                  Update Customer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </ProtectedRoute>
  );
}