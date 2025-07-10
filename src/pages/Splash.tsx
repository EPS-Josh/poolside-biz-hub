import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Shield, ArrowRight, Phone, Mail, MapPin } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const Splash = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: Calendar,
      title: "Pool Cleaning & Maintenance",
      description: "Weekly cleaning, chemical balancing, and equipment maintenance to keep your pool crystal clear"
    },
    {
      icon: Calendar,
      title: "Scheduled Service Plans", 
      description: "Reliable weekly or bi-weekly service plans tailored to your pool's specific needs"
    },
    {
      icon: Users,
      title: "Equipment Repair & Installation",
      description: "Expert repair and installation of pumps, filters, heaters, and automation systems"
    },
    {
      icon: Shield,
      title: "Licensed & Insured",
      description: "Fully licensed professionals with comprehensive insurance for your peace of mind"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800 relative">
      {/* Fixed Background Logo */}
      <div 
        className="fixed top-0 left-0 w-full h-screen bg-no-repeat bg-center bg-contain opacity-5 dark:opacity-10 pointer-events-none z-0"
        style={{
          backgroundImage: `url('/lovable-uploads/1b78d6d1-0694-433e-9fec-a5d2ed069f46.png')`
        }}
      />

      {/* All content with relative positioning to appear above background */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-background/80 backdrop-blur-sm shadow-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <img 
                  src="/lovable-uploads/1b78d6d1-0694-433e-9fec-a5d2ed069f46.png" 
                  alt="Finest Pools & Spas LLC Logo" 
                  className="h-12 w-auto"
                />
              </div>
              <div className="flex items-center space-x-3">
                <ThemeToggle />
                <Button variant="outline" className="flex items-center space-x-2">
                  <span>Client Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button onClick={() => navigate('/auth')} className="flex items-center space-x-2">
                  <span>Technician Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero with Pool Image */}
          <div className="relative rounded-2xl overflow-hidden mb-16">
            <div 
              className="h-96 bg-cover bg-center relative"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1920&q=80')`
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-center text-white">
                <div>
                  <h1 className="text-4xl md:text-6xl font-bold mb-6">
                    Your Pool,
                    <span className="text-cyan-400 block">Our Passion</span>
                  </h1>
                  <p className="text-xl mb-8 max-w-3xl mx-auto">
                    Professional pool maintenance services you can trust. 
                    Serving the community with excellence for over 3 decades.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/auth')}
                    className="px-8 py-3 text-lg bg-cyan-600 hover:bg-cyan-700"
                  >
                    Schedule Service Today
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-16 border border-border">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  About Finest Pools & Spas
                </h2>
                <p className="text-muted-foreground mb-4">
                  For over 35 years, Finest Pools & Spas has been the trusted choice for 
                  residential and commercial pool maintenance in southern Arizona. We pride ourselves 
                  on reliability, expertise, and exceptional customer service.
                </p>
                <p className="text-muted-foreground mb-6">
                  Our team of certified pool professionals ensures your pool is always ready for 
                  enjoyment, handling everything from routine cleaning to complex equipment repairs 
                  with the highest standards of quality and care.
                </p>
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <span className="text-foreground">(520) 728-3002</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span className="text-foreground">info@finestpools.com</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span className="text-foreground">Serving the Greater Tucson Area</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
                  alt="Beautiful pool with clear water"
                  className="rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">
              Our Professional Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow bg-card/90 backdrop-blur-sm">
                  <CardHeader>
                    <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                      <service.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{service.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl shadow-xl p-8 mb-16 text-white">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                Why Choose Finest Pools & Spas?
              </h2>
              <p className="text-xl opacity-90">
                Experience the difference that professional pool care makes
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">35+</div>
                <div className="text-lg">Years of Experience</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">500+</div>
                <div className="text-lg">Happy Customers</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">24/7</div>
                <div className="text-lg">Emergency Service</div>
              </div>
            </div>
          </div>

          <div className="bg-card/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center border border-border">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready for Crystal Clear Water?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join hundreds of satisfied customers who trust Finest Pools & Spas  
              for all their pool maintenance needs. Contact us today for a free consultation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="px-8 py-3 text-lg bg-cyan-600 hover:bg-cyan-700"
              >
                Get Started Today
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="px-8 py-3 text-lg border-cyan-600 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950"
              >
                Call (520) 728-3002
              </Button>
            </div>
          </div>
        </main>

        <footer className="bg-gray-900/90 backdrop-blur-sm dark:bg-gray-950/90 text-white py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <img 
                    src="/lovable-uploads/1b78d6d1-0694-433e-9fec-a5d2ed069f46.png" 
                    alt="Finest Pools & Spas LLC Logo" 
                    className="h-8 w-auto brightness-0 invert"
                  />
                </div>
                <p className="text-gray-400">
                  Professional pool maintenance services for over 3 decades.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
                <div className="space-y-2 text-gray-400">
                  <p>(520) 728-3002</p>
                  <p>joshua@finestpoolsandspas.com</p>
                  <p>Serving the Greater Tucson Area</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Business Hours</h3>
                <div className="space-y-2 text-gray-400">
                  <p>Monday - Friday: 7:00 AM - 5:00 PM</p>
                  <p>Saturday: 9:00 AM - 4:00 PM</p>
                  <p>Sunday: Emergency Service Only</p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>© 2025 Finest Pools & Spas LLC. Keeping your pool perfect, one service at a time.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Splash;
