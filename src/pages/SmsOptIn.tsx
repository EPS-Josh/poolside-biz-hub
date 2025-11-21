import { useState } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Phone, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { SmsMessageComposer } from '@/components/sms/SmsMessageComposer';

export default function SmsOptIn() {
  const [searchTerm, setSearchTerm] = useState('');
  const { customers, loading } = useCustomers(searchTerm);

  // Filter only customers who have opted in to SMS
  const optedInCustomers = customers.filter(customer => customer.sms_opt_in);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">SMS Opt-In Management</h1>
          <p className="text-muted-foreground">
            Customers who have opted in to receive text messages from Finest Pools & Spas LLC
          </p>
        </div>

        <div className="mb-6">
          <SmsMessageComposer customers={optedInCustomers} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Opted-In Customers ({optedInCustomers.length})
            </CardTitle>
            <CardDescription>
              View and manage customers who have consented to SMS communications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading customers...
              </div>
            ) : optedInCustomers.length === 0 ? (
              <div className="text-center py-12">
                <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No opted-in customers match your search' : 'No customers have opted in to SMS yet'}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Opt-In Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {optedInCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          {customer.first_name} {customer.last_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {customer.phone || 'N/A'}
                            {customer.phone_verified && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.email || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {customer.sms_opt_in_date 
                            ? format(new Date(customer.sms_opt_in_date), 'MMM d, yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={customer.phone_verified ? "default" : "secondary"}>
                            {customer.phone_verified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
