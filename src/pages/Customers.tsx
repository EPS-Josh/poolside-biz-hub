
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CustomerList } from '@/components/CustomerList';

const Customers = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Customer Management</h1>
              <p className="text-muted-foreground">Manage your customers and view customer information</p>
            </div>
            
            <CustomerList />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Customers;
