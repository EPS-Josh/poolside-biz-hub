import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, Clock, Play, CheckCircle2, XCircle } from 'lucide-react';

interface QuickStatusChangeProps {
  appointmentId: string;
  currentStatus: string;
  children: React.ReactNode;
}

const statusOptions = [
  { value: 'scheduled', label: 'Scheduled', icon: Clock, color: 'text-blue-600' },
  { value: 'confirmed', label: 'Confirmed', icon: Check, color: 'text-green-600' },
  { value: 'in-progress', label: 'In Progress', icon: Play, color: 'text-orange-600' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-600' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-red-600' },
];

export const QuickStatusChange: React.FC<QuickStatusChangeProps> = ({
  appointmentId,
  currentStatus,
  children,
}) => {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', appointmentId);

      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(`Status updated to ${newStatus}`);
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    },
  });

  const handleStatusChange = (newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (newStatus !== currentStatus) {
      updateStatusMutation.mutate(newStatus);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {statusOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = option.value === currentStatus;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={(e) => handleStatusChange(option.value, e)}
              className={`flex items-center gap-2 cursor-pointer ${isSelected ? 'bg-accent' : ''}`}
            >
              <Icon className={`h-4 w-4 ${option.color}`} />
              <span>{option.label}</span>
              {isSelected && <Check className="h-3 w-3 ml-auto" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'in-progress':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};
