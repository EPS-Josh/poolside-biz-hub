import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  email?: string | null;
}

export const SmsOptInRequestSender = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Compliance-friendly opt-in message template
  const optInMessage = `Hi {firstName}, this is Finest Pools & Spas LLC. We'd like to send you pool service updates and reminders via text. Reply YES to opt in. Message and data rates may apply. Reply STOP to opt out anytime.`;

  useEffect(() => {
    fetchNonOptedInCustomers();
  }, []);

  const fetchNonOptedInCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name, phone, email')
        .or('sms_opt_in.is.null,sms_opt_in.eq.false')
        .not('phone', 'is', null)
        .order('last_name', { ascending: true });

      if (error) throw error;

      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const handleSendRequests = async () => {
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
        const personalizedMessage = replacePlaceholders(optInMessage, customer);
        
        const { error } = await supabase.functions.invoke('send-sms', {
          body: {
            to: customer.phone,
            message: personalizedMessage,
            customerId: customer.id,
          },
        });

        if (error) {
          console.error(`Failed to send opt-in request to ${customer.first_name}:`, error);
          failCount++;
        } else {
          successCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Error sending opt-in request to ${customer.first_name}:`, error);
        failCount++;
      }
    }

    setIsSending(false);

    if (successCount > 0) {
      toast({
        title: "Opt-In Requests Sent",
        description: `Successfully sent ${successCount} opt-in request${successCount !== 1 ? 's' : ''}${failCount > 0 ? `. ${failCount} failed.` : ''}`,
      });
      setSelectedCustomers([]);
      // Refresh the list
      fetchNonOptedInCustomers();
    } else {
      toast({
        title: "Error",
        description: "Failed to send opt-in requests. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Opt-In Requests</CardTitle>
        <CardDescription>
          Send SMS opt-in requests to customers who haven't opted in yet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Compliance Warning */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Only send opt-in requests to customers with whom you have an existing business relationship. 
            Ensure compliance with TCPA regulations before sending.
          </AlertDescription>
        </Alert>

        {/* Message Preview */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Opt-In Request Message</label>
          <Textarea
            value={optInMessage}
            readOnly
            rows={4}
            className="resize-none bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Placeholders like {"{firstName}"} will be replaced with customer-specific information
          </p>
        </div>

        {/* Customer Selection */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">
              Select Recipients ({selectedCustomers.length} selected)
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={loading || customers.length === 0}
            >
              {selectedCustomers.length === customers.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Loading customers...
              </p>
            ) : customers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No customers found. All customers with phone numbers have already opted in!
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
          onClick={handleSendRequests}
          disabled={isSending || selectedCustomers.length === 0}
          className="w-full"
        >
          <Send className="mr-2 h-4 w-4" />
          {isSending 
            ? 'Sending...' 
            : `Send Opt-In Request to ${selectedCustomers.length} Customer${selectedCustomers.length !== 1 ? 's' : ''}`
          }
        </Button>

        <p className="text-xs text-muted-foreground">
          After customers reply YES, you'll need to manually update their opt-in status in their customer profile.
        </p>
      </CardContent>
    </Card>
  );
};
