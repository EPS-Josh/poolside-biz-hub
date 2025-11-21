import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  email?: string | null;
}

interface SmsMessageComposerProps {
  customers: Customer[];
}

const messageTemplates = [
  {
    id: 'service_reminder',
    name: 'Service Reminder',
    content: 'Hi {firstName}, this is a reminder that your pool service is scheduled for tomorrow. We look forward to seeing you!'
  },
  {
    id: 'promotional',
    name: 'Promotional Offer',
    content: 'Hi {firstName}! Special offer: Get 20% off your next pool maintenance service. Book now to claim this limited-time deal!'
  },
  {
    id: 'weather_alert',
    name: 'Weather Alert',
    content: 'Hi {firstName}, a weather alert has been issued for your area. We recommend securing pool equipment and checking chemical levels after the storm passes.'
  },
  {
    id: 'appointment_confirmation',
    name: 'Appointment Confirmation',
    content: 'Hi {firstName}, your appointment is confirmed for {date} at {time}. Reply CONFIRM to verify or call us to reschedule.'
  },
  {
    id: 'custom',
    name: 'Custom Message',
    content: ''
  }
];

export const SmsMessageComposer = ({ customers }: SmsMessageComposerProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [message, setMessage] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = messageTemplates.find(t => t.id === templateId);
    if (template) {
      setMessage(template.content);
    }
  };

  const handleCustomerToggle = (customerId: string) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c.id));
    }
  };

  const replacePlaceholders = (text: string, customer: Customer): string => {
    return text
      .replace(/{firstName}/g, customer.first_name)
      .replace(/{lastName}/g, customer.last_name)
      .replace(/{fullName}/g, `${customer.first_name} ${customer.last_name}`);
  };

  const handleSendMessages = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    if (selectedCustomers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one customer",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    let successCount = 0;
    let failCount = 0;

    for (const customerId of selectedCustomers) {
      const customer = customers.find(c => c.id === customerId);
      if (!customer || !customer.phone) {
        failCount++;
        continue;
      }

      try {
        const personalizedMessage = replacePlaceholders(message, customer);
        
        const { error } = await supabase.functions.invoke('send-sms', {
          body: {
            to: customer.phone,
            message: personalizedMessage,
            customerId: customer.id,
          },
        });

        if (error) {
          console.error(`Failed to send SMS to ${customer.first_name}:`, error);
          failCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`Error sending SMS to ${customer.first_name}:`, error);
        failCount++;
      }
    }

    setIsSending(false);

    if (successCount > 0) {
      toast({
        title: "Messages Sent",
        description: `Successfully sent ${successCount} message${successCount !== 1 ? 's' : ''}${failCount > 0 ? `. ${failCount} failed.` : ''}`,
      });
      setMessage('');
      setSelectedCustomers([]);
      setSelectedTemplate('');
    } else {
      toast({
        title: "Error",
        description: "Failed to send messages. Please try again.",
        variant: "destructive",
      });
    }
  };

  const characterCount = message.length;
  const smsCount = Math.ceil(characterCount / 160);

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS Message Composer</CardTitle>
        <CardDescription>
          Send SMS messages to opted-in customers. Use templates or create custom messages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Selection */}
        <div className="space-y-2">
          <Label htmlFor="template">Message Template</Label>
          <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
            <SelectTrigger id="template">
              <SelectValue placeholder="Select a template..." />
            </SelectTrigger>
            <SelectContent>
              {messageTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Message Content */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="message">Message</Label>
            <span className="text-sm text-muted-foreground">
              {characterCount} chars · {smsCount} SMS
            </span>
          </div>
          <Textarea
            id="message"
            placeholder="Enter your message here... Use {firstName}, {lastName}, or {fullName} as placeholders."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Tip: Placeholders like {"{firstName}"} will be replaced with customer-specific information
          </p>
        </div>

        {/* Customer Selection */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Select Recipients ({selectedCustomers.length} selected)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedCustomers.length === customers.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-3">
            {customers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No customers have opted in to SMS yet
              </p>
            ) : (
              customers.map((customer) => (
                <div key={customer.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`customer-${customer.id}`}
                    checked={selectedCustomers.includes(customer.id)}
                    onCheckedChange={() => handleCustomerToggle(customer.id)}
                  />
                  <label
                    htmlFor={`customer-${customer.id}`}
                    className="flex-1 text-sm cursor-pointer"
                  >
                    <span className="font-medium">
                      {customer.first_name} {customer.last_name}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {customer.phone}
                    </span>
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSendMessages}
          disabled={isSending || selectedCustomers.length === 0 || !message.trim()}
          className="w-full"
        >
          <Send className="mr-2 h-4 w-4" />
          {isSending ? 'Sending...' : `Send to ${selectedCustomers.length} Customer${selectedCustomers.length !== 1 ? 's' : ''}`}
        </Button>
      </CardContent>
    </Card>
  );
};
