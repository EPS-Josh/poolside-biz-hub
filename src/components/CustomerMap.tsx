import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Settings } from 'lucide-react';

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
}

interface CustomerMapProps {
  customers: Customer[];
}

const CustomerMap: React.FC<CustomerMapProps> = ({ customers }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Try to get Mapbox token from Supabase secrets first
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

  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&country=US&proximity=-110.8,32.2`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        return data.features[0].center;
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const addCustomerMarkers = async () => {
    if (!map.current) return;

    const customersWithAddresses = customers.filter(customer => 
      customer.address && customer.city && customer.state
    );

    for (const customer of customersWithAddresses) {
      const fullAddress = `${customer.address}, ${customer.city}, ${customer.state} ${customer.zip_code || ''}`;
      const coordinates = await geocodeAddress(fullAddress);

      if (coordinates) {
        // Create marker element safely
        const markerElement = document.createElement('div');
        markerElement.className = 'customer-marker';
        
        const outerDiv = document.createElement('div');
        outerDiv.className = 'w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform';
        
        const innerDiv = document.createElement('div');
        innerDiv.className = 'w-full h-full rounded-full bg-primary opacity-75';
        
        outerDiv.appendChild(innerDiv);
        markerElement.appendChild(outerDiv);

        // Create popup content safely
        const popupContainer = document.createElement('div');
        popupContainer.className = 'p-2';
        
        const nameHeader = document.createElement('h3');
        nameHeader.className = 'font-semibold text-sm';
        nameHeader.textContent = `${customer.first_name} ${customer.last_name}`;
        popupContainer.appendChild(nameHeader);
        
        if (customer.company) {
          const companyP = document.createElement('p');
          companyP.className = 'text-xs text-muted-foreground';
          companyP.textContent = customer.company;
          popupContainer.appendChild(companyP);
        }
        
        const addressP = document.createElement('p');
        addressP.className = 'text-xs mt-1';
        addressP.textContent = fullAddress;
        popupContainer.appendChild(addressP);
        
        if (customer.email) {
          const emailP = document.createElement('p');
          emailP.className = 'text-xs text-blue-600';
          emailP.textContent = customer.email;
          popupContainer.appendChild(emailP);
        }
        
        if (customer.phone) {
          const phoneP = document.createElement('p');
          phoneP.className = 'text-xs text-blue-600';
          phoneP.textContent = customer.phone;
          popupContainer.appendChild(phoneP);
        }

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false
        }).setDOMContent(popupContainer);

        new mapboxgl.Marker(markerElement)
          .setLngLat(coordinates)
          .setPopup(popup)
          .addTo(map.current);
      }
    }

    // Fit map to show all markers
    if (customersWithAddresses.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      
      for (const customer of customersWithAddresses) {
        const fullAddress = `${customer.address}, ${customer.city}, ${customer.state} ${customer.zip_code || ''}`;
        const coordinates = await geocodeAddress(fullAddress);
        if (coordinates) {
          bounds.extend(coordinates);
        }
      }

      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { padding: 50 });
      }
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

  return (
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
            {customers.filter(c => c.address && c.city && c.state).length} customers with addresses
          </span>
        </div>
      </div>
    </div>
  );
};

export default CustomerMap;