
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Auth = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const { user, loading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Auth.tsx useEffect - user:', user?.email, 'loading:', loading, 'rolesLoading:', rolesLoading, 'roles:', roles);
    
    // Wait until everything is loaded
    if (loading || rolesLoading) {
      console.log('Auth.tsx: Still loading, waiting...');
      return;
    }
    
    // Only redirect if user is authenticated
    // The auth page itself shouldn't show for authenticated users
    if (user) {
      console.log('Auth.tsx: User authenticated, checking roles...', roles);
      
      // Check if user is a customer - redirect to client portal
      if (roles.includes('customer')) {
        console.log('Auth.tsx: Customer detected, redirecting to client-portal');
        navigate('/client-portal', { replace: true });
      } else if (roles.length > 0) {
        // Business user with roles - redirect to menu
        console.log('Auth.tsx: Business user detected, redirecting to menu');
        navigate('/menu', { replace: true });
      } else {
        // User authenticated but no roles - this shouldn't happen normally
        // Just stay on auth page - they might be a new user
        console.log('Auth.tsx: User authenticated but no roles assigned');
      }
    }
  }, [user, loading, rolesLoading, roles, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-start mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
        </div>
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            Customer Management Dashboard
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your customer information securely
          </p>
        </div>
        <AuthForm 
          mode={mode} 
          onToggleMode={() => setMode(mode === 'signin' ? 'signup' : 'signin')} 
        />
      </div>
    </div>
  );
};

export default Auth;
