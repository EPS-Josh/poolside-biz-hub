import { useNavigate } from 'react-router-dom';
import { useCustomerData } from '@/hooks/useCustomerData';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, FileText, Image, User, MessageSquare, LogOut, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const ClientPortal = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { customer, loading } = useCustomerData();

  useEffect(() => {
    // Only redirect to auth if we're certain the user is not authenticated
    // Wait for BOTH auth and customer data to finish loading
    if (!user && !authLoading && !loading) {
      console.log('ClientPortal: No user found, redirecting to customer-login');
      navigate('/customer-login');
    }
  }, [user, authLoading, loading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Account Not Linked</CardTitle>
            <CardDescription>
              Your account is not yet linked to a customer profile. Please contact our team to complete your account setup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => signOut()} variant="outline" className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const menuItems = [
    {
      title: 'My Appointments',
      description: 'View and manage your scheduled service appointments',
      icon: Calendar,
      path: '/client-portal/appointments',
    },
    {
      title: 'Service History',
      description: 'View your complete service records and reports',
      icon: FileText,
      path: '/client-portal/service-history',
    },
    {
      title: 'Photos & Documents',
      description: 'Access photos and documents from your services',
      icon: Image,
      path: '/client-portal/photos',
    },
    {
      title: 'My Profile',
      description: 'Update your contact information and preferences',
      icon: User,
      path: '/client-portal/profile',
    },
    {
      title: 'Request Service',
      description: 'Submit a new service request',
      icon: MessageSquare,
      path: '/client-portal/request-service',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Client Portal</h1>
            <p className="text-muted-foreground">
              Welcome back, {customer.first_name}!
            </p>
          </div>
          <Button onClick={() => signOut()} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Card 
              key={item.path}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(item.path)}
            >
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Service Location</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {customer.address}<br />
              {customer.city}, {customer.state} {customer.zip_code}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ClientPortal;
