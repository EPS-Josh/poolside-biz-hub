import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CustomerList } from '@/components/CustomerList';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, Calendar, Package, FileText, MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Customers = () => {
  const navigate = useNavigate();
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center space-x-1 text-muted-foreground hover:text-foreground"
              >
                <Home className="h-4 w-4" />
                <span>Menu</span>
              </Button>
              <span>/</span>
              <span className="text-foreground font-medium">Customers</span>
            </div>
            
            {/* Header with Navigation */}
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/menu')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Menu</span>
                </Button>
              </div>
              
              {/* Quick Navigation */}
              <div className="flex flex-wrap gap-3 mb-6">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/customers/map')}
                  className="flex items-center space-x-2"
                >
                  <MapPin className="h-4 w-4" />
                  <span>Customer Map</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/customers/property-verification')}
                  className="flex items-center space-x-2"
                >
                  <Search className="h-4 w-4" />
                  <span>Property Verification</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/calendar')}
                  className="flex items-center space-x-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Schedule Service</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/inventory')}
                  className="flex items-center space-x-2"
                >
                  <Package className="h-4 w-4" />
                  <span>Inventory</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/tsbs')}
                  className="flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>TSBs</span>
                </Button>
              </div>
            </div>
            
            <CustomerList />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Customers;