
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Calendar, RefreshCw, Trash2, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export const CalendarIntegrations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['calendar-integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_integrations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const connectMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await supabase.functions.invoke('calendar-auth', {
        body: { provider }
      });
      
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      window.open(data.authUrl, '_blank', 'width=600,height=700');
      setIsDialogOpen(false);
      toast.success('Opening authentication window...');
    },
    onError: (error) => {
      console.error('Connection error:', error);
      toast.error('Failed to start authentication');
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('calendar-sync');
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-integrations'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      const successCount = data.syncResults.filter((r: any) => r.status === 'success').length;
      const errorCount = data.syncResults.filter((r: any) => r.status === 'error').length;
      
      if (errorCount === 0) {
        toast.success(`Successfully synced ${successCount} calendar(s)`);
      } else {
        toast.error(`Sync completed with ${errorCount} error(s)`);
      }
    },
    onError: (error) => {
      console.error('Sync error:', error);
      toast.error('Failed to sync calendars');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase
        .from('calendar_integrations')
        .delete()
        .eq('id', integrationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-integrations'] });
      toast.success('Integration removed');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to remove integration');
    }
  });

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return '🗓️';
      case 'microsoft':
        return '📅';
      default:
        return '📅';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Google Calendar';
      case 'microsoft':
        return 'Outlook/Office 365';
      default:
        return provider;
    }
  };

  const isTokenExpired = (integration: any) => {
    if (!integration.token_expires_at) return false;
    return new Date(integration.token_expires_at) < new Date();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div>Loading integrations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Calendar Integrations</span>
        </CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || integrations.length === 0}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sync All
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Calendar</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Connect your calendar to automatically sync appointments.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => connectMutation.mutate('google')}
                    disabled={connectMutation.isPending}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🗓️</span>
                      <div className="text-left">
                        <div className="font-medium">Google Calendar</div>
                        <div className="text-sm text-gray-500">Connect your Google Calendar</div>
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => connectMutation.mutate('microsoft')}
                    disabled={connectMutation.isPending}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📅</span>
                      <div className="text-left">
                        <div className="font-medium">Outlook / Office 365</div>
                        <div className="text-sm text-gray-500">Connect your Microsoft calendar</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {integrations.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No calendar integrations configured</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add Your First Integration</Button>
              </DialogTrigger>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-3">
            {integrations.map((integration) => {
              const expired = isTokenExpired(integration);
              return (
                <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getProviderIcon(integration.provider)}</span>
                    <div>
                      <div className="font-medium flex items-center space-x-2">
                        <span>{getProviderName(integration.provider)}</span>
                        {integration.is_active && !expired ? (
                          <Badge className="bg-green-100 text-green-800 flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Active</span>
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="flex items-center space-x-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>{expired ? 'Expired' : 'Inactive'}</span>
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {integration.last_sync_at ? (
                          `Last synced: ${format(new Date(integration.last_sync_at), 'MMM d, h:mm a')}`
                        ) : (
                          'Never synced'
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {expired && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => connectMutation.mutate(integration.provider)}
                        disabled={connectMutation.isPending}
                      >
                        Reconnect
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(integration.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
