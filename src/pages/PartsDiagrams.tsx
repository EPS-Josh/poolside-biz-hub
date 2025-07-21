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
import { Settings, Upload, FileImage, Download, Trash2, Plus, Eye, ArrowLeft, Home, BookOpen, FileText } from 'lucide-react';

interface PartsDiagram {
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

const PartsDiagrams = () => {
  const { category } = useParams<{ category: string }>();
  const decodedCategory = category ? decodeURIComponent(category) : null;
  const [partsDiagrams, setPartsDiagrams] = useState<PartsDiagram[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    manufacturer: '',
    model: '',
    file: null as File | null
  });
  const [uploading, setUploading] = useState(false);
  const [viewingDiagram, setViewingDiagram] = useState<PartsDiagram | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchPartsDiagrams = async () => {
    try {
      let query = supabase
        .from('parts_diagrams')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by category if provided - include uncategorized items too
      if (decodedCategory) {
        query = query.or(`category.eq.${decodedCategory},category.is.null`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPartsDiagrams(data || []);
    } catch (error) {
      console.error('Error fetching parts diagrams:', error);
      toast({
        title: "Error",
        description: "Failed to load parts diagrams",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartsDiagrams();
  }, []);

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
      const filePath = `parts-diagrams/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('tsb-attachments')
        .upload(filePath, uploadData.file);

      if (uploadError) throw uploadError;

      // Save to parts_diagrams table
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error: dbError } = await supabase
        .from('parts_diagrams')
        .insert({
          user_id: user.user.id,
          title: uploadData.title,
          manufacturer: uploadData.manufacturer || null,
          model: uploadData.model || null,
          category: decodedCategory || null,
          file_name: uploadData.file.name,
          file_path: filePath,
          file_size: uploadData.file.size,
          file_type: uploadData.file.type || null
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Parts diagram uploaded successfully",
      });

      setIsUploadDialogOpen(false);
      setUploadData({ title: '', manufacturer: '', model: '', file: null });
      fetchPartsDiagrams();
    } catch (error) {
      console.error('Error uploading parts diagram:', error);
      toast({
        title: "Error",
        description: "Failed to upload parts diagram",
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

  const handleViewDiagram = async (diagram: PartsDiagram) => {
    try {
      const { data } = await supabase.storage
        .from('tsb-attachments')
        .createSignedUrl(diagram.file_path, 3600); // 1 hour expiry

      if (data?.signedUrl) {
        const popup = window.open(
          data.signedUrl, 
          'diagram-viewer',
          'width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,location=no,directories=no,status=no,menubar=no'
        );
        
        if (popup) {
          popup.focus();
        }
      }
    } catch (error) {
      console.error('Error viewing diagram:', error);
      toast({
        title: "Error",
        description: "Failed to open diagram",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDiagram = async (diagram: PartsDiagram) => {
    try {
      const { data } = await supabase.storage
        .from('tsb-attachments')
        .createSignedUrl(diagram.file_path, 3600);

      if (data?.signedUrl) {
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = diagram.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading diagram:', error);
      toast({
        title: "Error",
        description: "Failed to download diagram",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDiagram = async (diagram: PartsDiagram) => {
    if (!confirm('Are you sure you want to delete this diagram?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('tsb-attachments')
        .remove([diagram.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('parts_diagrams')
        .delete()
        .eq('id', diagram.id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Diagram deleted successfully",
      });

      fetchPartsDiagrams();
    } catch (error) {
      console.error('Error deleting diagram:', error);
      toast({
        title: "Error",
        description: "Failed to delete diagram",
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
              <span className="text-foreground font-medium">Parts Diagrams</span>
            </div>
            
            {/* Header with Navigation */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/tsbs')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to TSBs</span>
                </Button>
              </div>
              
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center space-x-3">
                <Settings className="h-8 w-8" />
                <span>Parts Diagrams</span>
                {decodedCategory && <span className="text-lg font-normal text-muted-foreground">- {decodedCategory}</span>}
              </h1>
              <p className="text-muted-foreground">
                {decodedCategory 
                  ? `Upload and manage parts diagrams for ${decodedCategory} equipment`
                  : 'Upload and manage parts diagrams for equipment repair reference'
                }
              </p>
              
              {/* Quick Navigation */}
              <div className="flex flex-wrap gap-3 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(decodedCategory ? `/manuals/${encodeURIComponent(decodedCategory)}` : '/manuals')}
                  className="flex items-center space-x-2"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Manuals</span>
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

            <div className="mb-6">
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Parts Diagram
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Parts Diagram</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleFileUpload} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Diagram Title *</Label>
                      <Input
                        id="title"
                        value={uploadData.title}
                        onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                        placeholder="e.g., Pool Pump Parts Diagram"
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
                      <Label htmlFor="file">File *</Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.gif"
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
                <p className="text-muted-foreground">Loading parts diagrams...</p>
              </div>
            ) : partsDiagrams.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Parts Diagrams Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {decodedCategory 
                      ? `Start by uploading your first parts diagram for ${decodedCategory}`
                      : 'Start by uploading your first parts diagram'
                    }
                  </p>
                  <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Upload First Diagram
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Upload Parts Diagram</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleFileUpload} className="space-y-4">
                        <div>
                          <Label htmlFor="title">Diagram Title *</Label>
                          <Input
                            id="title"
                            value={uploadData.title}
                            onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                            placeholder="e.g., Pool Pump Parts Diagram"
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
                          <Label htmlFor="file">File *</Label>
                          <Input
                            id="file"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.gif"
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
                {partsDiagrams.map((diagram) => (
                  <Card key={diagram.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg flex items-center space-x-2">
                            <FileImage className="h-5 w-5" />
                            <span>{diagram.title}</span>
                          </CardTitle>
                          <div className="flex items-center space-x-2">
                            {diagram.manufacturer && (
                              <Badge variant="outline">{diagram.manufacturer}</Badge>
                            )}
                            {diagram.model && (
                              <Badge variant="secondary">{diagram.model}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDiagram(diagram)}
                            title="View diagram"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadDiagram(diagram)}
                            title="Download diagram"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteDiagram(diagram)}
                            title="Delete diagram"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        <p>File: {diagram.file_name}</p>
                        <p>Size: {formatFileSize(diagram.file_size)}</p>
                        <p>Uploaded: {new Date(diagram.created_at).toLocaleDateString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default PartsDiagrams;