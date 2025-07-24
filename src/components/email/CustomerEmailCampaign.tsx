import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Users, Send, X } from 'lucide-react';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
}

interface CustomerEmailCampaignProps {
  customers: Customer[];
  onClose: () => void;
}

const emailTemplates: EmailTemplate[] = [
  {
    id: 'service_reminder',
    name: 'Service Reminder',
    subject: 'Time for Your Regular Maintenance Service',
    content: `Dear {{firstName}},

We hope this message finds you well. It's time for your regular maintenance service to keep your systems running smoothly.

Our team would be happy to schedule a convenient time for your service appointment.

Please contact us at your earliest convenience to schedule.

Best regards,
Your Service Team`
  },
  {
    id: 'promotional_offer',
    name: 'Promotional Offer',
    subject: 'Special Service Offer - Limited Time',
    content: `Hello {{firstName}},

We're excited to offer you an exclusive discount on our professional services.

Limited time offer:
• 15% off regular maintenance
• Priority scheduling
• Extended warranty options

{{#company}}This offer is valid for {{company}} and expires soon.{{/company}}

Contact us today to take advantage of this special pricing.

Best regards,
Your Service Team`
  },
  {
    id: 'custom',
    name: 'Custom Message',
    subject: '',
    content: ''
  }
];

export const CustomerEmailCampaign: React.FC<CustomerEmailCampaignProps> = ({
  customers,
  onClose
}) => {
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [senderName, setSenderName] = useState('Service Team');
  const [senderEmail, setSenderEmail] = useState('service@company.com');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setContent(template.content);
    }
  };

  const handleCustomerToggle = (customerId: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCustomers.size === customers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(customers.map(c => c.id)));
    }
  };

  const replacePlaceholders = (text: string, customer: Customer): string => {
    return text
      .replace(/\{\{firstName\}\}/g, customer.first_name)
      .replace(/\{\{lastName\}\}/g, customer.last_name)
      .replace(/\{\{email\}\}/g, customer.email)
      .replace(/\{\{#company\}\}(.*?)\{\{\/company\}\}/gs, customer.company ? '$1' : '')
      .replace(/\{\{company\}\}/g, customer.company || '');
  };

  const handleSendEmails = async () => {
    if (selectedCustomers.size === 0) {
      toast({
        title: 'No Recipients',
        description: 'Please select at least one customer to send emails to.',
        variant: 'destructive',
      });
      return;
    }

    if (!subject.trim() || !content.trim()) {
      toast({
        title: 'Missing Content',
        description: 'Please provide both subject and email content.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const selectedCustomerData = customers.filter(c => selectedCustomers.has(c.id));

      for (const customer of selectedCustomerData) {
        try {
          const personalizedSubject = replacePlaceholders(subject, customer);
          const personalizedContent = replacePlaceholders(content, customer);

          const { error } = await supabase.functions.invoke('send-customer-email', {
            body: {
              to: customer.email,
              subject: personalizedSubject,
              content: personalizedContent,
              senderName,
              senderEmail,
              customerName: `${customer.first_name} ${customer.last_name}`
            }
          });

          if (error) {
            console.error(`Error sending email to ${customer.email}:`, error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error(`Error sending email to ${customer.email}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Emails Sent',
          description: `Successfully sent ${successCount} email${successCount > 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}.`,
        });
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: 'Send Failed',
          description: 'Failed to send emails. Please check your configuration.',
          variant: 'destructive',
        });
      }

      if (successCount > 0) {
        onClose();
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      toast({
        title: 'Error',
        description: 'Failed to send emails. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="senderName">Sender Name</Label>
              <Input
                id="senderName"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Your Service Team"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderEmail">Sender Email</Label>
              <Input
                id="senderEmail"
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="service@yourcompany.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Email Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template or create custom" />
              </SelectTrigger>
              <SelectContent>
                {emailTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Email Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your email message..."
              rows={8}
            />
            <div className="text-sm text-muted-foreground">
              Available placeholders: {'{firstName}'}, {'{lastName}'}, {'{email}'}, {'{company}'}
              <br />
              Conditional content: {'{#company}'}Text for companies{'{/company}'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recipients ({selectedCustomers.size} selected)
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedCustomers.size === customers.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center space-x-3 p-2 border rounded hover:bg-muted/50"
              >
                <Checkbox
                  id={customer.id}
                  checked={selectedCustomers.has(customer.id)}
                  onCheckedChange={() => handleCustomerToggle(customer.id)}
                />
                <div className="flex-1">
                  <div className="font-medium">
                    {customer.first_name} {customer.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {customer.email}
                    {customer.company && (
                      <Badge variant="secondary" className="ml-2">
                        {customer.company}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          onClick={handleSendEmails}
          disabled={sending || selectedCustomers.size === 0}
        >
          <Send className="h-4 w-4 mr-2" />
          {sending ? 'Sending...' : `Send to ${selectedCustomers.size} customer${selectedCustomers.size !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
};