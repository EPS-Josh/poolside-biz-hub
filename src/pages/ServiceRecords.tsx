import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ServiceRecordsList } from '@/components/ServiceRecordsList';

const ServiceRecords = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Service Records</h1>
              <p className="text-muted-foreground">
                View and manage all service records with options to view, print, email, edit, and delete
              </p>
            </div>
            
            <ServiceRecordsList />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default ServiceRecords;