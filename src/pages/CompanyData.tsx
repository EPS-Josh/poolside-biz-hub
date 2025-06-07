
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ValveDataScraper } from '@/components/ValveDataScraper';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Building, Mail, Phone, MapPin, Globe, Save, Edit3, Settings } from 'lucide-react';

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Basic Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <Input
                      value={companyData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={companyData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <Input
                      value={companyData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <Input
                      value={companyData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Address Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <Input
                      value={companyData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <Input
                        value={companyData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        disabled={!isEditing}
                        className={!isEditing ? 'bg-gray-50' : ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <Input
                        value={companyData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        disabled={!isEditing}
                        className={!isEditing ? 'bg-gray-50' : ''}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <Input
                      value={companyData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Business Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>Business Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax ID / EIN
                    </label>
                    <Input
                      value={companyData.taxId}
                      onChange={(e) => handleInputChange('taxId', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business License Number
                    </label>
                    <Input
                      value={companyData.licenseNumber}
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Insurance Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Insurance Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Insurance Provider
                    </label>
                    <Input
                      value={companyData.insuranceProvider}
                      onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Policy Number
                    </label>
                    <Input
                      value={companyData.insurancePolicyNumber}
                      onChange={(e) => handleInputChange('insurancePolicyNumber', e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Product Data Management */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Product Data Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Valve Data</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Load product data from manufacturer websites to use in service forms.
                    </p>
                    <ValveDataScraper onValveDataFetched={handleValveDataFetched} />
                    
                    {Object.keys(valveData).length > 0 && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Loaded Valve Data:</h4>
                        {Object.entries(valveData).map(([manufacturer, valves]) => (
                          <div key={manufacturer} className="mb-2">
                            <span className="font-medium text-gray-700">{manufacturer}:</span>
                            <span className="ml-2 text-gray-600">{valves.length} valves loaded</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

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
