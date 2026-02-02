import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, User, FileText, CalendarPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { formatDateForDatabase, getCurrentMSTDate } from '@/utils/dateUtils';

interface UnscheduledJob {
  id: string;
  service_type: string;
  notes: string | null;
  created_at: string;
  customers: {
    id: string;
    first_name: string;
    last_name: string;
    address: string | null;
    city: string | null;
  } | null;
}

export const UnscheduledJobsBacklog: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [schedulingJob, setSchedulingJob] = useState<UnscheduledJob | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const { data: unscheduledJobs = [], isLoading } = useQuery({
    queryKey: ['unscheduled-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          service_type,
          notes,
          created_at,
          customers (
            id,
            first_name,
            last_name,
            address,
            city
          )
        `)
        .eq('status', 'unscheduled')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UnscheduledJob[];
    },
    enabled: !!user
  });

  const scheduleJobMutation = useMutation({
    mutationFn: async ({ jobId, date, time }: { jobId: string; date: string; time: string }) => {
      const { error } = await supabase
        .from('appointments')
        .update({
          appointment_date: date,
          appointment_time: time,
          status: 'scheduled'
        })
        .eq('id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unscheduled-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Job scheduled successfully!');
      setSchedulingJob(null);
      setScheduleDate('');
      setScheduleTime('');
    },
    onError: (error) => {
      console.error('Error scheduling job:', error);
      toast.error('Failed to schedule job');
    }
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unscheduled-jobs'] });
      toast.success('Job removed from backlog');
    },
    onError: (error) => {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
  });

  const handleSchedule = () => {
    if (!schedulingJob || !scheduleDate || !scheduleTime) {
      toast.error('Please select a date and time');
      return;
    }
    scheduleJobMutation.mutate({
      jobId: schedulingJob.id,
      date: scheduleDate,
      time: scheduleTime
    });
  };

  if (isLoading) {
    return <div className="text-center py-2 text-sm text-muted-foreground">Loading...</div>;
  }

  if (unscheduledJobs.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No unscheduled jobs
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {unscheduledJobs.map((job) => (
          <Card key={job.id} className="border-l-4 border-l-orange-400 bg-orange-50/50">
            <CardContent className="p-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <FileText className="h-3 w-3 text-orange-600" />
                    <span>{job.service_type}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSchedulingJob(job)}
                      className="h-7 w-7 p-0 text-primary hover:text-primary/80"
                      title="Schedule this job"
                    >
                      <CalendarPlus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteJobMutation.mutate(job.id)}
                      disabled={deleteJobMutation.isPending}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive/80"
                      title="Remove from backlog"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {job.customers && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <Link 
                      to={`/customer/${job.customers.id}`}
                      className="hover:underline text-primary"
                    >
                      {job.customers.first_name} {job.customers.last_name}
                    </Link>
                  </div>
                )}

                {job.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {job.notes}
                  </p>
                )}

                <div className="text-xs text-muted-foreground">
                  Added {format(new Date(job.created_at), 'MMM d')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schedule Dialog */}
      <Dialog open={!!schedulingJob} onOpenChange={(open) => !open && setSchedulingJob(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {schedulingJob && (
              <div className="bg-muted p-3 rounded-md">
                <p className="font-medium">{schedulingJob.service_type}</p>
                {schedulingJob.customers && (
                  <p className="text-sm text-muted-foreground">
                    {schedulingJob.customers.first_name} {schedulingJob.customers.last_name}
                  </p>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-date">Date</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-time">Time</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSchedulingJob(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSchedule}
                disabled={scheduleJobMutation.isPending || !scheduleDate || !scheduleTime}
              >
                {scheduleJobMutation.isPending ? 'Scheduling...' : 'Schedule'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
