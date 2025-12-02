import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Droplets, Sparkles, Shield, Clock, Smartphone, Bell, FileText, Camera } from 'lucide-react';

const CleaningPricing = () => {
  const pricingTiers = [
    {
      name: "Small Pool",
      size: "Up to 10,000 gallons",
      weeklyPrice: 40,
      color: "bg-blue-500",
      features: [
        "Weekly pool cleaning",
        "Chemical balancing",
        "Skimming",
        "Vacuuming (as needed)",
        "Quarterly Filter Cleaning",
        "Equipment inspection",
        "Water testing",
        "Tile line brushing",
        "Pump basket cleaning",
        "Skimmer basket cleaning",
      ],
      popular: false,
    },
    {
      name: "Medium Pool",
      size: "10,001 - 20,000 gallons",
      weeklyPrice: 50,
      color: "bg-cyan-500",
      features: [
        "Weekly pool cleaning",
        "Chemical balancing",
        "Skimming",
        "Vacuuming (as needed)",
        "Quarterly Filter Cleaning",
        "Equipment inspection",
        "Water testing",
        "Tile line brushing",
        "Pump basket cleaning",
        "Skimmer basket cleaning",
      ],
      popular: true,
    },
    {
      name: "Large Pool",
      size: "20,001 - 40,000 gallons",
      weeklyPrice: 60,
      color: "bg-indigo-500",
      features: [
        "Weekly pool cleaning",
        "Chemical balancing",
        "Skimming",
        "Vacuuming (as needed)",
        "Quarterly Filter Cleaning",
        "Equipment inspection",
        "Water testing",
        "Tile line brushing",
        "Pump basket cleaning",
        "Skimmer basket cleaning",
      ],
      popular: false,
    },
    {
      name: "Extra Large Pool",
      size: "40,001+ gallons",
      weeklyPrice: 75,
      color: "bg-purple-500",
      features: [
        "Weekly pool cleaning",
        "Chemical balancing",
        "Skimming",
        "Vacuuming (as needed)",
        "Quarterly Filter Cleaning",
        "Equipment inspection",
        "Water testing",
        "Tile line brushing",
        "Pump basket cleaning",
        "Skimmer basket cleaning",
      ],
      popular: false,
    },
  ];

  const additionalServices = [
    { name: "Spa/Hot Tub Add-on", price: "+$10/week", description: "Full spa maintenance included" },
    { name: "Green to Clean", price: "Starting at $350", description: "Restore neglected pools" },
    { name: "Standalone Water Features", price: "+$10/week", description: "Fountains, waterfalls, and more" },
    { name: "Acid Wash", price: "Starting at $450", description: "Remove stains and buildup" },
    { name: "Equipment Repair", price: "Varies", description: "Pump, filter, heater repairs" },
    { name: "Pool Opening/Closing", price: "$150-$250", description: "Seasonal service" },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Droplets className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-4">Pool Cleaning Services</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Professional weekly pool maintenance to keep your pool crystal clear and swim-ready all year round.
              </p>
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Licensed & Insured</h3>
                  <p className="text-sm text-muted-foreground">Full coverage protection</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Certified Technicians</h3>
                  <p className="text-sm text-muted-foreground">Trained professionals</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Consistent Schedule</h3>
                  <p className="text-sm text-muted-foreground">Same day, same time weekly</p>
                </div>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Weekly Service Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {pricingTiers.map((tier, index) => (
                  <Card key={index} className={`relative ${tier.popular ? 'ring-2 ring-primary shadow-lg' : ''}`}>
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                      </div>
                    )}
                    <CardHeader className="text-center pb-2">
                      <div className={`w-12 h-12 ${tier.color} rounded-full mx-auto mb-3 flex items-center justify-center`}>
                        <Droplets className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-xl">{tier.name}</CardTitle>
                      <CardDescription>{tier.size}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-6">
                        <span className="text-4xl font-bold text-foreground">${tier.weeklyPrice}</span>
                        <span className="text-muted-foreground">/week</span>
                        <div className="text-sm text-muted-foreground mt-1">+ chemicals</div>
                      </div>
                      <ul className="space-y-2 text-left mb-6">
                        {tier.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full" variant={tier.popular ? "default" : "outline"}>
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Additional Services */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Additional Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {additionalServices.map((service, index) => (
                  <div key={index} className="flex justify-between items-start p-4 bg-muted/50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-foreground">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                    <Badge variant="secondary" className="ml-2 whitespace-nowrap">
                      {service.price}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Repair Pricing */}
            <div className="mt-8 bg-card rounded-lg border p-6">
              <h2 className="text-2xl font-bold text-foreground mb-1">Repair Services</h2>
              <p className="text-muted-foreground mb-4">Exclusive rates for weekly & bi-weekly cleaning customers</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="font-semibold text-foreground mb-2">Quick Repairs</h3>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">Parts Only</p>
                  <p className="text-sm text-muted-foreground">
                    Minor repairs completed during your regular service visit — no labor charge, just pay for parts.
                  </p>
                </div>
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-foreground mb-2">Standard Repairs</h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">$60/hr</p>
                  <p className="text-sm text-muted-foreground">
                    More involved repairs requiring dedicated service time, plus parts.
                  </p>
                </div>
                <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
                  <h3 className="font-semibold text-foreground mb-2">Emergency Service</h3>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">$125/hr</p>
                  <p className="text-sm text-muted-foreground">
                    First hour at $125, then $60/hr thereafter, plus parts.
                  </p>
                </div>
              </div>
            </div>

            {/* Technology Section */}
            <div className="mt-8 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20 p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Technology-Driven Service</h2>
                <p className="text-muted-foreground">Modern tools for a better pool service experience</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col items-center text-center p-4">
                  <div className="p-3 bg-primary/10 rounded-full mb-3">
                    <Smartphone className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Customer Portal</h3>
                  <p className="text-sm text-muted-foreground">Access service history, photos, and account details anytime</p>
                </div>
                <div className="flex flex-col items-center text-center p-4">
                  <div className="p-3 bg-primary/10 rounded-full mb-3">
                    <Bell className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">SMS Notifications</h3>
                  <p className="text-sm text-muted-foreground">Real-time updates when your service is complete</p>
                </div>
                <div className="flex flex-col items-center text-center p-4">
                  <div className="p-3 bg-primary/10 rounded-full mb-3">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Digital Service Records</h3>
                  <p className="text-sm text-muted-foreground">Detailed logs of every visit with water chemistry readings</p>
                </div>
                <div className="flex flex-col items-center text-center p-4">
                  <div className="p-3 bg-primary/10 rounded-full mb-3">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Photo Documentation</h3>
                  <p className="text-sm text-muted-foreground">Visual records of your pool's condition after each service</p>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="mt-8 p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                * Prices may vary based on pool condition, equipment, and location. Contact us for a personalized quote.
              </p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default CleaningPricing;
