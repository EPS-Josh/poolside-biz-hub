import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { UserPlus, Mail, Trash2, Shield } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CustomerAccountManagerProps {
  customerId: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerUserId: string | null;
  companyName: string;
  onAccountLinked: () => void;
}

export const CustomerAccountManager = ({
  customerId,
  customerEmail,
  customerFirstName,
  customerLastName,
  customerUserId,
  companyName,
  onAccountLinked,
}: CustomerAccountManagerProps) => {
  const [sending, setSending] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    if (!session) {
      console.error('No active session found for sending invitation');
    }
  }, [session]);

  const handleSendInvitation = async () => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to send invitations",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      // Ensure we have a fresh session token
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !currentSession) {
        throw new Error('Please log in again to continue');
      }

      const { data, error } = await supabase.functions.invoke('send-customer-invitation', {
        body: {
          customerId,
          email: customerEmail,
          firstName: customerFirstName,
          lastName: customerLastName,
          companyName,
          appUrl: window.location.origin,
        },
      });

      if (error) throw error;

      toast({
        title: "Invitation Sent",
        description: `Portal invitation sent to ${customerEmail}`,
      });

      onAccountLinked();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Failed to Send Invitation",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleResendInvitation = async () => {
    setSending(true);
    try {
      // Generate a password reset link
      const { error } = await supabase.auth.resetPasswordForEmail(customerEmail, {
        redirectTo: `${window.location.origin}/customer-login`,
      });

      if (error) throw error;

      toast({
        title: "Password Reset Sent",
        description: `Password reset email sent to ${customerEmail}`,
      });
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast({
        title: "Failed to Send Reset",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleRemoveAccess = async () => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ customer_user_id: null })
        .eq('id', customerId);

      if (error) throw error;

      toast({
        title: "Access Removed",
        description: "Customer portal access has been removed",
      });

      setShowDeleteDialog(false);
      onAccountLinked();
    } catch (error: any) {
      console.error('Error removing access:', error);
      toast({
        title: "Failed to Remove Access",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!customerUserId) {
    return (
      <div className="flex items-center gap-2 p-4 border border-border rounded-lg bg-muted/50">
        <Shield className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">No Portal Access</p>
          <p className="text-xs text-muted-foreground">
            Customer does not have portal access
          </p>
        </div>
        <Button
          onClick={handleSendInvitation}
          disabled={sending || !customerEmail}
          size="sm"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          {sending ? "Sending..." : "Send Invitation"}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 p-4 border border-border rounded-lg bg-card">
        <Shield className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">Portal Access Active</p>
          <p className="text-xs text-muted-foreground">
            Customer has access to the client portal
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleResendInvitation}
            disabled={sending}
            variant="outline"
            size="sm"
          >
            <Mail className="h-4 w-4 mr-2" />
            Reset Password
          </Button>
          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove Access
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Portal Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {customerFirstName} {customerLastName}'s access to the client portal.
              They will no longer be able to log in or view their information.
              This action can be reversed by sending a new invitation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveAccess}>
              Remove Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
