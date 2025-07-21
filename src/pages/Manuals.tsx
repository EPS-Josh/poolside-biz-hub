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
import { useNavigate } from 'react-router-dom';
import { BookOpen, Upload, FileText, Download, Trash2, Plus, ArrowLeft, Home, Settings } from 'lucide-react';

interface Manual {
  id: string;
  title: string;
  manufacturer: string;
  model: string;
  file_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

const Manuals = () => {
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    manufacturer: '',
    model: '',
    file: null as File | null
  });
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchManuals = async () => {
    try {
      // This would fetch from a manuals table once created
      setManuals([]);
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

  useEffect(() => {
    fetchManuals();
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
      const filePath = `manuals/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('tsb-attachments')
        .upload(filePath, uploadData.file);

      if (uploadError) throw uploadError;

      // Note: Would save to manuals table once created
      toast({
        title: "Success",
        description: "Manual uploaded successfully",
      });

      setIsUploadDialogOpen(false);
      setUploadData({ title: '', manufacturer: '', model: '', file: null });
      fetchManuals();
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center space-x-3">
                <BookOpen className="h-8 w-8" />
                <span>Equipment Manuals</span>
              </h1>
              <p className="text-muted-foreground">Upload and manage equipment manuals for easy reference</p>
            </div>

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
                    Start by uploading your first equipment manual
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
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
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
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Manuals;