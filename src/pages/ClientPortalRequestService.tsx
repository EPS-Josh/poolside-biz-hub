import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCustomerData } from '@/hooks/useCustomerData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const requestSchema = z.object({
  service_type: z.string().min(1, 'Please select a service type'),
  preferred_contact_method: z.string().min(1, 'Please select a contact method'),
  message: z.string().optional(),
});

const ClientPortalRequestService = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customer, loading: customerLoading } = useCustomerData();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    service_type: '',
    preferred_contact_method: 'email',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customer) return;

    try {
      const validated = requestSchema.parse(formData);
      setSubmitting(true);

      const { error } = await supabase
        .from('service_requests')
        .insert({
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          service_type: validated.service_type,
          preferred_contact_method: validated.preferred_contact_method,
          message: validated.message || null,
          status: 'new',
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your service request has been submitted. We will contact you soon!',
      });

      navigate('/client-portal');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to submit service request',
          variant: 'destructive',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (customerLoading) {
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
          <h1 className="text-2xl font-bold">Request Service</h1>
          <p className="text-muted-foreground">Submit a new service request</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Service Request Form</CardTitle>
            <CardDescription>
              Fill out the form below and we'll get back to you shortly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="service_type">Service Type *</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                >
                  <SelectTrigger id="service_type">
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regular Maintenance">Regular Maintenance</SelectItem>
                    <SelectItem value="Repair">Repair</SelectItem>
                    <SelectItem value="Chemical Balance">Chemical Balance</SelectItem>
                    <SelectItem value="Equipment Installation">Equipment Installation</SelectItem>
                    <SelectItem value="Filter Cleaning">Filter Cleaning</SelectItem>
                    <SelectItem value="Emergency Service">Emergency Service</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Preferred Contact Method *</Label>
                <RadioGroup
                  value={formData.preferred_contact_method}
                  onValueChange={(value) => setFormData({ ...formData, preferred_contact_method: value })}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="font-normal cursor-pointer">
                      Email
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="phone" id="phone" />
                    <Label htmlFor="phone" className="font-normal cursor-pointer">
                      Phone
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="message">Additional Details (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Describe the issue or service you need..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Service Address</p>
                <p className="text-sm text-muted-foreground">
                  {customer?.address}<br />
                  {customer?.city}, {customer?.state} {customer?.zip_code}
                </p>
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ClientPortalRequestService;
