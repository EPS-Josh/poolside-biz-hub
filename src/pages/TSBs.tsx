import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Search, AlertTriangle, Wrench, Zap } from 'lucide-react';

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
  created_at: string;
}

const TSBs = () => {
  const [tsbs, setTsbs] = useState<TSB[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();

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
    { id: 'Plumbing & Hydraulics', name: 'Plumbing & Hydraulics', icon: Wrench, color: 'bg-teal-500' }
  ];

  const fetchTSBs = async () => {
    try {
      const { data, error } = await supabase
        .from('tsbs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTsbs(data || []);
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
    fetchTSBs();
  }, []);

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
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Technical Service Bulletins</h1>
              <p className="text-muted-foreground">Manage and track technical service bulletins for swimming pool and spa equipment repair</p>
            </div>

            <div className="mb-6">
              <Button className="mb-4">
                <Plus className="h-4 w-4 mr-2" />
                Add New TSB
              </Button>
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

                {selectedCategory !== 'all' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-semibold">
                        {categories.find(c => c.id === selectedCategory)?.name} TSBs
                      </h2>
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedCategory('all')}
                      >
                        View All Categories
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
                          <Button variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Create TSB
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4">
                        {filteredTSBs.map((tsb) => (
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
                                    <Badge variant="outline">{tsb.manufacturer}</Badge>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {tsb.equipment_models && tsb.equipment_models.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Equipment Models:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {tsb.equipment_models.map((model, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">{model}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {tsb.symptoms && tsb.symptoms.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Common Symptoms:</p>
                                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                                      {tsb.symptoms.slice(0, 3).map((symptom, index) => (
                                        <li key={index}>{symptom}</li>
                                      ))}
                                      {tsb.symptoms.length > 3 && (
                                        <li className="text-xs italic">+{tsb.symptoms.length - 3} more...</li>
                                      )}
                                    </ul>
                                  </div>
                                )}

                                {tsb.root_cause && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Root Cause:</p>
                                    <p className="text-sm text-muted-foreground">{tsb.root_cause}</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
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
                        <Button variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Create First TSB
                        </Button>
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
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default TSBs;