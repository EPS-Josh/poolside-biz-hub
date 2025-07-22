
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MetricsCard } from '@/components/MetricsCard';
import { QuickBooksIntegration } from '@/components/QuickBooksIntegration';
import { useUserRoles } from '@/hooks/useUserRoles';
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';

const BPA = () => {
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  // Mock data - in a real app, this would come from your API
  const metrics = [
    {
      title: 'Revenue',
      value: '$45,231',
      change: '+8% from last month',
      changeType: 'positive' as const,
      icon: DollarSign,
    },
    {
      title: 'Orders',
      value: '1,234',
      change: '-3% from last month',
      changeType: 'negative' as const,
      icon: ShoppingCart,
    },
    {
      title: 'Growth Rate',
      value: '23.5%',
      change: '+2.1% from last month',
      changeType: 'positive' as const,
      icon: TrendingUp,
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">BPA Overview</h1>
              <p className="text-muted-foreground">Monitor your business performance and key metrics</p>
            </div>
            
            {/* Company Key Metrics - Admin Only */}
            {isAdmin() && !rolesLoading && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Company Key Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {metrics.map((metric, index) => (
                    <MetricsCard
                      key={index}
                      title={metric.title}
                      value={metric.value}
                      change={metric.change}
                      changeType={metric.changeType}
                      icon={metric.icon}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* QuickBooks Integration */}
            <div className="mb-8">
              <QuickBooksIntegration />
            </div>

            {/* Placeholder for future content */}
            <div className="border-4 border-dashed border-border rounded-lg h-96 flex items-center justify-center bg-card">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Analytics & Reports
                </h2>
                <p className="text-muted-foreground">
                  Charts and detailed analytics will be added here.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default BPA;
