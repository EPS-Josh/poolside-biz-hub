import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Settings, RefreshCw } from 'lucide-react';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  geocoded_at?: string;
}

interface OptimizedCustomerMapProps {
  customers: Customer[];
}

const OptimizedCustomerMap: React.FC<OptimizedCustomerMapProps> = ({ customers }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkForMapboxToken();
  }, []);

  const checkForMapboxToken = async () => {
    try {
      console.log('Attempting to retrieve Mapbox token...');
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      console.log('Edge function response:', { data, error });
      
      if (error) {
        console.error('Edge function error:', error);
        setShowTokenInput(true);
        return;
      }
      
      if (data?.token) {
        console.log('Token retrieved successfully');
        setMapboxToken(data.token);
        initializeMap(data.token);
      } else {
        console.log('No token in response, showing input field');
        setShowTokenInput(true);
      }
    } catch (error) {
      console.error('Error calling edge function:', error);
      setShowTokenInput(true);
    }
  };

  const initializeMap = async (token: string) => {
    if (!mapContainer.current || !token) return;

    try {
      setIsLoading(true);
      mapboxgl.accessToken = token;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-110.8, 32.2], // Tucson, AZ area
        zoom: 10,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Wait for map to load before adding markers
      map.current.on('load', () => {
        addCustomerMarkers();
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        title: 'Map Error',
        description: 'Failed to initialize map. Please check your Mapbox token.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomerMarkers = () => {
    if (!map.current) return;

    // Filter customers that have geocoded coordinates
    const customersWithCoordinates = customers.filter(customer => 
      customer.latitude && customer.longitude
    );

    console.log(`Adding ${customersWithCoordinates.length} customer markers to map`);

    const bounds = new mapboxgl.LngLatBounds();
    let markersAdded = 0;

    customersWithCoordinates.forEach(customer => {
      if (!customer.latitude || !customer.longitude) return;

      const coordinates: [number, number] = [customer.longitude, customer.latitude];

      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'customer-marker';
      markerElement.innerHTML = `
        <div class="w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
          <div class="w-full h-full rounded-full bg-primary opacity-75"></div>
        </div>
      `;

      // Create popup content
      const fullAddress = `${customer.address || ''}, ${customer.city || ''}, ${customer.state || ''} ${customer.zip_code || ''}`.trim();
      const popupContent = `
        <div class="p-2">
          <h3 class="font-semibold text-sm">${customer.first_name} ${customer.last_name}</h3>
          ${customer.company ? `<p class="text-xs text-muted-foreground">${customer.company}</p>` : ''}
          <p class="text-xs mt-1">${fullAddress}</p>
          ${customer.email ? `<p class="text-xs text-blue-600">${customer.email}</p>` : ''}
          ${customer.phone ? `<p class="text-xs text-blue-600">${customer.phone}</p>` : ''}
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(popupContent);

      new mapboxgl.Marker(markerElement)
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      bounds.extend(coordinates);
      markersAdded++;
    });

    // Fit map to show all markers
    if (markersAdded > 0 && !bounds.isEmpty()) {
      map.current!.fitBounds(bounds, { padding: 50 });
    }
  };

  const geocodeCustomersInBackground = async () => {
    setIsGeocoding(true);
    
    // Find customers that need geocoding
    const customersNeedingGeocode = customers.filter(customer => 
      customer.address && customer.city && customer.state && 
      (!customer.latitude || !customer.longitude) && !customer.geocoded_at
    );

    console.log(`Found ${customersNeedingGeocode.length} customers needing geocoding`);

    let successCount = 0;
    let errorCount = 0;

    for (const customer of customersNeedingGeocode) {
      try {
        const { data, error } = await supabase.functions.invoke('geocode-customer', {
          body: {
            customerId: customer.id,
            address: customer.address,
            city: customer.city,
            state: customer.state,
            zipCode: customer.zip_code
          }
        });

        if (error) {
          console.error(`Failed to geocode customer ${customer.id}:`, error);
          errorCount++;
        } else if (data.success) {
          successCount++;
        } else {
          errorCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error geocoding customer ${customer.id}:`, error);
        errorCount++;
      }
    }

    setIsGeocoding(false);

    toast({
      title: 'Geocoding Complete',
      description: `Successfully geocoded ${successCount} customers. ${errorCount} failed.`,
      variant: successCount > 0 ? 'default' : 'destructive',
    });

    // Refresh the page to show updated markers
    if (successCount > 0) {
      window.location.reload();
    }
  };

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      setShowTokenInput(false);
      initializeMap(mapboxToken);
    } else {
      toast({
        title: 'Token Required',
        description: 'Please enter a valid Mapbox token.',
        variant: 'destructive',
      });
    }
  };

  if (showTokenInput) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Mapbox Configuration</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Please enter your Mapbox public token to display the customer map.
                You can find your token at{' '}
                <a 
                  href="https://mapbox.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  mapbox.com
                </a>
              </p>
              <div className="space-y-2">
                <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
                <Input
                  id="mapbox-token"
                  type="text"
                  placeholder="pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGVhcmx5LXJlYWRhYmxlLXRva2VuIn0..."
                  value={mapboxToken}
                  onChange={(e) => setMapboxToken(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTokenSubmit()}
                />
              </div>
              <Button onClick={handleTokenSubmit} className="w-full">
                <MapPin className="h-4 w-4 mr-2" />
                Initialize Map
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const customersWithCoordinates = customers.filter(c => c.latitude && c.longitude);
  const customersNeedingGeocode = customers.filter(c => 
    c.address && c.city && c.state && (!c.latitude || !c.longitude) && !c.geocoded_at
  );

  return (
    <div className="space-y-4">
      {/* Geocoding Controls */}
      {customersNeedingGeocode.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Geocoding Available</h3>
                <p className="text-sm text-muted-foreground">
                  {customersNeedingGeocode.length} customers need geocoding to appear on the map
                </p>
              </div>
              <Button
                onClick={geocodeCustomersInBackground}
                disabled={isGeocoding}
                variant="outline"
              >
                {isGeocoding ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Geocoding...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Geocode Addresses
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map Container */}
      <div className="relative w-full h-[600px] rounded-lg overflow-hidden border">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}
        <div ref={mapContainer} className="absolute inset-0" />
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-medium">
              {customersWithCoordinates.length} customers with coordinates
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizedCustomerMap;