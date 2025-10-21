import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Upload, FileText, Download, Trash2, Plus, ArrowLeft, Home, Settings, Eye, Edit, FolderOpen, Folders } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Manual {
  id: string;
  title: string;
  manufacturer: string;
  model: string;
  category: string;
  file_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

const Manuals = () => {
  const { category } = useParams<{ category: string }>();
  const decodedCategory = category ? decodeURIComponent(category) : null;
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [tsbCategories, setTsbCategories] = useState<string[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingManual, setEditingManual] = useState<Manual | null>(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    manufacturer: '',
    model: '',
    category: '',
    file: null as File | null
  });
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchManuals = async () => {
    try {
      let query = supabase
        .from('manuals')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by category if provided
      if (decodedCategory) {
        if (decodedCategory === 'Uncategorized') {
          query = query.is('category', null);
        } else {
          query = query.eq('category', decodedCategory);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setManuals(data || []);
    } catch (error) {
      console.error('Error fetching manuals:', error);
      toast({
        title: "Error",
        description: "Failed to load manuals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTsbCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('tsbs')
        .select('category')
        .not('category', 'is', null);

      if (error) throw error;
      
      const uniqueCategories = [...new Set(data.map(item => item.category))].sort();
      setTsbCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching TSB categories:', error);
    }
  };

  const fetchCategoryCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('manuals')
        .select('category');

      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach((manual) => {
        const cat = manual.category || 'Uncategorized';
        counts[cat] = (counts[cat] || 0) + 1;
      });
      setCategoryCounts(counts);
    } catch (error) {
      console.error('Error fetching category counts:', error);
    }
  };

  useEffect(() => {
    fetchManuals();
    fetchTsbCategories();
    fetchCategoryCounts();
  }, [decodedCategory]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.title) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and select a file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Create file path
      const fileExt = uploadData.file.name.split('.').pop();
      const fileName = `${Date.now()}-${uploadData.file.name}`;
      const filePath = `manuals/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('tsb-attachments')
        .upload(filePath, uploadData.file);

      if (uploadError) throw uploadError;

      // Save to manuals table
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error: dbError } = await supabase
        .from('manuals')
        .insert({
          user_id: user.user.id,
          title: uploadData.title,
          manufacturer: uploadData.manufacturer || null,
          model: uploadData.model || null,
          category: uploadData.category || decodedCategory || null,
          file_name: uploadData.file.name,
          file_path: filePath,
          file_size: uploadData.file.size,
          file_type: uploadData.file.type || null
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Manual uploaded successfully",
      });

      setIsUploadDialogOpen(false);
      setUploadData({ title: '', manufacturer: '', model: '', category: '', file: null });
      fetchManuals();
      fetchCategoryCounts();
    } catch (error) {
      console.error('Error uploading manual:', error);
      toast({
        title: "Error",
        description: "Failed to upload manual",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewManual = async (manual: Manual) => {
    try {
      const { data } = await supabase.storage
        .from('tsb-attachments')
        .createSignedUrl(manual.file_path, 3600); // 1 hour expiry

      if (data?.signedUrl) {
        const popup = window.open(
          data.signedUrl, 
          'manual-viewer',
          'width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,location=no,directories=no,status=no,menubar=no'
        );
        
        if (popup) {
          popup.focus();
        }
      }
    } catch (error) {
      console.error('Error viewing manual:', error);
      toast({
        title: "Error",
        description: "Failed to open manual",
        variant: "destructive",
      });
    }
  };

  const handleDownloadManual = async (manual: Manual) => {
    try {
      const { data } = await supabase.storage
        .from('tsb-attachments')
        .createSignedUrl(manual.file_path, 3600);

      if (data?.signedUrl) {
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = manual.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading manual:', error);
      toast({
        title: "Error",
        description: "Failed to download manual",
        variant: "destructive",
      });
    }
  };

  const handleDeleteManual = async (manual: Manual) => {
    if (!confirm('Are you sure you want to delete this manual?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('tsb-attachments')
        .remove([manual.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('manuals')
        .delete()
        .eq('id', manual.id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Manual deleted successfully",
      });

      fetchManuals();
      fetchCategoryCounts();
    } catch (error) {
      console.error('Error deleting manual:', error);
      toast({
        title: "Error",
        description: "Failed to delete manual",
        variant: "destructive",
      });
    }
  };

  const handleEditManual = (manual: Manual) => {
    setEditingManual(manual);
    setIsEditDialogOpen(true);
  };

  const handleUpdateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingManual) return;

    try {
      const { error } = await supabase
        .from('manuals')
        .update({
          title: editingManual.title,
          manufacturer: editingManual.manufacturer || null,
          model: editingManual.model || null,
          category: editingManual.category || null,
        })
        .eq('id', editingManual.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Manual updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingManual(null);
      fetchManuals();
      fetchCategoryCounts();
    } catch (error) {
      console.error('Error updating manual:', error);
      toast({
        title: "Error",
        description: "Failed to update manual",
        variant: "destructive",
      });
    }
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/tsbs')}
                className="text-muted-foreground hover:text-foreground"
              >
                TSBs
              </Button>
              <span>/</span>
              {decodedCategory && (
                <>
                  <span className="text-muted-foreground">{decodedCategory}</span>
                  <span>/</span>
                </>
              )}
              <span className="text-foreground font-medium">Manuals</span>
            </div>
            
            {/* Header with Navigation */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-4">
                {decodedCategory ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/manuals')}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to All Manuals</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/tsbs')}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to TSBs</span>
                  </Button>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center space-x-3">
                <BookOpen className="h-8 w-8" />
                <span>Equipment Manuals</span>
                {decodedCategory && <span className="text-lg font-normal text-muted-foreground">- {decodedCategory}</span>}
              </h1>
              <p className="text-muted-foreground">
                {decodedCategory 
                  ? `Upload and manage equipment manuals for ${decodedCategory}`
                  : 'Upload and manage equipment manuals and documentation'
                }
              </p>
              
              {/* Quick Navigation */}
              <div className="flex flex-wrap gap-3 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(decodedCategory ? `/parts-diagrams/${encodeURIComponent(decodedCategory)}` : '/parts-diagrams')}
                  className="flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Parts Diagrams</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/tsbs')}
                  className="flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>TSBs</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/inventory')}
                  className="flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Inventory</span>
                </Button>
              </div>
            </div>

            {/* Category Cards - Only show when not filtering by category */}
            {!decodedCategory && Object.keys(categoryCounts).length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center space-x-2">
                  <Folders className="h-5 w-5" />
                  <span>Browse by Category</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Object.entries(categoryCounts).map(([categoryName, count]) => (
                    <Card 
                      key={categoryName}
                      className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 group"
                      onClick={() => navigate(`/manuals/${encodeURIComponent(categoryName)}`)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <FolderOpen className="h-8 w-8 text-primary group-hover:text-primary/80 transition-colors" />
                          <Badge variant="secondary" className="text-xs">
                            {count} {count === 1 ? 'manual' : 'manuals'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                          {categoryName}
                        </CardTitle>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Only show upload button and manuals list when inside a category */}
            {decodedCategory && (
              <>
              <div className="mb-6">
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Manual
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Equipment Manual</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleFileUpload} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Manual Title *</Label>
                      <Input
                        id="title"
                        value={uploadData.title}
                        onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                        placeholder="e.g., Pool Pump Installation Guide"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="manufacturer">Manufacturer</Label>
                      <Input
                        id="manufacturer"
                        value={uploadData.manufacturer}
                        onChange={(e) => setUploadData({ ...uploadData, manufacturer: e.target.value })}
                        placeholder="e.g., Pentair"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        value={uploadData.model}
                        onChange={(e) => setUploadData({ ...uploadData, model: e.target.value })}
                        placeholder="e.g., SuperFlo VS"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={uploadData.category}
                        onValueChange={(value) => setUploadData({ ...uploadData, category: value === 'none' ? '' : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={decodedCategory ? `Default: ${decodedCategory}` : "Select category (optional)"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Category</SelectItem>
                          {tsbCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="file">File *</Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                        required
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button type="submit" disabled={uploading} className="flex-1">
                        {uploading ? (
                          <>
                            <Upload className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsUploadDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading manuals...</p>
              </div>
            ) : manuals.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Manuals Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {decodedCategory 
                      ? `Start by uploading your first equipment manual for ${decodedCategory}`
                      : 'Start by uploading your first equipment manual'
                    }
                  </p>
                  <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Upload First Manual
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Upload Equipment Manual</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleFileUpload} className="space-y-4">
                        <div>
                          <Label htmlFor="title">Manual Title *</Label>
                          <Input
                            id="title"
                            value={uploadData.title}
                            onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                            placeholder="e.g., Pool Pump Installation Guide"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="manufacturer">Manufacturer</Label>
                          <Input
                            id="manufacturer"
                            value={uploadData.manufacturer}
                            onChange={(e) => setUploadData({ ...uploadData, manufacturer: e.target.value })}
                            placeholder="e.g., Pentair"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="model">Model</Label>
                          <Input
                            id="model"
                            value={uploadData.model}
                            onChange={(e) => setUploadData({ ...uploadData, model: e.target.value })}
                            placeholder="e.g., SuperFlo VS"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={uploadData.category}
                            onValueChange={(value) => setUploadData({ ...uploadData, category: value === 'none' ? '' : value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={decodedCategory ? `Default: ${decodedCategory}` : "Select category (optional)"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Category</SelectItem>
                              {tsbCategories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="file">File *</Label>
                          <Input
                            id="file"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                            required
                          />
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button type="submit" disabled={uploading} className="flex-1">
                            {uploading ? (
                              <>
                                <Upload className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload
                              </>
                            )}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsUploadDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {manuals.map((manual) => (
                  <Card key={manual.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg flex items-center space-x-2">
                            <FileText className="h-5 w-5" />
                            <span>{manual.title}</span>
                          </CardTitle>
                          <div className="flex items-center space-x-2">
                            {manual.manufacturer && (
                              <Badge variant="outline">{manual.manufacturer}</Badge>
                            )}
                            {manual.model && (
                              <Badge variant="secondary">{manual.model}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewManual(manual)}
                            title="View manual"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditManual(manual)}
                            title="Edit manual"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadManual(manual)}
                            title="Download manual"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteManual(manual)}
                            title="Delete manual"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        <p>File: {manual.file_name}</p>
                        <p>Size: {formatFileSize(manual.file_size)}</p>
                        <p>Uploaded: {new Date(manual.created_at).toLocaleDateString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            </>
            )}

            {/* Edit Manual Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Manual</DialogTitle>
                </DialogHeader>
                {editingManual && (
                  <form onSubmit={handleUpdateManual} className="space-y-4">
                    <div>
                      <Label htmlFor="edit-title">Manual Title *</Label>
                      <Input
                        id="edit-title"
                        value={editingManual.title}
                        onChange={(e) => setEditingManual({ ...editingManual, title: e.target.value })}
                        placeholder="e.g., Pool Pump Installation Guide"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-manufacturer">Manufacturer</Label>
                      <Input
                        id="edit-manufacturer"
                        value={editingManual.manufacturer || ''}
                        onChange={(e) => setEditingManual({ ...editingManual, manufacturer: e.target.value })}
                        placeholder="e.g., Pentair"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-model">Model</Label>
                      <Input
                        id="edit-model"
                        value={editingManual.model || ''}
                        onChange={(e) => setEditingManual({ ...editingManual, model: e.target.value })}
                        placeholder="e.g., SuperFlo VS"
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-category">Category</Label>
                      <Select
                        value={editingManual.category || ''}
                        onValueChange={(value) => setEditingManual({ ...editingManual, category: value === 'none' ? null : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Category</SelectItem>
                          {tsbCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button type="submit" className="flex-1">
                        Update Manual
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Manuals;