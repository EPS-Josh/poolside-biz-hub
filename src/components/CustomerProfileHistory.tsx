import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Mail, Phone, Building } from 'lucide-react';
import { format } from 'date-fns';

interface ProfileHistoryEntry {
  id: string;
  changed_at: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
}

interface CustomerProfileHistoryProps {
  customerId: string;
}

const getFieldIcon = (field: string) => {
  switch (field) {
    case 'email':
      return <Mail className="h-4 w-4" />;
    case 'phone':
      return <Phone className="h-4 w-4" />;
    case 'company':
      return <Building className="h-4 w-4" />;
    default:
      return <History className="h-4 w-4" />;
  }
};

const getFieldLabel = (field: string) => {
  switch (field) {
    case 'email':
      return 'Email';
    case 'phone':
      return 'Phone';
    case 'company':
      return 'Company';
    default:
      return field;
  }
};

export const CustomerProfileHistory = ({ customerId }: CustomerProfileHistoryProps) => {
  const [history, setHistory] = useState<ProfileHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [customerId]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_profile_history')
        .select('*')
        .eq('customer_id', customerId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching profile history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Profile Change History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading history...</p>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Profile Change History
          </CardTitle>
          <CardDescription>
            Track changes made by the customer to their profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No profile changes recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Profile Change History
        </CardTitle>
        <CardDescription>
          Changes made by the customer through the customer portal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="border-l-2 border-primary/20 pl-4 pb-4 last:pb-0"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {getFieldIcon(entry.field_changed)}
                      {getFieldLabel(entry.field_changed)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(entry.changed_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {entry.old_value && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">From: </span>
                        <span className="line-through text-muted-foreground">
                          {entry.old_value}
                        </span>
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-muted-foreground">To: </span>
                      <span className="font-medium">
                        {entry.new_value || '(removed)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
