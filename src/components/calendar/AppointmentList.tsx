
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, addDays, isSameDay } from 'date-fns';
import { Calendar, Clock, User, MapPin, Phone, Edit, Trash2 } from 'lucide-react';

interface AppointmentListProps {
  limit?: number;
  dateFilter?: Date;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({
  limit,
  dateFilter
}) => {
  // Mock appointments data - in real app, this would come from your backend
  const allAppointments = [
    {
      id: '1',
      date: new Date(),
      time: '10:00 AM',
      customer: 'John Smith',
      customerPhone: '(520) 555-0123',
      address: '123 Main St, Tucson, AZ',
      service: 'Weekly Pool Cleaning',
      status: 'scheduled',
      notes: 'Check pool filter'
    },
    {
      id: '2',
      date: addDays(new Date(), 1),
      time: '2:00 PM',
      customer: 'Jane Doe',
      customerPhone: '(520) 555-0456',
      address: '456 Oak Ave, Tucson, AZ',
      service: 'Equipment Repair',
      status: 'confirmed',
      notes: 'Pool pump making noise'
    },
    {
      id: '3',
      date: addDays(new Date(), 2),
      time: '9:00 AM',
      customer: 'Bob Johnson',
      customerPhone: '(520) 555-0789',
      address: '789 Pine Rd, Tucson, AZ',
      service: 'Chemical Balancing',
      status: 'scheduled',
      notes: ''
    },
    {
      id: '4',
      date: addDays(new Date(), 3),
      time: '11:00 AM',
      customer: 'Sarah Wilson',
      customerPhone: '(520) 555-0321',
      address: '321 Cedar Ln, Tucson, AZ',
      service: 'Pool Opening',
      status: 'confirmed',
      notes: 'First service of the season'
    }
  ];

  let appointments = allAppointments;

  // Filter by date if provided
  if (dateFilter) {
    appointments = appointments.filter(apt => 
      isSameDay(apt.date, dateFilter)
    );
  }

  // Apply limit if provided
  if (limit) {
    appointments = appointments.slice(0, limit);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {dateFilter ? 'No appointments for this date' : 'No appointments found'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map(appointment => (
        <Card key={appointment.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    {format(appointment.date, 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{appointment.time}</span>
                </div>
              </div>
              <Badge className={getStatusColor(appointment.status)}>
                {appointment.status}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{appointment.customer}</span>
                <Phone className="h-4 w-4 text-gray-500 ml-4" />
                <span className="text-sm text-gray-600">{appointment.customerPhone}</span>
              </div>

              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{appointment.address}</span>
              </div>

              <div className="text-sm">
                <span className="font-medium">Service:</span> {appointment.service}
              </div>

              {appointment.notes && (
                <div className="text-sm">
                  <span className="font-medium">Notes:</span> {appointment.notes}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {limit && allAppointments.length > limit && (
        <div className="text-center">
          <Button variant="outline" className="mt-4">
            View All Appointments
          </Button>
        </div>
      )}
    </div>
  );
};
