import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Droplets, Sparkles, Shield, Clock } from 'lucide-react';

const CleaningPricing = () => {
  const pricingTiers = [
    {
      name: "Small Pool",
      size: "Up to 10,000 gallons",
      weeklyPrice: 125,
      color: "bg-blue-500",
      features: [
        "Weekly pool cleaning",
        "Chemical balancing",
        "Skimming & vacuuming",
        "Filter check",
        "Equipment inspection",
        "Water testing",
      ],
      popular: false,
    },
    {
      name: "Medium Pool",
      size: "10,001 - 20,000 gallons",
      weeklyPrice: 150,
      color: "bg-cyan-500",
      features: [
        "Weekly pool cleaning",
        "Chemical balancing",
        "Skimming & vacuuming",
        "Filter cleaning (monthly)",
        "Equipment inspection",
        "Water testing",
        "Tile line brushing",
      ],
      popular: true,
    },
    {
      name: "Large Pool",
      size: "20,001 - 40,000 gallons",
      weeklyPrice: 185,
      color: "bg-indigo-500",
      features: [
        "Weekly pool cleaning",
        "Chemical balancing",
        "Skimming & vacuuming",
        "Filter cleaning (bi-weekly)",
        "Equipment inspection",
        "Water testing",
        "Tile line brushing",
        "Pump basket cleaning",
      ],
      popular: false,
    },
    {
      name: "Extra Large Pool",
      size: "40,001+ gallons",
      weeklyPrice: 225,
      color: "bg-purple-500",
      features: [
        "Weekly pool cleaning",
        "Chemical balancing",
        "Skimming & vacuuming",
        "Filter cleaning (weekly)",
        "Full equipment inspection",
        "Comprehensive water testing",
        "Tile line brushing",
        "Pump basket cleaning",
        "Priority scheduling",
      ],
      popular: false,
    },
  ];

  const additionalServices = [
    { name: "Spa/Hot Tub Add-on", price: "+$35/week", description: "Full spa maintenance included" },
    { name: "Green to Clean", price: "Starting at $350", description: "Restore neglected pools" },
    { name: "Filter Deep Clean", price: "$75-$150", description: "Thorough filter cleaning" },
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
