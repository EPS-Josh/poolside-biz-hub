import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, MapPin, AlertTriangle, CheckCircle, ExternalLink, Download, Edit2, Save, X, Users, ShieldCheck } from 'lucide-react';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const { customers, fetchCustomers } = useCustomers();
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
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [importProgress, setImportProgress] = useState<{
    batchNumber: number;
    progress: number;
    totalRecords: number;
    inserted: number;
    hasMoreBatches: boolean;
  } | null>(null);
  const [showSelectAssessorDialog, setShowSelectAssessorDialog] = useState(false);
  const [assessorOptions, setAssessorOptions] = useState<AssessorRecord[]>([]);
  const [pendingCustomer, setPendingCustomer] = useState<any>(null);
  const [updatingMailingFor, setUpdatingMailingFor] = useState<string | null>(null);

  // Local filtering within suggested options
  const [assessorSearch, setAssessorSearch] = useState('');
  const filteredAssessorOptions = assessorOptions.filter((o) => {
    const q = assessorSearch.trim().toLowerCase();
    if (!q) return true;
    const hay = [o.ownerName, o.updatedOwnerName, o.propertyAddress, o.parcelNumber]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });

  // Global search across entire assessor database
  const [showGlobalAssessorSearch, setShowGlobalAssessorSearch] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<AssessorRecord[]>([]);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [globalSearchPage, setGlobalSearchPage] = useState(0);
  const GLOBAL_PAGE_SIZE = 50;
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

  // Helper: extract numeric house number from a string
  const extractHouseNumber = (text?: string | null): string | null => {
    if (!text) return null;
    const match = String(text).match(/\b(\d{1,6})[A-Z]?\b/);
    return match ? match[1] : null;
  };

  // Helper: map DB row to AssessorRecord shape used in UI
  const mapDbRowToAssessorRecord = (data: any): AssessorRecord => {
    const mailingAddress = [data.Mail1, data.Mail2, data.Mail3, data.Mail4, data.Mail5]
      .filter(Boolean)
      .join(' ');
    let propertyAddress = data.Mail2 || '';
    if (String(propertyAddress).toUpperCase().includes('ATTN:')) {
      propertyAddress = data.Mail3 || '';
    }
    return {
      id: data.id,
      parcelNumber: data.Parcel || 'Unknown',
      ownerName: data.Mail1 || 'Unknown',
      mailingAddress: mailingAddress || '',
      propertyAddress,
      assessedValue: 'Unknown',
      lastUpdated: data.updated_at ? new Date(data.updated_at).toLocaleDateString() : 'Unknown',
      updatedOwnerName: data.updated_owner_name,
      isOwnerUpdated: data.is_owner_updated,
      ownerUpdatedAt: data.owner_updated_at ? new Date(data.owner_updated_at).toLocaleDateString() : undefined,
    };
  };

  // Step 1: find candidates where owner name contains the last name (avoid street-line false matches)
  const findAssessorCandidatesByLastName = async (lastName: string) => {
    const { data, error } = await supabase
      .from('pima_assessor_records')
      .select('*')
      .or(`Mail1.ilike.%${lastName}%,updated_owner_name.ilike.%${lastName}%`)
      
    if (error) throw error;
    return (data || []) as any[];
  };

  // Global assessor search helpers
  const resetGlobalAssessorSearch = () => {
    setShowGlobalAssessorSearch(false);
    setGlobalSearchQuery('');
    setGlobalSearchResults([]);
    setGlobalSearchPage(0);
    setGlobalSearchLoading(false);
    setAssessorSearch('');
  };

  const runGlobalAssessorSearch = async (page = 0) => {
    try {
      const q = globalSearchQuery.trim();
      setGlobalSearchLoading(true);
      if (!q) {
        setGlobalSearchResults([]);
        setGlobalSearchLoading(false);
        return;
      }
      const from = page * GLOBAL_PAGE_SIZE;
      const to = from + GLOBAL_PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from('pima_assessor_records')
        .select('*')
        .or(`Mail1.ilike.%${q}%,updated_owner_name.ilike.%${q}%,Mail2.ilike.%${q}%,Mail3.ilike.%${q}%,Parcel.ilike.%${q}%`)
        .range(from, to);
      if (error) throw error;
      const options = (data || []).map(mapDbRowToAssessorRecord);
      setGlobalSearchResults(options);
      setGlobalSearchPage(page);
    } catch (e) {
      console.error('Global assessor search failed:', e);
      toast({ title: 'Search failed', description: 'Could not search assessor database', variant: 'destructive' });
    } finally {
      setGlobalSearchLoading(false);
    }
  };

  // Finalize selection from the suggestion dialog
  const finalizeAssessorSelection = (record: AssessorRecord) => {
    if (!pendingCustomer) return;
    const result = compareRecords(pendingCustomer, record);
    setVerificationResults(prev => {
      const filtered = prev.filter(r => r.customer.id !== pendingCustomer.id);
      return [...filtered, result];
    });
    setShowSelectAssessorDialog(false);
    setAssessorOptions([]);
    setPendingCustomer(null);
    resetGlobalAssessorSearch();
    toast({ title: 'Verification Complete', description: `Selected record for ${pendingCustomer.first_name} ${pendingCustomer.last_name}` });
  };

  const handleNoAssessorSelection = () => {
    if (!pendingCustomer) return;
    const result: VerificationResult = {
      customer: pendingCustomer,
      assessorRecord: null,
      status: 'not_found',
      issues: ['No suitable assessor record selected'],
    };
    setVerificationResults(prev => {
      const filtered = prev.filter(r => r.customer.id !== pendingCustomer.id);
      return [...filtered, result];
    });
    setShowSelectAssessorDialog(false);
    setAssessorOptions([]);
    setPendingCustomer(null);
    resetGlobalAssessorSearch();
  };

  const cancelAssessorSelection = () => {
    setShowSelectAssessorDialog(false);
    setAssessorOptions([]);
    setPendingCustomer(null);
    resetGlobalAssessorSearch();
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
      // Step 1: try address match first (gracefully handle errors)
      let byAddress: AssessorRecord | null = null;
      try {
        byAddress = await searchAssessorRecords(customer.address);
      } catch (e) {
        console.warn('Address search failed, falling back to last name:', e);
      }
      if (byAddress) {
        const result = compareRecords(customer, byAddress);
        setVerificationResults(prev => {
          const filtered = prev.filter(r => r.customer.id !== customer.id);
          return [...filtered, result];
        });
        toast({ title: 'Verification Complete', description: `Checked ${customer.first_name} ${customer.last_name}` });
        setIsVerifying(false);
        return;
      }

      // Step 2: fallback to last name match if address not found
      const lastName = normalizeName(customer.last_name || '');
      if (!lastName) {
        const result: VerificationResult = {
          customer,
          assessorRecord: null,
          status: 'not_found',
          issues: ['No assessor records matched the address']
        };
        setVerificationResults(prev => {
          const filtered = prev.filter(r => r.customer.id !== customer.id);
          return [...filtered, result];
        });
        setIsVerifying(false);
        return;
      }

      // Step 3: last name candidates (Mail1 or updated_owner_name)
      const initialRows = await findAssessorCandidatesByLastName(lastName);
      if (initialRows.length === 0) {
        const result: VerificationResult = {
          customer,
          assessorRecord: null,
          status: 'not_found',
          issues: ['No assessor records matched the last name']
        };
        setVerificationResults(prev => {
          const filtered = prev.filter(r => r.customer.id !== customer.id);
          return [...filtered, result];
        });
        setIsVerifying(false);
        return;
      }

      if (initialRows.length === 1) {
        const assessorRecord = mapDbRowToAssessorRecord(initialRows[0]);
        const result = compareRecords(customer, assessorRecord);
        setVerificationResults(prev => {
          const filtered = prev.filter(r => r.customer.id !== customer.id);
          return [...filtered, result];
        });
        toast({ title: 'Verification Complete', description: `Checked ${customer.first_name} ${customer.last_name}` });
        setIsVerifying(false);
        return;
      }

      // Step 2: disambiguate by house number from Mail2/3/4
      const customerHouse = extractHouseNumber(customer.address);
      const filteredRows = initialRows.filter(r => {
        const h2 = extractHouseNumber(r.Mail2);
        const h3 = extractHouseNumber(r.Mail3);
        const h4 = extractHouseNumber(r.Mail4);
        return customerHouse && (customerHouse === h2 || customerHouse === h3 || customerHouse === h4);
      });

      if (filteredRows.length === 1) {
        const assessorRecord = mapDbRowToAssessorRecord(filteredRows[0]);
        const result = compareRecords(customer, assessorRecord);
        setVerificationResults(prev => {
          const filtered = prev.filter(r => r.customer.id !== customer.id);
          return [...filtered, result];
        });
        toast({ title: 'Verification Complete', description: `Checked ${customer.first_name} ${customer.last_name}` });
        setIsVerifying(false);
        return;
      }

      // Step 3: Show suggestions to the user (show ALL possible matches)
      const options = initialRows
        .map(mapDbRowToAssessorRecord)
        .sort((a, b) => {
          const ln = normalizeName(customer.last_name || '');
          const aName = normalizeName(a.updatedOwnerName || a.ownerName || '');
          const bName = normalizeName(b.updatedOwnerName || b.ownerName || '');
          const score = (name: string) => {
            if (!ln) return 0;
            const parts = name.split(' ');
            const exact = parts.includes(ln) ? 2 : 0;
            const partial = exact ? 0 : (name.includes(ln) ? 1 : 0);
            return exact + partial;
          };
          return score(bName) - score(aName);
        });
      setAssessorOptions(options);
      setPendingCustomer(customer);
      setShowSelectAssessorDialog(true);
      setIsVerifying(false);
    } catch (error) {
      toast({
        title: 'Verification Error',
        description: 'Failed to verify property records',
        variant: 'destructive'
      });
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
        // Step 1: try address match first
        const byAddress = await searchAssessorRecords(customer.address);
        if (byAddress) {
          results.push(compareRecords(customer, byAddress));
          continue;
        }

        // Step 2: fallback to last name
        const lastName = normalizeName(customer.last_name || '');
        if (!lastName) {
          results.push(compareRecords(customer, null));
          continue;
        }

        // Step 3: last name candidates
        const initialRows = await findAssessorCandidatesByLastName(lastName);
        if (initialRows.length === 0) {
          results.push({
            customer,
            assessorRecord: null,
            status: 'not_found',
            issues: ['No assessor records matched the last name']
          });
          continue;
        }

        if (initialRows.length === 1) {
          results.push(compareRecords(customer, mapDbRowToAssessorRecord(initialRows[0])));
          continue;
        }

        const customerHouse = extractHouseNumber(customer.address);
        const filteredRows = initialRows.filter(r => {
          const h2 = extractHouseNumber(r.Mail2);
          const h3 = extractHouseNumber(r.Mail3);
          const h4 = extractHouseNumber(r.Mail4);
          return customerHouse && (customerHouse === h2 || customerHouse === h3 || customerHouse === h4);
        });

        if (filteredRows.length === 1) {
          results.push(compareRecords(customer, mapDbRowToAssessorRecord(filteredRows[0])));
        } else {
          results.push({
            customer,
            assessorRecord: null,
            status: 'mismatch',
            issues: ['Multiple possible matches found; manual selection required']
          });
        }
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

  const toTitleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  const extractCityStateZipFromLines = (lines: (string | null | undefined)[], zipRaw?: string | null, zip4Raw?: string | null) => {
    let city = '';
    let state = '';
    let zip = '';
    if (zipRaw) {
      zip = zip4Raw ? `${zipRaw}-${zip4Raw}` : zipRaw;
    }
    for (const ln of lines) {
      const line = (ln || '').toUpperCase().trim();
      if (!line) continue;
      let m = line.match(/^(.+?)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
      if (m) {
        return { city: toTitleCase(m[1]), state: m[2], zip: m[3] };
      }
      m = line.match(/^(.+?)\s+([A-Z]{2})$/);
      if (m && zip) {
        return { city: toTitleCase(m[1]), state: m[2], zip };
      }
    }
    return { city: '', state: '', zip };
  };

  const chooseAddressLine = (mail2?: string | null, mail3?: string | null) => {
    const m2 = (mail2 || '').trim();
    const m3 = (mail3 || '').trim();
    if (m2.toUpperCase().includes('ATTN')) return m3 || m2;
    // Prefer the one that looks like a street address (has a number)
    if (/\d/.test(m2)) return m2 || m3;
    if (/\d/.test(m3)) return m3 || m2;
    return m2 || m3 || '';
  };

  const handleUseAssessorMailingAddress = async (assessor: AssessorRecord, customer: any) => {
    try {
      setUpdatingMailingFor(customer.id);
      let address = '';
      let city = '';
      let state = '';
      let zip = '';
      if (assessor.id) {
        const { data, error } = await supabase
          .from('pima_assessor_records')
          .select('Mail1,Mail2,Mail3,Mail4,Mail5,Zip,Zip4')
          .eq('id', assessor.id)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) {
          address = chooseAddressLine((data as any).Mail2, (data as any).Mail3);
          const parts = extractCityStateZipFromLines([(data as any).Mail4, (data as any).Mail3, (data as any).Mail5], (data as any).Zip, (data as any).Zip4);
          city = parts.city;
          state = parts.state;
          zip = parts.zip || ((data as any).Zip4 ? `${(data as any).Zip}-${(data as any).Zip4}` : (data as any).Zip) || '';
        }
      }
      // Fallback from concatenated mailingAddress if needed
      if (!address && assessor.mailingAddress) {
        const tokens = assessor.mailingAddress.split(/\s{2,}|,/);
        address = tokens[1] || tokens[0];
        const m = assessor.mailingAddress.toUpperCase().match(/([A-Z][A-Z])\s+(\d{5}(?:-\d{4})?)\s*$/);
        if (m) {
          state = m[1];
          zip = m[2];
          const before = assessor.mailingAddress.substring(0, assessor.mailingAddress.toUpperCase().lastIndexOf(m[0])).trim();
          const cityGuess = before.split(/\s+/).slice(-1)[0] || '';
          city = city || toTitleCase(cityGuess);
        }
      }
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          mailing_address: address || null,
          mailing_city: city || null,
          mailing_state: state || null,
          mailing_zip_code: zip || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', customer.id);
      if (updateError) throw updateError;

      // Mark as owner verified and remove from results/list
      const { error: verifyError } = await supabase
        .from('customers')
        .update({
          owner_verified_at: new Date().toISOString(),
          owner_verified_by: user!.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', customer.id);
      if (verifyError) throw verifyError;

      // Remove this entry from the verification results and refresh the customer list
      setVerificationResults(prev => prev.filter(r => r.customer.id !== customer.id));
      fetchCustomers?.();

      toast({
        title: 'Verified and Updated',
        description: 'Mailing address set from assessor record and customer marked as verified.'
      });
    } catch (e) {
      console.error('Error setting mailing address:', e);
      toast({
        title: 'Update Failed',
        description: 'Could not set mailing address from assessor record',
        variant: 'destructive'
      });
    } finally {
      setUpdatingMailingFor(null);
    }
  };

  const handleUpdateCustomer = (assessorRecord: AssessorRecord, customer: any) => {
    setCurrentAssessorRecord(assessorRecord);
    setMatchingCustomer(customer);
    const newOwnerName = assessorRecord.updatedOwnerName || assessorRecord.ownerName || '';
    const parts = newOwnerName.trim().split(/\s+/);
    setNewFirstName(parts[0] || '');
    setNewLastName(parts.slice(1).join(' ') || '');
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
      
      // Refresh customer list to hide verified entries
      fetchCustomers?.();

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

    const firstName = (newFirstName || '').trim();
    const lastName = (newLastName || '').trim();

    if (!firstName || !lastName) {
      toast({
        title: 'Missing name',
        description: 'Please provide both first and last name before updating.',
        variant: 'destructive',
      });
      return;
    }

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

      // Remove this customer from verification results as update is complete
      setVerificationResults(prev => prev.filter(result => result.customer.id !== matchingCustomer.id));

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
                                <p><strong>Property Address:</strong> {result.customer.address}</p>
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
                              {(result.status === 'mismatch' || result.status === 'not_found') && (
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  {result.status === 'mismatch' && result.assessorRecord && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleUseAssessorMailingAddress(result.assessorRecord!, result.customer)}
                                      disabled={updatingMailingFor === result.customer.id}
                                    >
                                      Use Assessor Mailing Address
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMarkAsVerified(result.customer)}
                                    className="gap-2"
                                  >
                                    <ShieldCheck className="h-4 w-4" /> Verify Owner Anyway
                                  </Button>
                                </div>
                              )}

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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-first-name">First Name</Label>
                      <Input
                        id="new-first-name"
                        value={newFirstName}
                        onChange={(e) => setNewFirstName(e.target.value)}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-last-name">Last Name</Label>
                      <Input
                        id="new-last-name"
                        value={newLastName}
                        onChange={(e) => setNewLastName(e.target.value)}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">What will happen:</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Customer name will be updated to the values above</li>
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

          {/* Select Assessor Record Dialog */}
          <Dialog open={showSelectAssessorDialog} onOpenChange={setShowSelectAssessorDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Select Assessor Record</DialogTitle>
                <DialogDescription>
                  Multiple possible matches were found. Select the correct record for the customer.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    className="flex-1"
                    value={assessorSearch}
                    onChange={(e) => setAssessorSearch(e.target.value)}
                    placeholder="Filter suggested options by owner, address, or parcel"
                  />
                  <Button variant="outline" onClick={() => setShowGlobalAssessorSearch(v => !v)}>
                    {showGlobalAssessorSearch ? 'Close global search' : 'Search entire database'}
                  </Button>
                </div>

                {showGlobalAssessorSearch ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        className="flex-1"
                        value={globalSearchQuery}
                        onChange={(e) => setGlobalSearchQuery(e.target.value)}
                        placeholder="Search all assessor records (owner, address, parcel)"
                      />
                      <Button onClick={() => runGlobalAssessorSearch(0)} disabled={globalSearchLoading || !globalSearchQuery.trim()}>
                        {globalSearchLoading ? 'Searching...' : 'Search'}
                      </Button>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-3">
                      {globalSearchResults.map((option) => (
                        <div key={option.id} className="border rounded-lg p-3 flex items-start justify-between gap-4">
                          <div className="text-sm">
                            <div className="font-medium">{option.ownerName}</div>
                            <div className="text-muted-foreground">{option.propertyAddress}</div>
                            <div className="text-muted-foreground">Parcel: {option.parcelNumber}</div>
                          </div>
                          <Button size="sm" onClick={() => finalizeAssessorSelection(option)}>
                            Use this record
                          </Button>
                        </div>
                      ))}

                      {!globalSearchLoading && globalSearchResults.length === 0 && (
                        <p className="text-sm text-muted-foreground">No results. Try another search.</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runGlobalAssessorSearch(Math.max(0, globalSearchPage - 1))}
                        disabled={globalSearchLoading || globalSearchPage === 0}
                      >
                        Previous
                      </Button>
                      <div className="text-xs text-muted-foreground">Page {globalSearchPage + 1}</div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runGlobalAssessorSearch(globalSearchPage + 1)}
                        disabled={globalSearchLoading || globalSearchResults.length < GLOBAL_PAGE_SIZE}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {filteredAssessorOptions.map((option) => (
                      <div key={option.id} className="border rounded-lg p-3 flex items-start justify-between gap-4">
                        <div className="text-sm">
                          <div className="font-medium">{option.ownerName}</div>
                          <div className="text-muted-foreground">{option.propertyAddress}</div>
                          <div className="text-muted-foreground">Parcel: {option.parcelNumber}</div>
                        </div>
                        <Button size="sm" onClick={() => finalizeAssessorSelection(option)}>
                          Use this record
                        </Button>
                      </div>
                    ))}

                    {filteredAssessorOptions.length === 0 && (
                      <p className="text-sm text-muted-foreground">No options match your search.</p>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={cancelAssessorSelection}>Cancel</Button>
                <Button variant="secondary" onClick={handleNoAssessorSelection}>No suitable match</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </ProtectedRoute>
  );
}