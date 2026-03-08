import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SplashPhotoManager } from '@/components/technician/SplashPhotoManager';

const SplashPhotos: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ProtectedRoute excludedRoles={['guest']}>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/menu')}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Splash Page Photos</h1>
          </div>
          <SplashPhotoManager />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SplashPhotos;
