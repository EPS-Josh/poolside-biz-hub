
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import WaterTestAnalyzer from '@/components/WaterTestAnalyzer';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { toast } from 'sonner';
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
  Calculator,
  Car,
  GripVertical,
  RotateCcw,
  Loader2,
  Route,
  Wrench,
  Image as ImageIcon
} from 'lucide-react';

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  route: string;
}

interface MenuSection {
  id: string;
  title: string;
  description: string;
  items: MenuItem[];
}

const getDefaultMenuSections = (): MenuSection[] => [
  {
    id: 'operations',
    title: "Operations",
    description: "Day-to-day business operations and management",
    items: [
      {
        id: 'calendar',
        title: "Appointment Calendar",
        description: "Schedule and manage appointments",
        icon: Calendar,
        color: "bg-red-500",
        route: '/calendar',
      },
      {
        id: 'daily-routes',
        title: "Daily Routes",
        description: "Plan and manage technician routes",
        icon: Route,
        color: "bg-emerald-600",
        route: '/daily-routes',
      },
      {
        id: 'technician-dashboard',
        title: "Technician View",
        description: "Mobile-friendly view for field technicians",
        icon: Wrench,
        color: "bg-cyan-600",
        route: '/technician',
      },
      {
        id: 'inventory',
        title: "Inventory",
        description: "Track products, parts, and supplies",
        icon: Package,
        color: "bg-orange-500",
        route: '/inventory',
      },
      {
        id: 'service-records',
        title: "Service Records",
        description: "View and manage all service records",
        icon: ClipboardList,
        color: "bg-blue-600",
        route: '/service-records',
      },
      {
        id: 'follow-ups',
        title: "Follow-ups Needed",
        description: "Manage service records requiring follow-up",
        icon: Bell,
        color: "bg-yellow-500",
        route: '/follow-ups',
      },
      {
        id: 'tsbs',
        title: "TSB's",
        description: "Technical Service Bulletins management",
        icon: FileText,
        color: "bg-indigo-500",
        route: '/tsbs',
      },
    ]
  },
  {
    id: 'dashboard',
    title: "Dashboard & Metrics",
    description: "Key performance indicators and business overview",
    items: [
      {
        id: 'bpa',
        title: "Company Key Metrics",
        description: "View overall business performance and KPIs",
        icon: DollarSign,
        color: "bg-green-500",
        route: '/bpa',
      },
      {
        id: 'analytics',
        title: "Analytics & Reports",
        description: "Detailed analytics and business reports",
        icon: BarChart3,
        color: "bg-purple-500",
        route: '/analytics',
      },
    ]
  },
  {
    id: 'customers',
    title: "Customers",
    description: "Customer management and information",
    items: [
      {
        id: 'customer-dashboard',
        title: "Customer Dashboard", 
        description: "Manage customers and view customer data",
        icon: Users,
        color: "bg-blue-500",
        route: '/customers',
      },
      {
        id: 'customer-messaging',
        title: "Customer Messaging",
        description: "Manage SMS opt-ins and customer communications",
        icon: MessageSquare,
        color: "bg-cyan-500",
        route: '/sms-opt-in',
      },
      {
        id: 'cleaning-pricing',
        title: "Cleaning Pricing",
        description: "View pool cleaning service pricing by pool size",
        icon: Droplets,
        color: "bg-sky-500",
        route: '/cleaning-pricing',
      },
      {
        id: 'customer-map',
        title: "Customer Map",
        description: "View customer locations, plan routes, and manage service areas",
        icon: MapPin,
        color: "bg-rose-500",
        route: '/customers/map',
      },
      {
        id: 'photo-gallery',
        title: "Photo Gallery",
        description: "Review all photos uploaded across customers",
        icon: ImageIcon,
        color: "bg-pink-500",
        route: '/photo-gallery',
      },
    ]
  },
  {
    id: 'management',
    title: "Management",
    description: "Company and employee management tools",
    items: [
      {
        id: 'employees',
        title: "Employees",
        description: "Manage staff and employee information",
        icon: UserCheck,
        color: "bg-teal-500",
        route: '/employees',
      },
      {
        id: 'company-data',
        title: "Company Data",
        description: "Company settings and configuration",
        icon: Building,
        color: "bg-gray-500",
        route: '/company-data',
      },
      {
        id: 'cleaning-forecast',
        title: "Cleaning Forecast",
        description: "Analyze workload capacity and forecast staffing needs",
        icon: TrendingUp,
        color: "bg-emerald-500",
        route: '/cleaning-forecast',
      },
      {
        id: 'accountant',
        title: "Accountant",
        description: "Track accountant questions and answers",
        icon: Calculator,
        color: "bg-violet-500",
        route: '/accountant',
      },
      {
        id: 'mileage-calculator',
        title: "Mileage Calculator",
        description: "Track business mileage for tax deductions",
        icon: Car,
        color: "bg-amber-500",
        route: '/mileage-calculator',
      },
    ]
  }
];

// Icon mapping for restoring from database
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar, Package, ClipboardList, Bell, FileText, DollarSign, BarChart3,
  Users, MessageSquare, Droplets, MapPin, UserCheck, Building, TrendingUp,
  Calculator, Car, Route, Wrench, ImageIcon
};

const getIconForItem = (itemId: string, defaultSections: MenuSection[]): React.ComponentType<{ className?: string }> => {
  for (const section of defaultSections) {
    const item = section.items.find(i => i.id === itemId);
    if (item) return item.icon;
  }
  return Calendar;
};

const restoreIcons = (sections: MenuSection[]): MenuSection[] => {
  const defaultSections = getDefaultMenuSections();
  return sections.map((section: MenuSection) => ({
    ...section,
    items: section.items.map((item: MenuItem) => ({
      ...item,
      icon: getIconForItem(item.id, defaultSections)
    }))
  }));
};

const serializeLayout = (sections: MenuSection[]) => {
  // Remove icon references before saving since they can't be serialized
  return sections.map(section => ({
    ...section,
    items: section.items.map(item => ({
      ...item,
      icon: undefined
    }))
  }));
};

const Menu = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isTechnician, loading: rolesLoading } = useUserRoles();
  const [menuSections, setMenuSections] = useState<MenuSection[]>(getDefaultMenuSections());
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Filter sections based on user role
  const visibleMenuSections = useMemo(() => {
    if (rolesLoading) return menuSections;
    if (isAdmin()) return menuSections;
    
    // Sections to hide for non-admin users
    const hiddenSections = ['management'];
    
    // Also hide dashboard & metrics for technicians
    if (isTechnician()) {
      hiddenSections.push('dashboard');
    }
    
    return menuSections.filter(section => !hiddenSections.includes(section.id));
  }, [menuSections, isAdmin, isTechnician, rolesLoading]);

  // Load layout from database
  useEffect(() => {
    const loadLayout = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_menu_layouts')
          .select('layout_data')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading menu layout:', error);
          setMenuSections(getDefaultMenuSections());
        } else if (data?.layout_data) {
          const restored = restoreIcons(data.layout_data as unknown as MenuSection[]);
          setMenuSections(restored);
        } else {
          setMenuSections(getDefaultMenuSections());
        }
      } catch (err) {
        console.error('Error loading menu layout:', err);
        setMenuSections(getDefaultMenuSections());
      } finally {
        setIsLoading(false);
      }
    };

    loadLayout();
  }, [user]);

  // Save layout to database (debounced)
  const saveLayout = useCallback(async (sections: MenuSection[]) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const serialized = serializeLayout(sections);
      
      const { error } = await supabase
        .from('user_menu_layouts')
        .upsert({
          user_id: user.id,
          layout_data: serialized
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving menu layout:', error);
        toast.error('Failed to save layout');
      }
    } catch (err) {
      console.error('Error saving menu layout:', err);
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, type } = result;
    
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    let newSections: MenuSection[];

    if (type === 'section') {
      // Reordering sections
      newSections = Array.from(menuSections);
      const [removed] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, removed);
    } else {
      // Reordering items within or between sections
      const sourceSectionIndex = menuSections.findIndex(s => s.id === source.droppableId);
      const destSectionIndex = menuSections.findIndex(s => s.id === destination.droppableId);
      
      if (sourceSectionIndex === -1 || destSectionIndex === -1) return;

      newSections = [...menuSections];
      
      if (sourceSectionIndex === destSectionIndex) {
        // Same section
        const newItems = Array.from(newSections[sourceSectionIndex].items);
        const [removed] = newItems.splice(source.index, 1);
        newItems.splice(destination.index, 0, removed);
        newSections[sourceSectionIndex] = { ...newSections[sourceSectionIndex], items: newItems };
      } else {
        // Different sections
        const sourceItems = Array.from(newSections[sourceSectionIndex].items);
        const destItems = Array.from(newSections[destSectionIndex].items);
        const [removed] = sourceItems.splice(source.index, 1);
        destItems.splice(destination.index, 0, removed);
        newSections[sourceSectionIndex] = { ...newSections[sourceSectionIndex], items: sourceItems };
        newSections[destSectionIndex] = { ...newSections[destSectionIndex], items: destItems };
      }
    }
    
    setMenuSections(newSections);
    saveLayout(newSections);
  };

  const resetLayout = async () => {
    const defaultSections = getDefaultMenuSections();
    setMenuSections(defaultSections);
    
    if (user) {
      try {
        await supabase
          .from('user_menu_layouts')
          .delete()
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Error resetting layout:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Business Menu</h1>
                <p className="text-muted-foreground">
                  Access all areas of your business from this central hub
                  {isSaving && <span className="ml-2 text-xs">(saving...)</span>}
                </p>
              </div>
              <div className="flex gap-2">
                {isEditMode && (
                  <Button variant="outline" size="sm" onClick={resetLayout}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Layout
                  </Button>
                )}
                <Button 
                  variant={isEditMode ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  <GripVertical className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Done Editing' : 'Edit Layout'}
                </Button>
              </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections" type="section">
                {(provided) => (
                  <div 
                    className="space-y-8" 
                    ref={provided.innerRef} 
                    {...provided.droppableProps}
                  >
                    {visibleMenuSections.map((section, sectionIndex) => (
                      <Draggable 
                        key={section.id} 
                        draggableId={section.id} 
                        index={sectionIndex}
                        isDragDisabled={!isEditMode}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`space-y-4 ${snapshot.isDragging ? 'opacity-80' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              {isEditMode && (
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
                                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <h2 className="text-xl font-semibold text-foreground mb-1">{section.title}</h2>
                                <p className="text-sm text-muted-foreground">{section.description}</p>
                              </div>
                            </div>
                            
                            <Droppable droppableId={section.id} type="item">
                              {(provided) => (
                                <div 
                                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                >
                                  {section.items.map((item, itemIndex) => (
                                    <Draggable 
                                      key={item.id} 
                                      draggableId={item.id} 
                                      index={itemIndex}
                                      isDragDisabled={!isEditMode}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={snapshot.isDragging ? 'opacity-80' : ''}
                                        >
                                          <Card className={`hover:shadow-lg transition-shadow cursor-pointer group h-full ${isEditMode ? 'ring-2 ring-dashed ring-muted-foreground/30' : ''}`}>
                                            <CardHeader className="pb-4">
                                              <div className="flex items-center space-x-3">
                                                {isEditMode && (
                                                  <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
                                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                  </div>
                                                )}
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
                                                onClick={() => !isEditMode && navigate(item.route)}
                                                className="w-full"
                                                variant="outline"
                                                disabled={isEditMode}
                                              >
                                                Access {item.title}
                                              </Button>
                                            </CardContent>
                                          </Card>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>


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
