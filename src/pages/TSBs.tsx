import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TSBForm } from '@/components/TSBForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Search, AlertTriangle, Wrench, Zap, Edit3, Eye, ChevronDown, ChevronUp, BookOpen, Settings, ArrowLeft, Home, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TSB {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  manufacturer: string;
  equipment_models: string[];
  symptoms: string[];
  root_cause: string;
  issue_description: string;
  solution_steps: string;
  prevention_tips: string;
  safety_notes: string;
  troubleshooting_steps: string;
  tools_required: string[];
  estimated_time_minutes: number;
  attachments: any[];
  created_at: string;
}

const TSBs = () => {
  const [tsbs, setTsbs] = useState<TSB[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTSB, setSelectedTSB] = useState<TSB | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [expandedTSB, setExpandedTSB] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleTSBCreated = () => {
    setIsCreateDialogOpen(false);
    fetchTSBs(); // Refresh the list
  };

  const handleTSBUpdated = () => {
    setIsEditDialogOpen(false);
    setSelectedTSB(null);
    fetchTSBs(); // Refresh the list
  };

  const handleViewTSB = (tsb: TSB) => {
    setSelectedTSB(tsb);
    setIsViewDialogOpen(true);
  };

  const handleEditTSB = (tsb: TSB) => {
    setSelectedTSB(tsb);
    setIsEditDialogOpen(true);
  };

  const categories = [
    { id: 'all', name: 'All Categories', icon: FileText, color: 'bg-gray-500' },
    { id: 'Pump Systems', name: 'Pump Systems', icon: Wrench, color: 'bg-blue-500' },
    { id: 'Filtration Systems', name: 'Filtration Systems', icon: FileText, color: 'bg-green-500' },
    { id: 'Heating Systems', name: 'Heating Systems', icon: Zap, color: 'bg-red-500' },
    { id: 'Sanitization & Chemical Systems', name: 'Sanitization & Chemical', icon: FileText, color: 'bg-purple-500' },
    { id: 'Control Systems & Automation', name: 'Control Systems', icon: FileText, color: 'bg-indigo-500' },
    { id: 'Water Features & Accessories', name: 'Water Features', icon: FileText, color: 'bg-cyan-500' },
    { id: 'Spa/Hot Tub Specific', name: 'Spa/Hot Tub Specific', icon: FileText, color: 'bg-pink-500' },
    { id: 'Safety Equipment', name: 'Safety Equipment', icon: AlertTriangle, color: 'bg-yellow-500' },
    { id: 'Electrical Components', name: 'Electrical Components', icon: Zap, color: 'bg-orange-500' },
    { id: 'Plumbing & Hydraulics', name: 'Plumbing & Hydraulics', icon: Wrench, color: 'bg-teal-500' },
    { id: 'In-Floor Cleaning Systems', name: 'In-Floor Cleaning Systems', icon: Wrench, color: 'bg-emerald-500' }
  ];

  const fetchTSBs = async () => {
    try {
      console.log('Fetching TSBs...');
      const { data, error } = await supabase
        .from('tsbs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      console.log('TSBs fetched successfully:', data);
      
      // Transform the data to match our TSB interface
      const transformedData = data?.map(item => ({
        ...item,
        attachments: Array.isArray(item.attachments) ? item.attachments : [],
        equipment_models: Array.isArray(item.equipment_models) ? item.equipment_models : [],
        symptoms: Array.isArray(item.symptoms) ? item.symptoms : [],
        tools_required: Array.isArray(item.tools_required) ? item.tools_required : [],
      })) || [];
      
      setTsbs(transformedData);
    } catch (error) {
      console.error('Error fetching TSBs:', error);
      toast({
        title: "Error",
        description: "Failed to load TSBs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('TSBs component mounted, fetching data...');
    fetchTSBs();
  }, []);

  console.log('TSBs component rendered. Loading:', loading, 'TSBs count:', tsbs.length);

  const filteredTSBs = selectedCategory === 'all' 
    ? tsbs 
    : tsbs.filter(tsb => tsb.category === selectedCategory);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryStats = () => {
    return categories.map(category => ({
      ...category,
      count: category.id === 'all' 
        ? tsbs.length 
        : tsbs.filter(tsb => tsb.category === category.id).length
    }));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center space-x-1 text-muted-foreground hover:text-foreground"
              >
                <Home className="h-4 w-4" />
                <span>Menu</span>
              </Button>
              <span>/</span>
              {selectedCategory !== 'all' ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    TSBs
                  </Button>
                  <span>/</span>
                  <span className="text-foreground font-medium">
                    {categories.find(c => c.id === selectedCategory)?.name}
                  </span>
                </>
              ) : (
                <span className="text-foreground font-medium">TSBs</span>
              )}
            </div>
            
            {/* Header with Back Button */}
            <div className="mb-8 flex items-center space-x-4">
              {selectedCategory !== 'all' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Categories</span>
                </Button>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {selectedCategory !== 'all' 
                    ? categories.find(c => c.id === selectedCategory)?.name 
                    : 'Technical Service Bulletins'
                  }
                </h1>
                <p className="text-muted-foreground">
                  {selectedCategory !== 'all'
                    ? 'Technical service bulletins for this category'
                    : 'Manage and track technical service bulletins for swimming pool and spa equipment repair'
                  }
                </p>
              </div>
            </div>

            <div className="mb-6">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="mb-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New TSB
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <TSBForm onSuccess={handleTSBCreated} onCancel={() => setIsCreateDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>

            <Tabs defaultValue="categories" className="space-y-6">
              <TabsList>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="list">All TSBs</TabsTrigger>
              </TabsList>

              <TabsContent value="categories" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getCategoryStats().map((category) => (
                    <Card 
                      key={category.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer group"
                      onClick={() => {
                        setSelectedCategory(category.id);
                      }}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${category.color}`}>
                              <category.icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-sm group-hover:text-blue-600 transition-colors">
                                {category.name}
                              </CardTitle>
                            </div>
                          </div>
                          <Badge variant="secondary">{category.count}</Badge>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>

                {/* Uncategorized Items Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-foreground mb-4">Uncategorized Items</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/manuals/Uncategorized')}
                      className="flex items-center space-x-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Uncategorized Manuals</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/parts-diagrams/Uncategorized')}
                      className="flex items-center space-x-2"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Uncategorized Parts Diagrams</span>
                    </Button>
                  </div>
                </div>

                {selectedCategory !== 'all' && (
                  <div className="space-y-4">
                    {/* Navigation buttons for Manuals and Parts Diagrams */}
                    <div className="flex flex-wrap gap-3 mb-6">
                      <Button 
                        variant="outline" 
                        onClick={() => navigate(`/manuals/${encodeURIComponent(selectedCategory)}`)}
                        className="flex items-center space-x-2"
                      >
                        <BookOpen className="h-4 w-4" />
                        <span>Manuals</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => navigate(`/parts-diagrams/${encodeURIComponent(selectedCategory)}`)}
                        className="flex items-center space-x-2"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Parts Diagrams</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => navigate('/inventory')}
                        className="flex items-center space-x-2"
                      >
                        <Package className="h-4 w-4" />
                        <span>Inventory</span>
                      </Button>
                    </div>
                    
                    {filteredTSBs.length === 0 ? (
                      <Card>
                        <CardContent className="text-center py-12">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">No TSBs in this category</h3>
                          <p className="text-muted-foreground mb-4">
                            Create your first TSB for this category
                          </p>
                          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create TSB
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <TSBForm onSuccess={handleTSBCreated} onCancel={() => setIsCreateDialogOpen(false)} />
                            </DialogContent>
                          </Dialog>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-2">
                        {filteredTSBs.map((tsb) => (
                          <Card key={tsb.id} className="border-l-4 border-l-primary">
                            <Collapsible 
                              open={expandedTSB === tsb.id} 
                              onOpenChange={(open) => setExpandedTSB(open ? tsb.id : null)}
                            >
                              <CollapsibleTrigger asChild>
                                <div className="w-full p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <h3 className="text-lg font-medium text-foreground hover:text-primary">
                                        {tsb.title}
                                      </h3>
                                      <Badge className={getPriorityColor(tsb.priority)}>
                                        {tsb.priority}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditTSB(tsb);
                                        }}
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </Button>
                                      {expandedTSB === tsb.id ? (
                                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              
                              <CollapsibleContent>
                                <div className="px-4 pb-4 border-t">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                    <div className="space-y-4">
                                      {tsb.description && (
                                        <div>
                                          <h4 className="font-medium text-foreground mb-2">Description</h4>
                                          <p className="text-sm text-muted-foreground">{tsb.description}</p>
                                        </div>
                                      )}
                                      
                                      {tsb.issue_description && (
                                        <div>
                                          <h4 className="font-medium text-foreground mb-2">Issue Description</h4>
                                          <p className="text-sm text-muted-foreground">{tsb.issue_description}</p>
                                        </div>
                                      )}
                                      
                                      {tsb.root_cause && (
                                        <div>
                                          <h4 className="font-medium text-foreground mb-2">Root Cause</h4>
                                          <p className="text-sm text-muted-foreground">{tsb.root_cause}</p>
                                        </div>
                                      )}
                                      
                                      {tsb.equipment_models && tsb.equipment_models.length > 0 && (
                                        <div>
                                          <h4 className="font-medium text-foreground mb-2">Equipment Models</h4>
                                          <div className="flex flex-wrap gap-1">
                                            {tsb.equipment_models.map((model, index) => (
                                              <Badge key={index} variant="secondary" className="text-xs">{model}</Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {tsb.symptoms && tsb.symptoms.length > 0 && (
                                        <div>
                                          <h4 className="font-medium text-foreground mb-2">Symptoms</h4>
                                          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                            {tsb.symptoms.map((symptom, index) => (
                                              <li key={index}>{symptom}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="space-y-4">
                                      {tsb.solution_steps && (
                                        <div>
                                          <h4 className="font-medium text-foreground mb-2">Solution Steps</h4>
                                          <div className="text-sm text-muted-foreground whitespace-pre-wrap">{tsb.solution_steps}</div>
                                        </div>
                                      )}
                                      
                                      {tsb.troubleshooting_steps && (
                                        <div>
                                          <h4 className="font-medium text-foreground mb-2">Troubleshooting Steps</h4>
                                          <div className="text-sm text-muted-foreground whitespace-pre-wrap">{tsb.troubleshooting_steps}</div>
                                        </div>
                                      )}
                                      
                                      {tsb.prevention_tips && (
                                        <div>
                                          <h4 className="font-medium text-foreground mb-2">Prevention Tips</h4>
                                          <div className="text-sm text-muted-foreground whitespace-pre-wrap">{tsb.prevention_tips}</div>
                                        </div>
                                      )}
                                      
                                      {tsb.safety_notes && (
                                        <div>
                                          <h4 className="font-medium text-foreground mb-2">Safety Notes</h4>
                                          <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">{tsb.safety_notes}</div>
                                        </div>
                                      )}
                                      
                                      {tsb.tools_required && tsb.tools_required.length > 0 && (
                                        <div>
                                          <h4 className="font-medium text-foreground mb-2">Tools Required</h4>
                                          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                            {tsb.tools_required.map((tool, index) => (
                                              <li key={index}>{tool}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      
                                      {tsb.estimated_time_minutes && (
                                        <div>
                                          <h4 className="font-medium text-foreground mb-2">Estimated Time</h4>
                                          <p className="text-sm text-muted-foreground">{tsb.estimated_time_minutes} minutes</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="list">
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading TSBs...</p>
                  </div>
                ) : tsbs.length === 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>TSB Management</span>
                      </CardTitle>
                      <CardDescription>
                        Technical Service Bulletins will be displayed here
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No TSBs Found</h3>
                        <p className="text-muted-foreground mb-4">
                          Start by adding your first Technical Service Bulletin
                        </p>
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Create First TSB
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <TSBForm onSuccess={handleTSBCreated} onCancel={() => setIsCreateDialogOpen(false)} />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {tsbs.map((tsb) => (
                      <Card key={tsb.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <CardTitle className="text-lg">{tsb.title}</CardTitle>
                              <CardDescription>{tsb.description}</CardDescription>
                              <div className="flex items-center space-x-2 pt-2">
                                <Badge className={getPriorityColor(tsb.priority)}>
                                  {tsb.priority}
                                </Badge>
                                <Badge variant="outline">{tsb.category}</Badge>
                                <Badge variant="outline">{tsb.manufacturer}</Badge>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewTSB(tsb)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditTSB(tsb)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* View TSB Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                {selectedTSB && (
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedTSB.title}</h2>
                        <p className="text-muted-foreground mt-1">{selectedTSB.description}</p>
                        <div className="flex items-center space-x-2 mt-3">
                          <Badge className={getPriorityColor(selectedTSB.priority)}>
                            {selectedTSB.priority}
                          </Badge>
                          <Badge variant="outline">{selectedTSB.category}</Badge>
                          <Badge variant="outline">{selectedTSB.manufacturer}</Badge>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsViewDialogOpen(false);
                          handleEditTSB(selectedTSB);
                        }}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>

                    <div className="grid gap-6">
                      {selectedTSB.equipment_models && selectedTSB.equipment_models.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Equipment Models</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedTSB.equipment_models.map((model, index) => (
                              <Badge key={index} variant="secondary">{model}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedTSB.symptoms && selectedTSB.symptoms.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Common Symptoms</h3>
                          <ul className="list-disc list-inside space-y-1">
                            {selectedTSB.symptoms.map((symptom, index) => (
                              <li key={index} className="text-muted-foreground">{symptom}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedTSB.root_cause && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Root Cause</h3>
                          <p className="text-muted-foreground">{selectedTSB.root_cause}</p>
                        </div>
                      )}

                      {selectedTSB.issue_description && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Issue Description</h3>
                          <p className="text-muted-foreground whitespace-pre-wrap">{selectedTSB.issue_description}</p>
                        </div>
                      )}

                      {selectedTSB.solution_steps && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Solution Steps</h3>
                          <p className="text-muted-foreground whitespace-pre-wrap">{selectedTSB.solution_steps}</p>
                        </div>
                      )}

                      {selectedTSB.troubleshooting_steps && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Troubleshooting Steps</h3>
                          <p className="text-muted-foreground whitespace-pre-wrap">{selectedTSB.troubleshooting_steps}</p>
                        </div>
                      )}

                      {selectedTSB.tools_required && selectedTSB.tools_required.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Tools Required</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedTSB.tools_required.map((tool, index) => (
                              <Badge key={index} variant="outline">{tool}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedTSB.estimated_time_minutes && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Estimated Time</h3>
                          <p className="text-muted-foreground">{selectedTSB.estimated_time_minutes} minutes</p>
                        </div>
                      )}

                      {selectedTSB.prevention_tips && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Prevention Tips</h3>
                          <p className="text-muted-foreground whitespace-pre-wrap">{selectedTSB.prevention_tips}</p>
                        </div>
                      )}

                      {selectedTSB.safety_notes && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <h3 className="text-lg font-semibold mb-2 text-yellow-800">Safety Notes</h3>
                          <p className="text-yellow-700 whitespace-pre-wrap">{selectedTSB.safety_notes}</p>
                        </div>
                      )}

                      {selectedTSB.attachments && selectedTSB.attachments.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Attachments</h3>
                          <div className="grid gap-2">
                            {selectedTSB.attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{attachment.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {attachment.type} • {(attachment.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(attachment.url, '_blank')}
                                >
                                  View
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Edit TSB Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                {selectedTSB && (
                  <TSBForm 
                    initialData={selectedTSB}
                    onSuccess={handleTSBUpdated} 
                    onCancel={() => {
                      setIsEditDialogOpen(false);
                      setSelectedTSB(null);
                    }} 
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default TSBs;