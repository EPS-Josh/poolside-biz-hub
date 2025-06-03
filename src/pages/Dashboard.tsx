
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MetricsCard } from '@/components/MetricsCard';
import { CustomerList } from '@/components/CustomerList';
import { Users, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  // Mock data - in a real app, this would come from your API
  const metrics = [
    {
      title: 'Total Customers',
      value: '2,543',
      change: '+12% from last month',
      changeType: 'positive' as const,
      icon: Users,
    },
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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
              <p className="text-gray-600">Monitor your business performance and key metrics</p>
            </div>
            
            {/* Metrics Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

            {/* Customer List */}
            <div className="mb-8">
              <CustomerList />
            </div>

            {/* Placeholder for future content */}
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Analytics & Reports
                </h2>
                <p className="text-gray-600">
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

export default Dashboard;
