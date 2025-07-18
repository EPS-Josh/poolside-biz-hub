import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Search } from 'lucide-react';

const TSBs = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Technical Service Bulletins</h1>
              <p className="text-muted-foreground">Manage and track technical service bulletins and procedures</p>
            </div>

            <div className="mb-6">
              <Button className="mb-4">
                <Plus className="h-4 w-4 mr-2" />
                Add New TSB
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>TSB Management</span>
                </CardTitle>
                <CardDescription>
                  Technical Service Bulletins will be displayed here
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No TSBs Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by adding your first Technical Service Bulletin
                  </p>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First TSB
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default TSBs;