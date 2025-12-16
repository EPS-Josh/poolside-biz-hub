import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Car, Calculator, DollarSign, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface MileageEntry {
  id: string;
  date: string;
  description: string;
  startMiles: number;
  endMiles: number;
}

const MileageCalculator = () => {
  const [entries, setEntries] = useState<MileageEntry[]>(() => {
    const saved = localStorage.getItem('mileageEntries');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [ratePerMile, setRatePerMile] = useState(() => {
    const saved = localStorage.getItem('mileageRate');
    return saved ? parseFloat(saved) : 0.67; // 2024 IRS standard rate
  });

  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    startMiles: '',
    endMiles: '',
  });

  useEffect(() => {
    localStorage.setItem('mileageEntries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('mileageRate', ratePerMile.toString());
  }, [ratePerMile]);

  const handleAddEntry = () => {
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

    const entry: MileageEntry = {
      id: crypto.randomUUID(),
      date: newEntry.date,
      description: newEntry.description,
      startMiles: start,
      endMiles: end,
    };

    setEntries([...entries, entry]);
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      description: '',
      startMiles: '',
      endMiles: '',
    });
    toast.success('Mileage entry added');
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
    toast.success('Entry deleted');
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all entries?')) {
      setEntries([]);
      toast.success('All entries cleared');
    }
  };

  const totalMiles = entries.reduce((sum, e) => sum + (e.endMiles - e.startMiles), 0);
  const totalReimbursement = totalMiles * ratePerMile;

  // Group entries by month
  const entriesByMonth = entries.reduce((acc, entry) => {
    const monthKey = entry.date.substring(0, 7); // YYYY-MM
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

          {/* Add Entry Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Mileage Entry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              {entries.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No mileage entries yet. Add your first entry above.
                </p>
              ) : (
                <div className="space-y-6">
                  {sortedMonths.map(month => {
                    const monthEntries = entriesByMonth[month].sort((a, b) => 
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    const monthMiles = monthEntries.reduce((sum, e) => sum + (e.endMiles - e.startMiles), 0);
                    const monthReimbursement = monthMiles * ratePerMile;
                    const monthDate = new Date(month + '-01');
                    const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

                    return (
                      <div key={month}>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold text-foreground">{monthName}</h3>
                          <div className="text-sm text-muted-foreground">
                            {monthMiles.toFixed(1)} mi · ${monthReimbursement.toFixed(2)}
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
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium">
                                      {new Date(entry.date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })}
                                    </span>
                                    {entry.description && (
                                      <span className="text-sm text-muted-foreground">
                                        {entry.description}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {entry.startMiles.toLocaleString()} → {entry.endMiles.toLocaleString()}
                                  </div>
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
            The 2024 IRS standard mileage rate for business use is $0.67 per mile. 
            Data is stored locally in your browser.
          </p>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default MileageCalculator;
