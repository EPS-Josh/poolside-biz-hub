import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, DollarSign, Trash2, Plus, Loader2, User, History } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MileageEntry {
  id: string;
  date: string;
  description: string;
  startMiles: number;
  endMiles: number;
  employee?: string;
}

const MileageCalculator = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<MileageEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  
  const [ratePerMile, setRatePerMile] = useState(() => {
    const saved = localStorage.getItem('mileageRate');
    return saved ? parseFloat(saved) : 0.70; // 2025 IRS standard rate
  });

  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    startMiles: '',
    endMiles: '',
    employee: '',
  });

  const [employees, setEmployees] = useState<string[]>([]);

  // Fetch mileage entries from database
  const fetchEntries = async () => {
    setIsLoadingEntries(true);
    const { data, error } = await supabase
      .from('mileage_entries')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching mileage entries:', error);
      toast.error('Failed to load mileage entries');
    } else if (data) {
      setEntries(data.map(e => ({
        id: e.id,
        date: e.date,
        description: e.description || '',
        startMiles: Number(e.start_miles),
        endMiles: Number(e.end_miles),
        employee: e.employee || undefined,
      })));
    }
    setIsLoadingEntries(false);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Fetch employees with technician, manager, or admin roles
  useEffect(() => {
    const fetchEmployees = async () => {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['technician', 'manager', 'admin']);
      
      if (roles && roles.length > 0) {
        const userIds = [...new Set(roles.map(r => r.user_id))];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('full_name')
          .in('id', userIds)
          .not('full_name', 'is', null)
          .order('full_name');
        
        if (profiles) {
          const names = profiles.map(p => p.full_name).filter(Boolean) as string[];
          setEmployees(names);
        }
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    localStorage.setItem('mileageRate', ratePerMile.toString());
  }, [ratePerMile]);

  const handleAddEntry = async () => {
    if (!newEntry.date || !newEntry.startMiles || !newEntry.endMiles) {
      toast.error('Please fill in date, start miles, and end miles');
      return;
    }

    const start = parseFloat(newEntry.startMiles);
    const end = parseFloat(newEntry.endMiles);

    if (end <= start) {
      toast.error('End miles must be greater than start miles');
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error('You must be logged in to add entries');
      return;
    }

    const { data, error } = await supabase
      .from('mileage_entries')
      .insert({
        user_id: userData.user.id,
        date: newEntry.date,
        description: newEntry.description || null,
        start_miles: start,
        end_miles: end,
        employee: newEntry.employee || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding mileage entry:', error);
      toast.error('Failed to add mileage entry');
      return;
    }

    setEntries([{
      id: data.id,
      date: data.date,
      description: data.description || '',
      startMiles: Number(data.start_miles),
      endMiles: Number(data.end_miles),
      employee: data.employee || undefined,
    }, ...entries]);
    
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      description: '',
      startMiles: '',
      endMiles: '',
      employee: newEntry.employee, // Keep the same employee selected
    });
    toast.success('Mileage entry saved');
  };

  const handleDeleteEntry = async (id: string) => {
    const { error } = await supabase
      .from('mileage_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting mileage entry:', error);
      toast.error('Failed to delete entry');
      return;
    }

    setEntries(entries.filter(e => e.id !== id));
    toast.success('Entry deleted');
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all entries? This cannot be undone.')) {
      const { error } = await supabase
        .from('mileage_entries')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        console.error('Error clearing mileage entries:', error);
        toast.error('Failed to clear entries');
        return;
      }

      setEntries([]);
      toast.success('All entries cleared');
    }
  };


  const totalMiles = entries.reduce((sum, e) => sum + (e.endMiles - e.startMiles), 0);
  const totalReimbursement = totalMiles * ratePerMile;

  // Group entries by month
  const entriesByMonth = entries.reduce((acc, entry) => {
    const monthKey = entry.date.substring(0, 7);
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(entry);
    return acc;
  }, {} as Record<string, MileageEntry[]>);

  const sortedMonths = Object.keys(entriesByMonth).sort().reverse();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Car className="h-8 w-8" />
              Mileage Calculator
            </h1>
            <p className="text-muted-foreground mt-1">Track business mileage for tax deductions</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Miles</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalMiles.toFixed(1)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Rate per Mile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={ratePerMile}
                    onChange={(e) => setRatePerMile(parseFloat(e.target.value) || 0)}
                    className="w-24 text-xl font-bold"
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Total Reimbursement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">${totalReimbursement.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Historical Mileage Link */}
          <Card className="mb-6 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <History className="h-5 w-5 text-blue-600" />
                    Historical Mileage Calculator
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Calculate and import mileage from completed appointments
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/historical-mileage')}>
                  Open Calculator
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Add Entry Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Manual Entry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="employee">Employee</Label>
                  <Select 
                    value={newEntry.employee} 
                    onValueChange={(value) => setNewEntry({ ...newEntry, employee: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Service call to customer"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="startMiles">Start Miles</Label>
                  <Input
                    id="startMiles"
                    type="number"
                    placeholder="0"
                    value={newEntry.startMiles}
                    onChange={(e) => setNewEntry({ ...newEntry, startMiles: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endMiles">End Miles</Label>
                  <Input
                    id="endMiles"
                    type="number"
                    placeholder="0"
                    value={newEntry.endMiles}
                    onChange={(e) => setNewEntry({ ...newEntry, endMiles: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleAddEntry} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </CardContent>
          </Card>

          {/* Entries List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Mileage Log</CardTitle>
                <CardDescription>{entries.length} entries</CardDescription>
              </div>
              {entries.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleClearAll}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isLoadingEntries ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading entries...</span>
                </div>
              ) : entries.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No mileage entries yet. Add your first entry above or calculate from appointments.
                </p>
              ) : (
                <div className="space-y-6">
                {sortedMonths.map(month => {
                    const monthEntries = entriesByMonth[month].sort((a, b) => 
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    const monthMiles = monthEntries.reduce((sum, e) => sum + (e.endMiles - e.startMiles), 0);
                    const monthReimbursement = monthMiles * ratePerMile;
                    const [year, monthNum] = month.split('-');
                    const monthName = new Date(parseInt(year), parseInt(monthNum) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    
                    // Calculate totals by employee
                    const employeeTotals = monthEntries.reduce((acc, entry) => {
                      const emp = entry.employee || 'Unassigned';
                      const miles = entry.endMiles - entry.startMiles;
                      if (!acc[emp]) {
                        acc[emp] = { miles: 0, reimbursement: 0 };
                      }
                      acc[emp].miles += miles;
                      acc[emp].reimbursement += miles * ratePerMile;
                      return acc;
                    }, {} as Record<string, { miles: number; reimbursement: number }>);

                    return (
                      <div key={month}>
                        <div className="mb-3">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-foreground">{monthName}</h3>
                            <div className="text-sm font-medium text-foreground">
                              {monthMiles.toFixed(1)} mi · ${monthReimbursement.toFixed(2)}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                            {Object.entries(employeeTotals).map(([emp, totals]) => (
                              <div key={emp} className="text-xs text-muted-foreground">
                                <span className="font-medium">{emp}:</span> {totals.miles.toFixed(1)} mi · ${totals.reimbursement.toFixed(2)}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {monthEntries.map(entry => {
                            const miles = entry.endMiles - entry.startMiles;
                            return (
                              <div 
                                key={entry.id} 
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <span className="text-sm font-medium">
                                      {(() => {
                                        const [y, m, d] = entry.date.split('-');
                                        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric' 
                                        });
                                      })()}
                                    </span>
                                    {entry.employee && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                        <User className="h-3 w-3" />
                                        {entry.employee}
                                      </span>
                                    )}
                                    {entry.description && (
                                      <span className="text-sm text-muted-foreground">
                                        {entry.description}
                                      </span>
                                    )}
                                  </div>
                                  {entry.startMiles > 0 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {entry.startMiles.toLocaleString()} → {entry.endMiles.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="font-medium">{miles.toFixed(1)} mi</p>
                                    <p className="text-xs text-muted-foreground">
                                      ${(miles * ratePerMile).toFixed(2)}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteEntry(entry.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <Separator className="mt-4" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Note */}
          <p className="text-xs text-muted-foreground mt-4 text-center">
            The 2025 IRS standard mileage rate for business use is $0.70 per mile. 
            Data is securely stored in your database.
          </p>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default MileageCalculator;
