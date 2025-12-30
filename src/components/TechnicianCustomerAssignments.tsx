import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Users, Search, Plus, Trash2, UserCheck, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Technician {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  address: string | null;
  city: string | null;
}

interface Assignment {
  id: string;
  technician_user_id: string;
  customer_id: string;
  assigned_at: string;
  customer?: Customer;
}

export const TechnicianCustomerAssignments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTechnicians(),
      fetchCustomers(),
      fetchAssignments()
    ]);
    setLoading(false);
  };

  const fetchTechnicians = async () => {
    try {
      // Get users with technician role
      const { data: techRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'technician');

      if (rolesError) throw rolesError;

      if (techRoles && techRoles.length > 0) {
        const techUserIds = techRoles.map(r => r.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', techUserIds);

        if (profilesError) throw profilesError;
        setTechnicians(profiles || []);
      } else {
        setTechnicians([]);
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      // Fetch all customers - no limit to ensure we can assign everyone
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name, address, city')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('technician_customer_assignments')
        .select('*')
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      
      // Fetch customer details for assignments
      if (data && data.length > 0) {
        const customerIds = data.map(a => a.customer_id);
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id, first_name, last_name, address, city')
          .in('id', customerIds);

        if (customerError) throw customerError;

        const assignmentsWithCustomers = data.map(assignment => ({
          ...assignment,
          customer: customerData?.find(c => c.id === assignment.customer_id)
        }));
        
        setAssignments(assignmentsWithCustomers);
      } else {
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleAssignCustomer = async () => {
    if (!selectedTechnician || !selectedCustomer) {
      toast({
        title: "Error",
        description: "Please select both a technician and a customer",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('technician_customer_assignments')
        .insert({
          technician_user_id: selectedTechnician,
          customer_id: selectedCustomer,
          assigned_by: user?.id
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Assigned",
            description: "This customer is already assigned to this technician",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Success",
        description: "Customer assigned to technician successfully"
      });

      setSelectedCustomer('');
      fetchAssignments();
    } catch (error) {
      console.error('Error assigning customer:', error);
      toast({
        title: "Error",
        description: "Failed to assign customer",
        variant: "destructive"
      });
    }
  };

  const handleAssignAllCustomers = async () => {
    if (!selectedTechnician) {
      toast({
        title: "Error",
        description: "Please select a technician first",
        variant: "destructive"
      });
      return;
    }

    const unassignedCustomers = getUnassignedCustomers();
    if (unassignedCustomers.length === 0) {
      toast({
        title: "No Customers",
        description: "All customers are already assigned",
        variant: "destructive"
      });
      return;
    }

    try {
      const assignmentsToInsert = unassignedCustomers.map(customer => ({
        technician_user_id: selectedTechnician,
        customer_id: customer.id,
        assigned_by: user?.id
      }));

      const { error } = await supabase
        .from('technician_customer_assignments')
        .insert(assignmentsToInsert);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${unassignedCustomers.length} customers assigned successfully`
      });

      fetchAssignments();
    } catch (error) {
      console.error('Error assigning all customers:', error);
      toast({
        title: "Error",
        description: "Failed to assign customers",
        variant: "destructive"
      });
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('technician_customer_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment removed successfully"
      });

      fetchAssignments();
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: "Error",
        description: "Failed to remove assignment",
        variant: "destructive"
      });
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = customerSearch.toLowerCase();
    const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
    const address = (customer.address || '').toLowerCase();
    return fullName.includes(searchLower) || address.includes(searchLower);
  });

  const getAssignmentsForTechnician = (techId: string) => {
    return assignments.filter(a => a.technician_user_id === techId);
  };

  const getUnassignedCustomers = () => {
    const assignedCustomerIds = assignments.map(a => a.customer_id);
    return filteredCustomers.filter(c => !assignedCustomerIds.includes(c.id));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p>Loading assignments...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Assign Customers to Technicians
          </CardTitle>
          <CardDescription>
            Control which customers each technician can access. Technicians can only view and manage their assigned customers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Technician</label>
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a technician" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.full_name || tech.email || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Select Customer</label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a customer" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search customers..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  <ScrollArea className="h-[200px]">
                    {getUnassignedCustomers().slice(0, 50).map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.first_name} {customer.last_name}
                        {customer.address && ` - ${customer.address}`}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleAssignCustomer} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Assign Customer
              </Button>
              <Button 
                onClick={handleAssignAllCustomers} 
                variant="secondary"
                disabled={!selectedTechnician}
                className="flex-1"
              >
                <Users className="h-4 w-4 mr-2" />
                Assign All ({getUnassignedCustomers().length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {technicians.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Technicians Found</h3>
              <p className="text-muted-foreground">
                Add users with the technician role to start assigning customers.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {technicians.map(tech => {
            const techAssignments = getAssignmentsForTechnician(tech.id);
            return (
              <Card key={tech.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {tech.full_name || tech.email || 'Unknown Technician'}
                      </CardTitle>
                      {tech.email && (
                        <p className="text-sm text-muted-foreground">{tech.email}</p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      {techAssignments.length} customer{techAssignments.length !== 1 ? 's' : ''} assigned
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {techAssignments.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No customers assigned yet. This technician cannot view any customer data.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {techAssignments.map(assignment => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {assignment.customer?.first_name} {assignment.customer?.last_name}
                            </p>
                            {assignment.customer?.address && (
                              <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {assignment.customer.address}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAssignment(assignment.id)}
                            className="ml-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Customer Summary
          </CardTitle>
          <CardDescription>
            Overview of customer assignments. Unassigned customers can only be accessed by admins and managers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Assigned</p>
              <p className="text-2xl font-bold text-primary">
                {customers.length - getUnassignedCustomers().length}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Unassigned</p>
              <p className="text-2xl font-bold text-muted-foreground">
                {getUnassignedCustomers().length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
