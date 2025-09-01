
import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarView } from '@/components/calendar/CalendarView';
import { AppointmentForm } from '@/components/calendar/AppointmentForm';
import { AppointmentList } from '@/components/calendar/AppointmentList';
import { CalendarIntegrations } from '@/components/calendar/CalendarIntegrations';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, Plus, List, Grid, Users, Settings } from 'lucide-react';
import { ServiceRoutes } from '@/components/calendar/ServiceRoutes';
import { useNavigate } from 'react-router-dom';
import { getCurrentPhoenixDate } from '@/utils/phoenixTimeUtils';

type ViewType = 'month' | 'week' | 'day' | 'list' | 'routes';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const navigate = useNavigate();

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  // Get current Phoenix date for "Today's Appointments"
  const phoenixToday = getCurrentPhoenixDate();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                <CalendarIcon className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Appointment Calendar</h1>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                {/* View Toggle */}
                <div className="flex rounded-lg border border-gray-200 bg-white">
                  <Button
                    variant={viewType === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewType('month')}
                    className="rounded-r-none"
                  >
                    Month
                  </Button>
                  <Button
                    variant={viewType === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewType('week')}
                    className="rounded-none border-x-0"
                  >
                    Week
                  </Button>
                  <Button
                    variant={viewType === 'day' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewType('day')}
                    className="rounded-none border-x-0"
                  >
                    Day
                  </Button>
                  <Button
                    variant={viewType === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewType('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* New Appointment Button */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>New Appointment</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Appointment</DialogTitle>
                    </DialogHeader>
                    <AppointmentForm 
                      onSuccess={() => setIsDialogOpen(false)}
                      selectedDate={selectedDate}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Main Content with Tabs */}
            <Tabs defaultValue="calendar" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="calendar" className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Calendar</span>
                </TabsTrigger>
                <TabsTrigger value="integrations" className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Integrations</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calendar">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Main Calendar View */}
                  <div className="lg:col-span-3">
                    <Card>
                      <CardContent className="p-0">
                        {viewType === 'list' ? (
                          <AppointmentList />
                        ) : viewType === 'routes' ? (
                          <ServiceRoutes />
                        ) : (
                          <CalendarView
                            viewType={viewType}
                            currentDate={currentDate}
                            onDateChange={setCurrentDate}
                            onDateSelect={handleDateSelect}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Today's Appointments */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Today's Appointments</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <AppointmentList limit={5} dateFilter={phoenixToday} />
                      </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/customers')}>
                          <Users className="h-4 w-4 mr-2" />
                          Add Customer
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          View All Appointments
                        </Button>
                        <Button variant="outline" className="w-full justify-start" onClick={() => setViewType('routes')}>
                          <Grid className="h-4 w-4 mr-2" />
                          Service Routes
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="integrations">
                <CalendarIntegrations />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Calendar;
