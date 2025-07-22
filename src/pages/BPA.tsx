
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MetricsCard } from '@/components/MetricsCard';
import { QuickBooksIntegration } from '@/components/QuickBooksIntegration';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { subMonths, startOfMonth } from 'date-fns';

const BPA = () => {
  const { isAdmin, loading: rolesLoading } = useUserRoles();

  // Fetch P&L data
  const { data: profitLossData } = useQuery({
    queryKey: ['profit-loss-metrics'],
    queryFn: async () => {
      // Get current month and last month data
      const currentMonth = startOfMonth(new Date());
      const lastMonth = startOfMonth(subMonths(new Date(), 1));
      const twoMonthsAgo = startOfMonth(subMonths(new Date(), 2));

      // Current month services
      const { data: currentServices } = await supabase
        .from('service_records')
        .select('*, parts_used')
        .gte('service_date', currentMonth.toISOString().split('T')[0]);

      // Last month services
      const { data: lastMonthServices } = await supabase
        .from('service_records')
        .select('*, parts_used')
        .gte('service_date', lastMonth.toISOString().split('T')[0])
        .lt('service_date', currentMonth.toISOString().split('T')[0]);

      // Calculate revenue (assuming $125 average service price)
      const avgServicePrice = 125;
      const currentRevenue = (currentServices?.length || 0) * avgServicePrice;
      const lastMonthRevenue = (lastMonthServices?.length || 0) * avgServicePrice;
      
      // Calculate parts costs
      const calculatePartsCost = (services: any[]) => {
        return services?.reduce((total, service) => {
          if (service.parts_used) {
            const partsArray = Array.isArray(service.parts_used) ? service.parts_used : [];
            return total + partsArray.reduce((partTotal: number, part: any) => {
              const quantity = part.quantity || 0;
              const unitPrice = part.unitPrice || 15; // Default part cost
              return partTotal + (quantity * unitPrice);
            }, 0);
          }
          return total;
        }, 0) || 0;
      };

      const currentPartsCost = calculatePartsCost(currentServices || []);
      const lastMonthPartsCost = calculatePartsCost(lastMonthServices || []);

      // Calculate labor costs (assuming $50/hour, 2 hours average per service)
      const avgLaborCostPerService = 100;
      const currentLaborCost = (currentServices?.length || 0) * avgLaborCostPerService;
      const lastMonthLaborCost = (lastMonthServices?.length || 0) * avgLaborCostPerService;

      // Calculate gross profit
      const currentGrossProfit = currentRevenue - currentPartsCost - currentLaborCost;
      const lastMonthGrossProfit = lastMonthRevenue - lastMonthPartsCost - lastMonthLaborCost;

      // Calculate profit margin
      const currentProfitMargin = currentRevenue > 0 ? (currentGrossProfit / currentRevenue) * 100 : 0;
      const lastMonthProfitMargin = lastMonthRevenue > 0 ? (lastMonthGrossProfit / lastMonthRevenue) * 100 : 0;

      // Calculate changes
      const revenueChange = lastMonthRevenue > 0 
        ? ((currentRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;
      
      const profitChange = lastMonthGrossProfit > 0 
        ? ((currentGrossProfit - lastMonthGrossProfit) / Math.abs(lastMonthGrossProfit)) * 100 
        : 0;

      const marginChange = lastMonthProfitMargin > 0 
        ? currentProfitMargin - lastMonthProfitMargin 
        : 0;

      return {
        currentRevenue,
        currentGrossProfit,
        currentProfitMargin,
        revenueChange,
        profitChange,
        marginChange
      };
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percent: number, showSign = true) => {
    const sign = showSign && percent > 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  const metrics = [
    {
      title: 'Monthly Revenue',
      value: formatCurrency(profitLossData?.currentRevenue || 0),
      change: `${formatPercentage(profitLossData?.revenueChange || 0)} from last month`,
      changeType: (profitLossData?.revenueChange || 0) >= 0 ? 'positive' as const : 'negative' as const,
      icon: DollarSign,
    },
    {
      title: 'Gross Profit',
      value: formatCurrency(profitLossData?.currentGrossProfit || 0),
      change: `${formatPercentage(profitLossData?.profitChange || 0)} from last month`,
      changeType: (profitLossData?.profitChange || 0) >= 0 ? 'positive' as const : 'negative' as const,
      icon: (profitLossData?.profitChange || 0) >= 0 ? TrendingUp : TrendingDown,
    },
    {
      title: 'Profit Margin',
      value: formatPercentage(profitLossData?.currentProfitMargin || 0, false),
      change: `${formatPercentage(profitLossData?.marginChange || 0)} from last month`,
      changeType: (profitLossData?.marginChange || 0) >= 0 ? 'positive' as const : 'negative' as const,
      icon: (profitLossData?.marginChange || 0) >= 0 ? TrendingUp : TrendingDown,
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
