import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DailyRouteManager } from '@/components/routes/DailyRouteManager';
import { ThemeToggle } from '@/components/ThemeToggle';

const DailyRoutes: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">Daily Routes</h1>
              <p className="text-xs text-muted-foreground">
                Manage technician routes and stops
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6">
        <DailyRouteManager />
      </div>
    </div>
  );
};

export default DailyRoutes;
