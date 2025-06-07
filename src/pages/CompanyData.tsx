
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { CompanyDataForm } from '@/components/company/CompanyDataForm';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Save, Edit3 } from 'lucide-react';

const CompanyData = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [valveData, setValveData] = useState<{ [manufacturer: string]: string[] }>({});
  const [companyData, setCompanyData] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    website: '',
    taxId: '',
    licenseNumber: '',
    insuranceProvider: '',
    insurancePolicyNumber: ''
  });

  useEffect(() => {
    if (user) {
      loadCompanyData();
    }
  }, [user]);

  const loadCompanyData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('company_data')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading company data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load company data',
          variant: 'destructive',
        });
        return;
      }

      if (data) {
        setCompanyData({
          companyName: data.company_name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zipCode: data.zip_code || '',
          website: data.website || '',
          taxId: data.tax_id || '',
          licenseNumber: data.license_number || '',
          insuranceProvider: data.insurance_provider || '',
          insurancePolicyNumber: data.insurance_policy_number || ''
        });
      } else {
        // Set default values if no data exists
        setCompanyData({
          companyName: 'AquaPro Pool Services',
          email: 'info@aquapro.com',
          phone: '(555) 123-4567',
          address: '123 Pool Service Lane',
          city: 'Miami',
          state: 'FL',
          zipCode: '33101',
          website: 'www.aquapro.com',
          taxId: '12-3456789',
          licenseNumber: 'PSL-2024-001',
          insuranceProvider: 'Pool Service Insurance Co.',
          insurancePolicyNumber: 'PSI-789456123'
        });
      }
    } catch (error) {
      console.error('Error loading company data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load company data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save company data',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      console.log('Saving company data:', companyData);

      const dataToSave = {
        user_id: user.id,
        company_name: companyData.companyName,
        email: companyData.email,
        phone: companyData.phone,
        address: companyData.address,
        city: companyData.city,
        state: companyData.state,
        zip_code: companyData.zipCode,
        website: companyData.website,
        tax_id: companyData.taxId,
        license_number: companyData.licenseNumber,
        insurance_provider: companyData.insuranceProvider,
        insurance_policy_number: companyData.insurancePolicyNumber
      };

      const { error } = await supabase
        .from('company_data')
        .upsert(dataToSave, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error saving company data:', error);
        toast({
          title: 'Error',
          description: 'Failed to save company data: ' + error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Company data saved successfully!',
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving company data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save company data',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reload the data to reset changes
    loadCompanyData();
    setIsEditing(false);
    toast({
      title: 'Cancelled',
      description: 'Changes cancelled',
    });
  };

  const handleValveDataFetched = (valves: { [manufacturer: string]: string[] }) => {
    setValveData(valves);
    console.log('Valve data updated:', valves);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="flex justify-center items-center h-64">
                <div className="text-lg text-gray-600">Loading company data...</div>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Data</h1>
                <p className="text-gray-600">Manage your business information and settings</p>
              </div>
              <div className="flex space-x-4">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} className="flex items-center space-x-2">
                    <Edit3 className="h-4 w-4" />
                    <span>Edit Company Data</span>
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleSave} 
                      disabled={isSaving}
                      className="flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </Button>
                    <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <CompanyDataForm
              companyData={companyData}
              isEditing={isEditing}
              valveData={valveData}
              onInputChange={handleInputChange}
              onValveDataFetched={handleValveDataFetched}
            />

            {/* Status Banner */}
            {isEditing && (
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Edit3 className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-800 font-medium">Editing Mode Active</span>
                  </div>
                  <span className="text-blue-600 text-sm">Make your changes and click Save when ready</span>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default CompanyData;
