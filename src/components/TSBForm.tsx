import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X, Upload, FileText, Trash2 } from 'lucide-react';

const tsbSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['Pump Systems', 'Filtration Systems', 'Heating Systems', 'Sanitization & Chemical Systems', 'Control Systems & Automation', 'Water Features & Accessories', 'Spa/Hot Tub Specific', 'Safety Equipment', 'Electrical Components', 'Plumbing & Hydraulics', 'In-Floor Cleaning Systems']),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  equipment_models: z.string(),
  symptoms: z.string(),
  root_cause: z.string(),
  issue_description: z.string(),
  solution_steps: z.string(),
  prevention_tips: z.string().optional(),
  safety_notes: z.string().optional(),
  troubleshooting_steps: z.string().optional(),
  tools_required: z.string().optional(),
  estimated_time_minutes: z.string().optional(),
});

type TSBFormData = z.infer<typeof tsbSchema>;

const categories = [
  'Pump Systems',
  'Filtration Systems', 
  'Heating Systems',
  'Sanitization & Chemical Systems',
  'Control Systems & Automation',
  'Water Features & Accessories',
  'Spa/Hot Tub Specific',
  'Safety Equipment',
  'Electrical Components',
  'Plumbing & Hydraulics',
  'In-Floor Cleaning Systems'
];

interface TSBFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export function TSBForm({ onSuccess, onCancel }: TSBFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const { toast } = useToast();

  const form = useForm<TSBFormData>({
    resolver: zodResolver(tsbSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'Pump Systems',
      priority: 'Medium',
      manufacturer: '',
      equipment_models: '',
      symptoms: '',
      root_cause: '',
      issue_description: '',
      solution_steps: '',
      prevention_tips: '',
      safety_notes: '',
      troubleshooting_steps: '',
      tools_required: '',
      estimated_time_minutes: '',
    },
  });

  const stringToArray = (str: string): string[] => {
    return str.split(',').map(item => item.trim()).filter(item => item.length > 0);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const uploadedAttachments: Attachment[] = [];

      for (const file of Array.from(files)) {
        // Validate file type (documents and images)
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'text/plain',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Invalid file type",
            description: `File "${file.name}" is not a supported format`,
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `File "${file.name}" is larger than 10MB`,
            variant: "destructive",
          });
          continue;
        }

        const fileId = crypto.randomUUID();
        const filePath = `${user.id}/${fileId}_${file.name}`;

        const { data, error } = await supabase.storage
          .from('tsb-attachments')
          .upload(filePath, file);

        if (error) throw error;

        const { data: publicUrl } = supabase.storage
          .from('tsb-attachments')
          .getPublicUrl(filePath);

        uploadedAttachments.push({
          id: fileId,
          name: file.name,
          url: publicUrl.publicUrl,
          type: file.type,
          size: file.size
        });
      }

      setAttachments(prev => [...prev, ...uploadedAttachments]);
      
      toast({
        title: "Files uploaded",
        description: `${uploadedAttachments.length} file(s) uploaded successfully`,
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const removeAttachment = async (attachmentId: string) => {
    const attachment = attachments.find(a => a.id === attachmentId);
    if (!attachment) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Extract file path from URL
      const filePath = `${user.id}/${attachmentId}_${attachment.name}`;
      
      const { error } = await supabase.storage
        .from('tsb-attachments')
        .remove([filePath]);

      if (error) throw error;

      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      
      toast({
        title: "File removed",
        description: "Attachment removed successfully",
      });
    } catch (error) {
      console.error('Error removing file:', error);
      toast({
        title: "Error",
        description: "Failed to remove attachment",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const onSubmit = async (data: TSBFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const tsbData = {
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        manufacturer: data.manufacturer,
        equipment_models: data.equipment_models ? stringToArray(data.equipment_models) : [],
        symptoms: data.symptoms ? stringToArray(data.symptoms) : [],
        root_cause: data.root_cause,
        issue_description: data.issue_description,
        solution_steps: data.solution_steps,
        prevention_tips: data.prevention_tips || null,
        safety_notes: data.safety_notes || null,
        troubleshooting_steps: data.troubleshooting_steps || null,
        tools_required: data.tools_required ? stringToArray(data.tools_required) : [],
        estimated_time_minutes: data.estimated_time_minutes ? parseInt(data.estimated_time_minutes) : null,
        attachments: attachments.length > 0 ? JSON.parse(JSON.stringify(attachments)) : null,
        user_id: user.id,
        is_active: true,
        revision_number: 1,
      };

      const { error } = await supabase
        .from('tsbs')
        .insert(tsbData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "TSB created successfully",
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating TSB:', error);
      toast({
        title: "Error",
        description: "Failed to create TSB",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Create New TSB</CardTitle>
            <CardDescription>
              Add a new Technical Service Bulletin for swimming pool and spa equipment
            </CardDescription>
          </div>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Pool Pump Motor Overheating" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Pentair, Hayward, Jacuzzi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the issue"
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issue_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detailed description of the problem"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="equipment_models"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment Models</FormLabel>
                    <FormControl>
                      <Input placeholder="Model1, Model2, Model3" {...field} />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">Separate multiple models with commas</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_time_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Time (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="60" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symptoms *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Motor feels hot, Pump stops running, Reduced water flow"
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">Separate multiple symptoms with commas</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="root_cause"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Root Cause *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Blocked ventilation, debris in impeller, or failing capacitor"
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="solution_steps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Solution Steps *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="1. Check for proper ventilation around motor&#10;2. Inspect impeller for debris&#10;3. Verify correct electrical voltage"
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="tools_required"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tools Required</FormLabel>
                    <FormControl>
                      <Input placeholder="Screwdriver, Multimeter, Wrench" {...field} />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">Separate multiple tools with commas</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prevention_tips"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prevention Tips</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Regular maintenance tips to prevent this issue"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="safety_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Safety Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Important safety considerations"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="troubleshooting_steps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Troubleshooting Steps</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional troubleshooting information"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
              <div>
                <FormLabel>Attachments</FormLabel>
                <p className="text-sm text-muted-foreground mb-3">
                  Upload documents, exploded parts diagrams, images, and other reference materials
                </p>
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag files here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Supports: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, GIF, WEBP (max 10MB each)
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      disabled={isUploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploading}
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      {isUploading ? 'Uploading...' : 'Choose Files'}
                    </Button>
                  </div>
                </div>

                {/* Uploaded Files List */}
                {attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Uploaded Files:</p>
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{attachment.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(attachment.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-6">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create TSB'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}