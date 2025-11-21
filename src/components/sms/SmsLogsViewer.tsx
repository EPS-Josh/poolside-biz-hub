import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { MessageSquare, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

interface SmsLog {
  id: string;
  user_id: string;
  customer_id: string | null;
  phone_number: string;
  message_content: string;
  message_sid: string | null;
  status: string;
  error_message: string | null;
  sent_at: string;
  delivered_at: string | null;
}

export const SmsLogsViewer = () => {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('sms_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching SMS logs:', error);
      toast({
        title: "Error",
        description: "Failed to load SMS logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, icon: Clock, label: "Pending" },
      queued: { variant: "secondary" as const, icon: Clock, label: "Queued" },
      sent: { variant: "default" as const, icon: MessageSquare, label: "Sent" },
      delivered: { variant: "default" as const, icon: CheckCircle2, label: "Delivered" },
      failed: { variant: "destructive" as const, icon: XCircle, label: "Failed" },
      undelivered: { variant: "destructive" as const, icon: AlertCircle, label: "Undelivered" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "secondary" as const,
      icon: MessageSquare,
      label: status,
    };

    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          SMS Delivery Logs
        </CardTitle>
        <CardDescription>
          View the history and delivery status of sent SMS messages
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading SMS logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No SMS messages have been sent yet
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Message SID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.sent_at), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.phone_number}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate" title={log.message_content}>
                        {log.message_content}
                      </div>
                      {log.error_message && (
                        <div className="text-xs text-destructive mt-1">
                          Error: {log.error_message}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(log.status)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.message_sid || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
