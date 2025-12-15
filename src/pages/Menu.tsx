
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import WaterTestAnalyzer from '@/components/WaterTestAnalyzer';
import { 
  Users, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  BarChart3, 
  Package, 
  UserCheck, 
  Building, 
  Calendar,
  FileText,
  ClipboardList,
  Bell,
  MessageSquare,
  Droplets,
  MapPin,
  Calculator
} from 'lucide-react';


const Menu = () => {
  const navigate = useNavigate();

  const menuSections = [
    {
      title: "Dashboard & Metrics",
      description: "Key performance indicators and business overview",
      items: [
        {
          title: "Company Key Metrics",
          description: "View overall business performance and KPIs",
          icon: DollarSign,
          color: "bg-green-500",
          action: () => navigate('/bpa'),
        },
        {
          title: "Analytics & Reports",
          description: "Detailed analytics and business reports",
          icon: BarChart3,
          color: "bg-purple-500",
          action: () => navigate('/analytics'),
        },
      ]
    },
    {
      title: "Customers",
      description: "Customer management and information",
      items: [
        {
          title: "Customer Dashboard", 
          description: "Manage customers and view customer data",
          icon: Users,
          color: "bg-blue-500",
          action: () => navigate('/customers'),
        },
        {
          title: "Customer Messaging",
          description: "Manage SMS opt-ins and customer communications",
          icon: MessageSquare,
          color: "bg-cyan-500",
          action: () => navigate('/sms-opt-in'),
        },
        {
          title: "Cleaning Pricing",
          description: "View pool cleaning service pricing by pool size",
          icon: Droplets,
          color: "bg-sky-500",
          action: () => navigate('/cleaning-pricing'),
        },
        {
          title: "Customer Map",
          description: "View customer locations, plan routes, and manage service areas",
          icon: MapPin,
          color: "bg-rose-500",
          action: () => navigate('/customers/map'),
        },
      ]
    },
    {
      title: "Operations",
      description: "Day-to-day business operations and management",
      items: [
        {
          title: "Inventory",
          description: "Track products, parts, and supplies",
          icon: Package,
          color: "bg-orange-500",
          action: () => navigate('/inventory'),
        },
        {
          title: "Appointment Calendar",
          description: "Schedule and manage appointments",
          icon: Calendar,
          color: "bg-red-500",
          action: () => navigate('/calendar'),
        },
        {
          title: "Service Records",
          description: "View and manage all service records",
          icon: ClipboardList,
          color: "bg-blue-600",
          action: () => navigate('/service-records'),
        },
        {
          title: "Follow-ups Needed",
          description: "Manage service records requiring follow-up",
          icon: Bell,
          color: "bg-yellow-500",
          action: () => navigate('/follow-ups'),
        },
        {
          title: "TSB's",
          description: "Technical Service Bulletins management",
          icon: FileText,
          color: "bg-indigo-500",
          action: () => navigate('/tsbs'),
        },
      ]
    },
    {
      title: "Management",
      description: "Company and employee management tools",
      items: [
        {
          title: "Employees",
          description: "Manage staff and employee information",
          icon: UserCheck,
          color: "bg-teal-500",
          action: () => navigate('/employees'),
        },
        {
          title: "Company Data",
          description: "Company settings and configuration",
          icon: Building,
          color: "bg-gray-500",
          action: () => navigate('/company-data'),
        },
        {
          title: "Cleaning Forecast",
          description: "Analyze workload capacity and forecast staffing needs",
          icon: TrendingUp,
          color: "bg-emerald-500",
          action: () => navigate('/cleaning-forecast'),
        },
        {
          title: "Accountant",
          description: "Track accountant questions and answers",
          icon: Calculator,
          color: "bg-violet-500",
          action: () => navigate('/accountant'),
        },
      ]
    }
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Business Menu</h1>
              <p className="text-muted-foreground">Access all areas of your business from this central hub</p>
            </div>

            <div className="space-y-8">
              {menuSections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-1">{section.title}</h2>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {section.items.map((item, itemIndex) => (
                      <Card key={itemIndex} className="hover:shadow-lg transition-shadow cursor-pointer group">
                        <CardHeader className="pb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${item.color}`}>
                              <item.icon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                                {item.title}
                              </CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="mb-4 text-sm">
                            {item.description}
                          </CardDescription>
                          <Button 
                            onClick={item.action}
                            className="w-full"
                            variant="outline"
                          >
                            Access {item.title}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>


            {/* Water Test Analyzer Section */}
            <div className="mt-12">
              <WaterTestAnalyzer />
            </div>

            {/* Quick Actions Section */}
            <div className="mt-12 p-6 bg-card rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" className="flex items-center space-x-2" onClick={() => navigate('/customers')}>
                  <Users className="h-4 w-4" />
                  <span>Add Customer</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2" onClick={() => navigate('/calendar')}>
                  <Calendar className="h-4 w-4" />
                  <span>Schedule Service</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2" onClick={() => navigate('/inventory')}>
                  <Package className="h-4 w-4" />
                  <span>Check Inventory</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2" onClick={() => navigate('/analytics')}>
                  <BarChart3 className="h-4 w-4" />
                  <span>View Reports</span>
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Menu;
