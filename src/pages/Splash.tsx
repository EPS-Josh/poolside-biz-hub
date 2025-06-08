
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Waves, Users, Calendar, Shield, ArrowRight, Phone, Mail, MapPin } from 'lucide-react';

const Splash = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: Waves,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Waves className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Finest Pools & Spas LLC</h1>
            </div>
            <div className="flex items-center space-x-3">
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
                  Professional pool cleaning and maintenance services you can trust. 
                  Serving the community with excellence for over a decade.
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
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                About Finest Pools & Spas LLC
              </h2>
              <p className="text-gray-600 mb-4">
                For over 10 years, Finest Pools & Spas LLC has been the trusted choice for 
                residential and commercial pool maintenance in our community. We pride ourselves 
                on reliability, expertise, and exceptional customer service.
              </p>
              <p className="text-gray-600 mb-6">
                Our team of certified pool professionals ensures your pool is always ready for 
                enjoyment, handling everything from routine cleaning to complex equipment repairs 
                with the highest standards of quality and care.
              </p>
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">(520) 314-1015</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">info@finestpools.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">Serving the Greater Miami Area</span>
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
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Our Professional Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
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
              Why Choose Finest Pools & Spas LLC?
            </h2>
            <p className="text-xl opacity-90">
              Experience the difference that professional pool care makes
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10+</div>
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

        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready for Crystal Clear Water?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join hundreds of satisfied customers who trust Finest Pools & Spas LLC 
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
              className="px-8 py-3 text-lg border-cyan-600 text-cyan-600 hover:bg-cyan-50"
            >
              Call (520) 314-1015
            </Button>
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Waves className="h-6 w-6" />
                <span className="text-lg font-semibold">Finest Pools & Spas LLC</span>
              </div>
              <p className="text-gray-400">
                Professional pool maintenance services for over a decade.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
              <div className="space-y-2 text-gray-400">
                <p>(520) 314-1015</p>
                <p>info@finestpools.com</p>
                <p>Serving the Greater Miami Area</p>
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
  );
};

export default Splash;
