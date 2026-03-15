import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Zap, AlertTriangle, Search, Hash, Settings, BarChart3, RefreshCw } from 'lucide-react';

interface ManufacturerCode {
  id: string;
  manufacturer_name: string;
  code: string;
}

interface SolutionCode {
  id: string;
  solution_name: string;
  code: string;
}

interface InventoryItem {
  id: string;
  item_number: string | null;
  fps_item_number: string | null;
  name: string | null;
  description: string | null;
  solution: string | null;
  category: string | null;
}

const FpsItemMatrix = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [newMfgName, setNewMfgName] = useState('');
  const [newMfgCode, setNewMfgCode] = useState('');
  const [newSolName, setNewSolName] = useState('');
  const [newSolCode, setNewSolCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNoMfgOnly, setShowNoMfgOnly] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [addMfgOpen, setAddMfgOpen] = useState(false);
  const [addSolOpen, setAddSolOpen] = useState(false);

  // Fetch manufacturer codes
  const { data: mfgCodes = [], isLoading: mfgLoading } = useQuery({
    queryKey: ['fps-manufacturer-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fps_manufacturer_codes')
        .select('id, manufacturer_name, code')
        .order('manufacturer_name');
      if (error) throw error;
      return data as ManufacturerCode[];
    }
  });

  // Fetch solution codes
  const { data: solCodes = [], isLoading: solLoading } = useQuery({
    queryKey: ['fps-solution-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fps_solution_codes')
        .select('id, solution_name, code')
        .order('solution_name');
      if (error) throw error;
      return data as SolutionCode[];
    }
  });

  // Fetch inventory items (batched for large datasets)
  const { data: inventoryItems = [], isLoading: invLoading } = useQuery({
    queryKey: ['fps-inventory-items'],
    queryFn: async () => {
      let allItems: InventoryItem[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('inventory_items')
          .select('id, item_number, fps_item_number, name, description, solution, category')
          .range(from, from + batchSize - 1)
          .order('item_number');
        if (error) throw error;
        allItems = [...allItems, ...(data as InventoryItem[])];
        hasMore = data.length === batchSize;
        from += batchSize;
      }
      return allItems;
    }
  });

  // Add manufacturer code
  const addMfgMutation = useMutation({
    mutationFn: async ({ name, code }: { name: string; code: string }) => {
      const { error } = await supabase.from('fps_manufacturer_codes').insert({
        manufacturer_name: name,
        code: code.toUpperCase(),
        user_id: user!.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fps-manufacturer-codes'] });
      setNewMfgName('');
      setNewMfgCode('');
      setAddMfgOpen(false);
      toast.success('Manufacturer code added');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add code')
  });

  // Add solution code
  const addSolMutation = useMutation({
    mutationFn: async ({ name, code }: { name: string; code: string }) => {
      const { error } = await supabase.from('fps_solution_codes').insert({
        solution_name: name,
        code: code.toUpperCase(),
        user_id: user!.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fps-solution-codes'] });
      setNewSolName('');
      setNewSolCode('');
      setAddSolOpen(false);
      toast.success('Solution code added');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add code')
  });

  // Delete manufacturer code
  const deleteMfgMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fps_manufacturer_codes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fps-manufacturer-codes'] });
      toast.success('Manufacturer code deleted');
    }
  });

  // Delete solution code
  const deleteSolMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fps_solution_codes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fps-solution-codes'] });
      toast.success('Solution code deleted');
    }
  });

  // Auto-generate code from name
  const autoCode = (name: string) => name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();

  // Build FPS Item # from an inventory item
  const buildFpsNumber = (item: InventoryItem): string | null => {
    if (!item.item_number) return null;

    // Try to match manufacturer from item name/description
    const searchText = `${item.name || ''} ${item.description || ''} ${item.category || ''}`.toLowerCase();
    const matchedMfg = mfgCodes.find(m => searchText.includes(m.manufacturer_name.toLowerCase()));

    // Try to match solution
    const solText = (item.solution || item.category || '').toLowerCase();
    const matchedSol = solCodes.find(s => solText.includes(s.solution_name.toLowerCase()));

    const mfgPart = matchedMfg?.code || 'UNK';
    const solPart = matchedSol?.code || 'GEN';

    return `${mfgPart}-${solPart}-${item.item_number}`;
  };

  // Bulk generate FPS Item #s
  const handleBulkGenerate = async () => {
    if (!user) return;
    setIsGenerating(true);

    try {
      const itemsToUpdate = inventoryItems
        .filter(item => item.item_number && !item.fps_item_number)
        .map(item => ({
          id: item.id,
          fps_item_number: buildFpsNumber(item)
        }))
        .filter(item => item.fps_item_number);

      if (itemsToUpdate.length === 0) {
        toast.info('No items need FPS Item # generation');
        setIsGenerating(false);
        return;
      }

      // Batch update in chunks of 500
      const batchSize = 500;
      let updated = 0;
      for (let i = 0; i < itemsToUpdate.length; i += batchSize) {
        const batch = itemsToUpdate.slice(i, i + batchSize);
        for (const item of batch) {
          const { error } = await supabase
            .from('inventory_items')
            .update({ fps_item_number: item.fps_item_number })
            .eq('id', item.id);
          if (!error) updated++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['fps-inventory-items'] });
      toast.success(`Generated FPS Item #s for ${updated} items`);
    } catch (err) {
      toast.error('Error generating FPS Item #s');
    } finally {
      setIsGenerating(false);
    }
  };

  // Conflict detection
  const conflicts = React.useMemo(() => {
    const fpsNumbers = new Map<string, InventoryItem[]>();
    inventoryItems.forEach(item => {
      if (item.fps_item_number) {
        const existing = fpsNumbers.get(item.fps_item_number) || [];
        existing.push(item);
        fpsNumbers.set(item.fps_item_number, existing);
      }
    });
    return Array.from(fpsNumbers.entries())
      .filter(([_, items]) => items.length > 1)
      .map(([fpsNum, items]) => ({ fpsNumber: fpsNum, items }));
  }, [inventoryItems]);

  // Stats
  const stats = React.useMemo(() => {
    const total = inventoryItems.length;
    const withFps = inventoryItems.filter(i => i.fps_item_number).length;
    const withoutFps = inventoryItems.filter(i => i.item_number && !i.fps_item_number).length;
    const noMfgNum = inventoryItems.filter(i => !i.item_number).length;
    return { total, withFps, withoutFps, noMfgNum, conflicts: conflicts.length };
  }, [inventoryItems, conflicts]);

  // Filtered items for preview
  const filteredItems = React.useMemo(() => {
    let items = inventoryItems;
    if (showNoMfgOnly) {
      items = items.filter(i => !i.item_number || i.item_number.trim() === '' || i.item_number.toUpperCase() === 'UNK');
    }
    if (!searchTerm) return items.slice(0, 100);
    const term = searchTerm.toLowerCase();
    return items
      .filter(i =>
        (i.item_number?.toLowerCase().includes(term)) ||
        (i.fps_item_number?.toLowerCase().includes(term)) ||
        (i.name?.toLowerCase().includes(term)) ||
        (i.description?.toLowerCase().includes(term))
      )
      .slice(0, 100);
  }, [inventoryItems, searchTerm, showNoMfgOnly]);

  return (
    <ProtectedRoute excludedRoles={['guest']}>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">FPS Item # Matrix</h1>
            <p className="text-muted-foreground mt-1">
              Format: <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono">MFR-SOL-MfgPartNumber</code> — e.g. PEN-FIL-123456
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total Items</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-green-600">{stats.withFps}</div>
                <div className="text-xs text-muted-foreground">Have FPS #</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-amber-600">{stats.withoutFps}</div>
                <div className="text-xs text-muted-foreground">Need FPS #</div>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer transition-colors hover:border-primary ${showNoMfgOnly ? 'border-primary ring-2 ring-primary/20' : ''}`}
              onClick={() => {
                setShowNoMfgOnly(!showNoMfgOnly);
                setActiveTab('overview');
              }}
            >
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-muted-foreground">{stats.noMfgNum}</div>
                <div className="text-xs text-muted-foreground">No MFG #</div>
                {showNoMfgOnly && <div className="text-xs text-primary mt-1">Filtered ✓</div>}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-destructive">{stats.conflicts}</div>
                <div className="text-xs text-muted-foreground">Conflicts</div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 mr-1" />Overview</TabsTrigger>
              <TabsTrigger value="codes"><Settings className="h-4 w-4 mr-1" />Code Management</TabsTrigger>
              <TabsTrigger value="generator"><Zap className="h-4 w-4 mr-1" />Generator</TabsTrigger>
              <TabsTrigger value="conflicts"><AlertTriangle className="h-4 w-4 mr-1" />Conflicts ({stats.conflicts})</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Inventory FPS Item # Browser
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by MFG #, FPS #, name, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {invLoading ? (
                    <p className="text-muted-foreground">Loading inventory...</p>
                  ) : (
                    <>
                      <div className="overflow-auto max-h-[500px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>MFG #</TableHead>
                              <TableHead>FPS Item #</TableHead>
                              <TableHead>Name / Description</TableHead>
                              <TableHead>Solution</TableHead>
                              <TableHead>Category</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredItems.map(item => (
                              <TableRow key={item.id}>
                                <TableCell className="font-mono text-sm">{item.item_number || '—'}</TableCell>
                                <TableCell>
                                  {item.fps_item_number ? (
                                    <Badge variant="secondary" className="font-mono">{item.fps_item_number}</Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">Not assigned</span>
                                  )}
                                </TableCell>
                                <TableCell className="max-w-[250px] truncate">{item.name || item.description || '—'}</TableCell>
                                <TableCell>{item.solution || '—'}</TableCell>
                                <TableCell>{item.category || '—'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {filteredItems.length >= 100 && (
                        <p className="text-xs text-muted-foreground mt-2">Showing first 100 results. Use search to narrow down.</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Code Management Tab */}
            <TabsContent value="codes">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Manufacturer Codes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Manufacturer Codes</span>
                      <Dialog open={addMfgOpen} onOpenChange={setAddMfgOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Add Manufacturer Code</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Manufacturer Name</Label>
                              <Input
                                value={newMfgName}
                                onChange={(e) => {
                                  setNewMfgName(e.target.value);
                                  setNewMfgCode(autoCode(e.target.value));
                                }}
                                placeholder="e.g. Pentair"
                              />
                            </div>
                            <div>
                              <Label>3-Letter Code</Label>
                              <Input
                                value={newMfgCode}
                                onChange={(e) => setNewMfgCode(e.target.value.toUpperCase().slice(0, 3))}
                                maxLength={3}
                                placeholder="e.g. PEN"
                                className="font-mono uppercase"
                              />
                            </div>
                            <Button
                              onClick={() => addMfgMutation.mutate({ name: newMfgName, code: newMfgCode })}
                              disabled={!newMfgName || newMfgCode.length !== 3 || addMfgMutation.isPending}
                              className="w-full"
                            >
                              Add Manufacturer Code
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardTitle>
                    <CardDescription>{mfgCodes.length} manufacturers configured</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {mfgLoading ? (
                      <p className="text-muted-foreground text-sm">Loading...</p>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-auto">
                        {mfgCodes.map(m => (
                          <div key={m.id} className="flex items-center justify-between p-2 rounded border bg-card">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="font-mono text-base">{m.code}</Badge>
                              <span className="text-sm">{m.manufacturer_name}</span>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete {m.manufacturer_name}?</AlertDialogTitle>
                                  <AlertDialogDescription>This won't change existing FPS Item #s but will affect future generation.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMfgMutation.mutate(m.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Solution Codes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Solution Codes</span>
                      <Dialog open={addSolOpen} onOpenChange={setAddSolOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Add Solution Code</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Solution Name</Label>
                              <Input
                                value={newSolName}
                                onChange={(e) => {
                                  setNewSolName(e.target.value);
                                  setNewSolCode(autoCode(e.target.value));
                                }}
                                placeholder="e.g. Filters"
                              />
                            </div>
                            <div>
                              <Label>3-Letter Code</Label>
                              <Input
                                value={newSolCode}
                                onChange={(e) => setNewSolCode(e.target.value.toUpperCase().slice(0, 3))}
                                maxLength={3}
                                placeholder="e.g. FIL"
                                className="font-mono uppercase"
                              />
                            </div>
                            <Button
                              onClick={() => addSolMutation.mutate({ name: newSolName, code: newSolCode })}
                              disabled={!newSolName || newSolCode.length !== 3 || addSolMutation.isPending}
                              className="w-full"
                            >
                              Add Solution Code
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardTitle>
                    <CardDescription>{solCodes.length} solutions configured</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {solLoading ? (
                      <p className="text-muted-foreground text-sm">Loading...</p>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-auto">
                        {solCodes.map(s => (
                          <div key={s.id} className="flex items-center justify-between p-2 rounded border bg-card">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="font-mono text-base">{s.code}</Badge>
                              <span className="text-sm">{s.solution_name}</span>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete {s.solution_name}?</AlertDialogTitle>
                                  <AlertDialogDescription>This won't change existing FPS Item #s but will affect future generation.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteSolMutation.mutate(s.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Generator Tab */}
            <TabsContent value="generator">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    FPS Item # Generator
                  </CardTitle>
                  <CardDescription>
                    Auto-generate FPS Item #s for inventory items that have a MFG # but no FPS # assigned yet.
                    The system matches manufacturer & solution codes from item data.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <div className="text-lg font-bold text-foreground">{stats.withoutFps}</div>
                      <div className="text-xs text-muted-foreground">Items needing FPS #</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">{mfgCodes.length}</div>
                      <div className="text-xs text-muted-foreground">Manufacturer codes</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">{solCodes.length}</div>
                      <div className="text-xs text-muted-foreground">Solution codes</div>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Before generating</p>
                        <ul className="text-xs text-amber-700 dark:text-amber-300 mt-1 space-y-1">
                          <li>• Only items <strong>without</strong> an existing FPS # will be updated</li>
                          <li>• Items must have a MFG # (item_number) to generate</li>
                          <li>• Unmatched manufacturers will use "UNK", unmatched solutions will use "GEN"</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Preview of what will be generated */}
                  {stats.withoutFps > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Preview (first 20 items):</h4>
                      <div className="overflow-auto max-h-[300px] border rounded">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>MFG #</TableHead>
                              <TableHead>Generated FPS #</TableHead>
                              <TableHead>Name</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inventoryItems
                              .filter(i => i.item_number && !i.fps_item_number)
                              .slice(0, 20)
                              .map(item => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-mono text-sm">{item.item_number}</TableCell>
                                  <TableCell>
                                    <Badge variant="secondary" className="font-mono">
                                      {buildFpsNumber(item) || '—'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm truncate max-w-[200px]">{item.name || item.description || '—'}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleBulkGenerate}
                    disabled={isGenerating || stats.withoutFps === 0}
                    size="lg"
                    className="w-full"
                  >
                    {isGenerating ? (
                      <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                    ) : (
                      <><Zap className="h-4 w-4 mr-2" />Generate FPS Item #s for {stats.withoutFps} Items</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Conflicts Tab */}
            <TabsContent value="conflicts">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Duplicate FPS Item # Conflicts
                  </CardTitle>
                  <CardDescription>
                    Items sharing the same FPS Item # that need resolution.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {conflicts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-lg font-medium">No conflicts detected</p>
                      <p className="text-sm">All FPS Item #s are unique.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {conflicts.map(({ fpsNumber, items }) => (
                        <div key={fpsNumber} className="border rounded-lg p-4 bg-destructive/5">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="destructive" className="font-mono">{fpsNumber}</Badge>
                            <span className="text-sm text-destructive">{items.length} items share this number</span>
                          </div>
                          <div className="space-y-1">
                            {items.map(item => (
                              <div key={item.id} className="text-sm flex items-center gap-2">
                                <span className="font-mono text-muted-foreground">{item.item_number || 'No MFG #'}</span>
                                <span>—</span>
                                <span>{item.name || item.description || 'Unnamed'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default FpsItemMatrix;
