import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Users, Shield, Key, UserPlus, Mail, Calendar, RefreshCw, UserCheck } from 'lucide-react';
import { Header } from '@/components/Header';
import { TechnicianCustomerAssignments } from '@/components/TechnicianCustomerAssignments';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string | null;
  roles: string[];
}

type AppRole = 'admin' | 'manager' | 'technician' | 'customer' | 'guest';

const roleColors = {
  admin: 'bg-red-100 text-red-800 border-red-200',
  manager: 'bg-blue-100 text-blue-800 border-blue-200',
  technician: 'bg-green-100 text-green-800 border-green-200',
  customer: 'bg-purple-100 text-purple-800 border-purple-200',
  guest: 'bg-gray-100 text-gray-800 border-gray-200',
};

const roleDescriptions = {
  admin: 'Full system access and user management',
  manager: 'Access to analytics and team management',
  technician: 'Field service and customer management',
  customer: 'Limited access to their own data',
  guest: 'View-only access (except Employees & Company Data)',
};

export const Employees = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState<AppRole>('technician');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .rpc('is_admin');
    
    if (error) {
      console.error('Error checking admin status:', error);
      return;
    }
    
    setIsAdmin(data || false);
  };

  const fetchUsers = async () => {
    if (!user) return;
    
    try {
      // First, get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Then get user roles for each profile
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id);

          if (rolesError) {
            console.error('Error fetching roles for user:', profile.id, rolesError);
            return {
              ...profile,
              roles: []
            };
          }

          return {
            ...profile,
            last_sign_in_at: null, // This would come from auth.users in a real implementation
            roles: roles?.map(r => r.role) || []
          };
        })
      );

      // Filter out customer-only accounts - only show business employees
      const businessRoles = ['admin', 'manager', 'technician', 'guest'];
      const employeeUsers = usersWithRoles.filter(u => 
        u.roles.some(role => businessRoles.includes(role))
      );

      setUsers(employeeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetUserPassword = async (userId: string, userEmail: string) => {
    try {
      // In a real application, you'd need a server-side function to reset passwords
      // For now, we'll show a message about the limitation
      toast({
        title: "Password Reset",
        description: `Password reset email would be sent to ${userEmail}. This requires server-side implementation.`,
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive"
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: AppRole, action: 'add' | 'remove') => {
    try {
      // Security check: Validate role assignment authorization
      const { data: canAssign, error: validationError } = await supabase
        .rpc('validate_role_assignment', {
          target_user_id: userId,
          role_to_assign: newRole
        });

      if (validationError) {
        console.error('Role validation error:', validationError);
        toast({
          title: "Error",
          description: "Failed to validate role assignment",
          variant: "destructive"
        });
        return;
      }

      if (!canAssign) {
        toast({
          title: "Unauthorized",
          description: `You don't have permission to ${action} the ${newRole} role`,
          variant: "destructive"
        });
        return;
      }

      // Prevent self-modification of admin role
      if (user?.id === userId && newRole === 'admin' && action === 'remove') {
        toast({
          title: "Error", 
          description: "You cannot remove your own admin role",
          variant: "destructive"
        });
        return;
      }

      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', newRole);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Role ${action === 'add' ? 'added' : 'removed'} successfully`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const createNewUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserFullName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    // Validate password strength
    if (newUserPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    try {
      // Security check: Validate role assignment authorization
      const { data: canAssign, error: validationError } = await supabase
        .rpc('validate_role_assignment', {
          target_user_id: '00000000-0000-0000-0000-000000000000', // Placeholder for new user
          role_to_assign: newUserRole
        });

      if (validationError) {
        console.error('Role validation error:', validationError);
        toast({
          title: "Error",
          description: "Failed to validate role assignment",
          variant: "destructive"
        });
        return;
      }

      if (!canAssign) {
        toast({
          title: "Unauthorized",
          description: `You don't have permission to create users with the ${newUserRole} role`,
          variant: "destructive"
        });
        return;
      }

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: newUserFullName
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Add role to the new user
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: authData.user.id, role: newUserRole });

        if (roleError) throw roleError;

        toast({
          title: "Success",
          description: "User created successfully",
        });

        setIsCreateDialogOpen(false);
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserFullName('');
        setNewUserRole('technician');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                <p className="text-muted-foreground">You need administrator privileges to access this page.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Employee Management</h1>
            <p className="text-muted-foreground">Manage user accounts, permissions, and customer assignments</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={fetchUsers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Employee</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={newUserFullName}
                    onChange={(e) => setNewUserFullName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Temporary Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Enter temporary password"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Initial Role</Label>
                  <Select value={newUserRole} onValueChange={(value: AppRole) => setNewUserRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="technician">Technician</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createNewUser} className="w-full">
                  Create Employee
                </Button>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList>
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employees
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Customer Assignments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
                  <p>Loading employees...</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                {users.map((userProfile) => (
                  <Card key={userProfile.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <Users className="h-5 w-5" />
                            <span>{userProfile.full_name || 'No Name'}</span>
                          </CardTitle>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                            <div className="flex items-center space-x-1">
                              <Mail className="h-4 w-4" />
                              <span>{userProfile.email}</span>
                            </div>
                            {userProfile.last_sign_in_at && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>Last login: {new Date(userProfile.last_sign_in_at).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Key className="h-4 w-4 mr-2" />
                              Reset Password
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reset Password</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will send a password reset email to {userProfile.email}. Are you sure you want to continue?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => resetUserPassword(userProfile.id, userProfile.email)}>
                                Send Reset Email
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Current Roles</h4>
                          <div className="flex flex-wrap gap-2">
                            {userProfile.roles.length > 0 ? (
                              userProfile.roles.map((role) => (
                                <Badge
                                  key={role}
                                  variant="outline"
                                  className={roleColors[role as AppRole]}
                                >
                                  {role}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-2 h-4 w-4 p-0"
                                    onClick={() => updateUserRole(userProfile.id, role as AppRole, 'remove')}
                                  >
                                    ×
                                  </Button>
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">No roles assigned</span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Add Role</h4>
                          <div className="flex space-x-2">
                            <Select onValueChange={(role: AppRole) => updateUserRole(userProfile.id, role, 'add')}>
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Select role to add" />
                              </SelectTrigger>
                              <SelectContent>
                                {(['admin', 'manager', 'technician', 'customer', 'guest'] as AppRole[])
                                  .filter(role => !userProfile.roles.includes(role))
                                  .map((role) => (
                                    <SelectItem key={role} value={role}>
                                      <div>
                                        <div className="font-medium capitalize">{role}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {roleDescriptions[role]}
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assignments">
            <TechnicianCustomerAssignments />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};