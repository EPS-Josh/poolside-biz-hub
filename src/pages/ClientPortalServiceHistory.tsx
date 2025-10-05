import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCustomerData } from '@/hooks/useCustomerData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Calendar, Loader2, Download, FileDown, LineChart, ClipboardList, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CustomerReadingForm } from '@/components/CustomerReadingForm';

interface ServiceRecord {
  id: string;
  service_date: string;
  service_type: string;
  service_status?: string;
  technician_name?: string;
  work_performed?: string;
  chemicals_added?: string;
  before_readings?: any;
  after_readings?: any;
  customer_notes?: string;
}

interface CustomerReading {
  id: string;
  reading_date: string;
  reading_time: string;
  readings: any;
  notes?: string;
  created_at: string;
}

const ClientPortalServiceHistory = () => {
  const navigate = useNavigate();
  const { customer, loading: customerLoading } = useCustomerData();
  const [showBefore, setShowBefore] = useState(true);
  const [showAfter, setShowAfter] = useState(true);
  const [showCustomer, setShowCustomer] = useState(true);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [customerReadings, setCustomerReadings] = useState<CustomerReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customer) {
      fetchServiceRecords();
      fetchCustomerReadings();
    }
  }, [customer]);

  const fetchServiceRecords = async () => {
    if (!customer) return;

    try {
      const { data, error } = await supabase
        .from('service_records')
        .select('*')
        .eq('customer_id', customer.id)
        .order('service_date', { ascending: false });

      if (error) throw error;
      setServiceRecords(data || []);
    } catch (error) {
      console.error('Error fetching service records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerReadings = async () => {
    if (!customer) return;

    try {
      const { data, error } = await supabase
        .from('customer_readings')
        .select('*')
        .eq('customer_id', customer.id)
        .order('reading_date', { ascending: false });

      if (error) throw error;
      setCustomerReadings(data || []);
    } catch (error) {
      console.error('Error fetching customer readings:', error);
    }
  };

  const handleDeleteReading = async (readingId: string) => {
    if (!confirm('Are you sure you want to delete this reading? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('customer_readings')
        .delete()
        .eq('id', readingId);

      if (error) throw error;

      toast.success('Reading deleted successfully');
      fetchCustomerReadings();
    } catch (error: any) {
      console.error('Error deleting reading:', error);
      toast.error('Failed to delete reading: ' + error.message);
    }
  };

  const formatReadingLabel = (key: string): string => {
    const labels: { [key: string]: string } = {
      total_hardness: 'Total Hardness',
      total_chlorine_bromine: 'Total Chlorine / Bromine',
      free_chlorine: 'Free Chlorine',
      ph: 'pH',
      total_alkalinity: 'Total Alkalinity',
      cyanuric_acid: 'Cyanuric Acid'
    };
    return labels[key] || key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const downloadCSV = (record: ServiceRecord) => {
    const rows = [];
    
    // Header
    rows.push(['Service Record - ' + format(new Date(record.service_date), 'MMMM d, yyyy')]);
    rows.push(['Service Type:', record.service_type]);
    rows.push(['Technician:', record.technician_name || 'N/A']);
    rows.push([]);
    
    // Readings
    rows.push(['Reading', 'Before', 'After']);
    
    const allKeys = new Set([
      ...(record.before_readings ? Object.keys(record.before_readings) : []),
      ...(record.after_readings ? Object.keys(record.after_readings) : [])
    ]);
    
    allKeys.forEach(key => {
      const beforeValue = record.before_readings?.[key] || '';
      const afterValue = record.after_readings?.[key] || '';
      rows.push([formatReadingLabel(key), beforeValue, afterValue]);
    });

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `service-record-${format(new Date(record.service_date), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadPDF = (record: ServiceRecord) => {
    const doc = new jsPDF();
    let y = 20;
    
    // Title
    doc.setFontSize(18);
    doc.text('Service Record', 20, y);
    y += 10;
    
    // Date
    doc.setFontSize(12);
    doc.text(format(new Date(record.service_date), 'MMMM d, yyyy'), 20, y);
    y += 10;
    
    // Service details
    doc.setFontSize(10);
    doc.text(`Service Type: ${record.service_type}`, 20, y);
    y += 7;
    if (record.technician_name) {
      doc.text(`Technician: ${record.technician_name}`, 20, y);
      y += 7;
    }
    y += 5;
    
    // Before Readings
    if (record.before_readings && Object.keys(record.before_readings).length > 0) {
      doc.setFontSize(12);
      doc.text('Before Readings:', 20, y);
      y += 7;
      doc.setFontSize(10);
      
      Object.entries(record.before_readings).forEach(([key, value]) => {
        doc.text(`${formatReadingLabel(key)}: ${value}`, 25, y);
        y += 6;
      });
      y += 5;
    }
    
    // After Readings
    if (record.after_readings && Object.keys(record.after_readings).length > 0) {
      doc.setFontSize(12);
      doc.text('After Readings:', 20, y);
      y += 7;
      doc.setFontSize(10);
      
      Object.entries(record.after_readings).forEach(([key, value]) => {
        doc.text(`${formatReadingLabel(key)}: ${value}`, 25, y);
        y += 6;
      });
      y += 5;
    }
    
    // Work performed
    if (record.work_performed) {
      doc.setFontSize(12);
      doc.text('Work Performed:', 20, y);
      y += 7;
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(record.work_performed, 170);
      doc.text(lines, 25, y);
      y += lines.length * 6;
      y += 5;
    }
    
    // Chemicals added
    if (record.chemicals_added) {
      doc.setFontSize(12);
      doc.text('Chemicals Added:', 20, y);
      y += 7;
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(record.chemicals_added, 170);
      doc.text(lines, 25, y);
    }
    
    doc.save(`service-record-${format(new Date(record.service_date), 'yyyy-MM-dd')}.pdf`);
  };

  const downloadAllCSV = () => {
    const rows = [];
    
    // Header
    rows.push(['Service History - All Records']);
    rows.push([]);
    
    serviceRecords.forEach((record, index) => {
      if (index > 0) rows.push([]);
      
      rows.push([`Service Date: ${format(new Date(record.service_date), 'MMMM d, yyyy')}`]);
      rows.push([`Service Type: ${record.service_type}`]);
      rows.push([`Technician: ${record.technician_name || 'N/A'}`]);
      rows.push([]);
      
      rows.push(['Reading', 'Before', 'After']);
      
      const allKeys = new Set([
        ...(record.before_readings ? Object.keys(record.before_readings) : []),
        ...(record.after_readings ? Object.keys(record.after_readings) : [])
      ]);
      
      allKeys.forEach(key => {
        const beforeValue = record.before_readings?.[key] || '';
        const afterValue = record.after_readings?.[key] || '';
        rows.push([formatReadingLabel(key), beforeValue, afterValue]);
      });
    });

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `all-service-records-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadAllPDF = () => {
    const doc = new jsPDF();
    
    // Title page
    doc.setFontSize(20);
    doc.text('Service History', 20, 20);
    doc.setFontSize(12);
    doc.text(`Total Records: ${serviceRecords.length}`, 20, 35);
    doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, 20, 42);
    
    serviceRecords.forEach((record, index) => {
      if (index > 0) {
        doc.addPage();
      } else {
        doc.addPage();
      }
      
      let y = 20;
      
      // Service record header
      doc.setFontSize(16);
      doc.text(`Service Record ${index + 1}`, 20, y);
      y += 10;
      
      doc.setFontSize(12);
      doc.text(format(new Date(record.service_date), 'MMMM d, yyyy'), 20, y);
      y += 10;
      
      doc.setFontSize(10);
      doc.text(`Service Type: ${record.service_type}`, 20, y);
      y += 7;
      if (record.technician_name) {
        doc.text(`Technician: ${record.technician_name}`, 20, y);
        y += 7;
      }
      y += 5;
      
      // Before Readings
      if (record.before_readings && Object.keys(record.before_readings).length > 0) {
        doc.setFontSize(12);
        doc.text('Before Readings:', 20, y);
        y += 7;
        doc.setFontSize(10);
        
        Object.entries(record.before_readings).forEach(([key, value]) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(`${formatReadingLabel(key)}: ${value}`, 25, y);
          y += 6;
        });
        y += 5;
      }
      
      // After Readings
      if (record.after_readings && Object.keys(record.after_readings).length > 0) {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(12);
        doc.text('After Readings:', 20, y);
        y += 7;
        doc.setFontSize(10);
        
        Object.entries(record.after_readings).forEach(([key, value]) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(`${formatReadingLabel(key)}: ${value}`, 25, y);
          y += 6;
        });
        y += 5;
      }
      
      // Work performed
      if (record.work_performed) {
        if (y > 230) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(12);
        doc.text('Work Performed:', 20, y);
        y += 7;
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(record.work_performed, 170);
        lines.forEach((line: string) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 25, y);
          y += 6;
        });
        y += 5;
      }
      
      // Chemicals added
      if (record.chemicals_added) {
        if (y > 230) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(12);
        doc.text('Chemicals Added:', 20, y);
        y += 7;
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(record.chemicals_added, 170);
        lines.forEach((line: string) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 25, y);
          y += 6;
        });
      }
    });
    
    doc.save(`all-service-records-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const prepareChartData = () => {
    const readingKeys = ['total_hardness', 'total_chlorine_bromine', 'free_chlorine', 'ph', 'total_alkalinity', 'cyanuric_acid'];
    
    // Map snake_case to possible camelCase variations
    const fieldVariations: { [key: string]: string[] } = {
      total_hardness: ['total_hardness', 'totalHardness'],
      total_chlorine_bromine: ['total_chlorine_bromine', 'chlorine'],
      free_chlorine: ['free_chlorine', 'chlorine'],
      ph: ['ph'],
      total_alkalinity: ['total_alkalinity', 'alkalinity'],
      cyanuric_acid: ['cyanuric_acid', 'cyanuricAcid']
    };
    
    return readingKeys.map(key => {
      const possibleKeys = fieldVariations[key] || [key];
      
      // Combine service records and customer readings
      const serviceData = serviceRecords
        .filter(record => {
          // Check if any of the possible field name variations exist
          return possibleKeys.some(k => record.before_readings?.[k] || record.after_readings?.[k]);
        })
        .map(record => {
          // Find the first matching key variant
          const matchingKey = possibleKeys.find(k => record.before_readings?.[k] || record.after_readings?.[k]) || possibleKeys[0];
          
          return {
            date: new Date(record.service_date).getTime(),
            displayDate: format(new Date(record.service_date), 'MMM d'),
            fullDate: format(new Date(record.service_date), 'MMM d, yyyy'),
            before: parseFloat(record.before_readings?.[matchingKey]) || null,
            after: parseFloat(record.after_readings?.[matchingKey]) || null,
            customer: null,
            source: 'service'
          };
        });

      const customerData = customerReadings
        .filter(reading => reading.readings?.[key])
        .map(reading => ({
          date: new Date(reading.reading_date).getTime(),
          displayDate: format(new Date(reading.reading_date), 'MMM d'),
          fullDate: format(new Date(reading.reading_date), 'MMM d, yyyy'),
          before: null,
          after: null,
          customer: parseFloat(reading.readings?.[key]) || null,
          source: 'customer'
        }));

      // Combine and sort by date
      const allData = [...serviceData, ...customerData]
        .sort((a, b) => a.date - b.date)
        .map(({ date, ...rest }) => rest); // Remove timestamp, keep displayDate
      
      return {
        key,
        label: formatReadingLabel(key),
        data: allData
      };
    }).filter(chart => chart.data.length > 0);
  };

  const chartData = prepareChartData();

  if (customerLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/client-portal')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Portal
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">Service History</h1>
              <p className="text-muted-foreground">Your complete service record history</p>
            </div>
            {serviceRecords.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={downloadAllCSV}
                  title="Download all records as CSV"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export All as CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadAllPDF}
                  title="Download all records as PDF"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export All as PDF
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {serviceRecords.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No service records found</p>
              <p className="text-muted-foreground mt-2">
                Your service history will appear here after your first service.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="records" className="space-y-4">
            <TabsList>
              <TabsTrigger value="records">
                <FileText className="h-4 w-4 mr-2" />
                Service Records
              </TabsTrigger>
              <TabsTrigger value="my-readings">
                <ClipboardList className="h-4 w-4 mr-2" />
                My Readings
              </TabsTrigger>
              <TabsTrigger value="charts">
                <LineChart className="h-4 w-4 mr-2" />
                Reading Trends
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="records" className="space-y-4">
              {serviceRecords.map((record) => (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{record.service_type}</CardTitle>
                        <CardDescription className="flex items-center mt-2">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(new Date(record.service_date), 'MMMM d, yyyy')}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {record.service_status && (
                          <Badge>{record.service_status}</Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadCSV(record)}
                          title="Download as CSV"
                        >
                          <FileDown className="h-4 w-4 mr-1" />
                          CSV
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadPDF(record)}
                          title="Download as PDF"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {record.technician_name && (
                      <div>
                        <p className="text-sm font-medium">Technician</p>
                        <p className="text-sm text-muted-foreground">{record.technician_name}</p>
                      </div>
                    )}
                    
                    {record.work_performed && (
                      <div>
                        <p className="text-sm font-medium">Work Performed</p>
                        <p className="text-sm text-muted-foreground">{record.work_performed}</p>
                      </div>
                    )}

                    {record.chemicals_added && (
                      <div>
                        <p className="text-sm font-medium">Chemicals Added</p>
                        <p className="text-sm text-muted-foreground">{record.chemicals_added}</p>
                      </div>
                    )}

                    {(record.before_readings || record.after_readings) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {record.before_readings && (
                          <div>
                            <p className="text-sm font-medium mb-2">Before Readings</p>
                            <div className="bg-muted p-3 rounded-lg text-sm">
                              {Object.entries(record.before_readings).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span>{formatReadingLabel(key)}:</span>
                                  <span>{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {record.after_readings && (
                          <div>
                            <p className="text-sm font-medium mb-2">After Readings</p>
                            <div className="bg-muted p-3 rounded-lg text-sm">
                              {Object.entries(record.after_readings).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span>{formatReadingLabel(key)}:</span>
                                  <span>{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {record.customer_notes && (
                      <div>
                        <p className="text-sm font-medium">Notes</p>
                        <p className="text-sm text-muted-foreground">{record.customer_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="my-readings" className="space-y-6">
              <CustomerReadingForm 
                customerId={customer!.id} 
                onSuccess={fetchCustomerReadings}
              />
              
              {customerReadings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium">No readings submitted yet</p>
                    <p className="text-muted-foreground mt-2">
                      Submit your first reading using the form above.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Your Submitted Readings</h3>
                  {customerReadings.map((reading) => (
                    <Card key={reading.id}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>Reading</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {format(new Date(reading.reading_date), 'MMM d, yyyy')} at {reading.reading_time}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReading(reading.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Delete reading"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                          {Object.entries(reading.readings).map(([key, value]) => (
                            value && (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="font-medium">{formatReadingLabel(key)}:</span>
                                <span>{String(value)}</span>
                              </div>
                            )
                          ))}
                        </div>
                        {reading.notes && (
                          <div className="mt-4">
                            <p className="text-sm font-medium">Notes</p>
                            <p className="text-sm text-muted-foreground mt-1">{reading.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="charts" className="space-y-6">
              {chartData.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <LineChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium">No reading data available</p>
                    <p className="text-muted-foreground mt-2">
                      Charts will appear here once you have service records with readings.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {chartData.map(chart => (
                    <Card key={chart.key}>
                      <CardHeader>
                        <CardTitle>{chart.label} Over Time</CardTitle>
                        <CardDescription>
                          Technician readings (before/after service) and your submitted readings
                        </CardDescription>
                        <div className="flex gap-6 mt-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`before-${chart.key}`}
                              checked={showBefore}
                              onCheckedChange={(checked) => setShowBefore(checked === true)}
                            />
                            <Label 
                              htmlFor={`before-${chart.key}`}
                              className="text-sm font-normal cursor-pointer flex items-center gap-2"
                            >
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--destructive))' }} />
                              Before Service
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`after-${chart.key}`}
                              checked={showAfter}
                              onCheckedChange={(checked) => setShowAfter(checked === true)}
                            />
                            <Label 
                              htmlFor={`after-${chart.key}`}
                              className="text-sm font-normal cursor-pointer flex items-center gap-2"
                            >
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }} />
                              After Service
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`customer-${chart.key}`}
                              checked={showCustomer}
                              onCheckedChange={(checked) => setShowCustomer(checked === true)}
                            />
                            <Label 
                              htmlFor={`customer-${chart.key}`}
                              className="text-sm font-normal cursor-pointer flex items-center gap-2"
                            >
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }} />
                              Your Readings
                            </Label>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsLineChart data={chart.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="displayDate" 
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip 
                              labelFormatter={(label, payload) => {
                                if (payload && payload[0]) {
                                  return payload[0].payload.fullDate;
                                }
                                return label;
                              }}
                            />
                            <Legend />
                            {showBefore && (
                              <Line 
                                type="monotone" 
                                dataKey="before" 
                                stroke="hsl(var(--destructive))" 
                                name="Before Service"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                connectNulls
                              />
                            )}
                            {showAfter && (
                              <Line 
                                type="monotone" 
                                dataKey="after" 
                                stroke="hsl(var(--primary))" 
                                name="After Service"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                connectNulls
                              />
                            )}
                            {showCustomer && (
                              <Line 
                                type="monotone" 
                                dataKey="customer" 
                                stroke="#10b981" 
                                name="Your Readings"
                                strokeWidth={3}
                                dot={{ r: 5, fill: "#10b981" }}
                                connectNulls
                              />
                            )}
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default ClientPortalServiceHistory;
