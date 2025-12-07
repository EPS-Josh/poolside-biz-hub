import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Settings, RefreshCw, Calendar } from 'lucide-react';

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

interface ServiceDetails {
  customer_id: string;
  service_day: string | null;
}

interface CleaningCustomerMapProps {
  customers: Customer[];
  cleaningCustomerIds: string[];
  potentialCustomerIds: string[];
}

// Day colors - vibrant and distinct
const DAY_COLORS: Record<string, { bg: string; hex: string; label: string }> = {
  Monday: { bg: 'bg-red-500', hex: '#ef4444', label: 'Mon' },
  Tuesday: { bg: 'bg-orange-500', hex: '#f97316', label: 'Tue' },
  Wednesday: { bg: 'bg-yellow-500', hex: '#eab308', label: 'Wed' },
  Thursday: { bg: 'bg-green-500', hex: '#22c55e', label: 'Thu' },
  Friday: { bg: 'bg-blue-500', hex: '#3b82f6', label: 'Fri' },
  Saturday: { bg: 'bg-purple-500', hex: '#a855f7', label: 'Sat' },
  Sunday: { bg: 'bg-pink-500', hex: '#ec4899', label: 'Sun' },
  Unassigned: { bg: 'bg-gray-400', hex: '#9ca3af', label: 'None' },
};

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const CleaningCustomerMap: React.FC<CleaningCustomerMapProps> = ({ 
  customers, 
  cleaningCustomerIds,
  potentialCustomerIds 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [serviceDetails, setServiceDetails] = useState<Map<string, string | null>>(new Map());
  const [shouldFitBounds, setShouldFitBounds] = useState(true);
  const { toast } = useToast();

  // Fetch service details for all customers
  useEffect(() => {
    const fetchServiceDetails = async () => {
      const { data, error } = await supabase
        .from('customer_service_details')
        .select('customer_id, service_day');

      if (error) {
        console.error('Error fetching service details:', error);
        return;
      }

      const detailsMap = new Map<string, string | null>();
      data?.forEach((d: ServiceDetails) => {
        detailsMap.set(d.customer_id, d.service_day);
      });
      setServiceDetails(detailsMap);
    };

    fetchServiceDetails();
  }, []);

  // Get cleaning customers (active + potential)
  const cleaningCustomers = customers.filter(c => 
    cleaningCustomerIds.includes(c.id) || potentialCustomerIds.includes(c.id)
  );

  // Filter by selected day if any
  const filteredCustomers = selectedDay
    ? cleaningCustomers.filter(c => {
        const day = serviceDetails.get(c.id);
        if (selectedDay === 'Unassigned') return !day;
        return day === selectedDay;
      })
    : cleaningCustomers;

  // Update service day for a customer
  const updateServiceDay = async (customerId: string, day: string | null) => {
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from('customer_service_details')
        .select('id')
        .eq('customer_id', customerId)
        .single();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('customer_service_details')
          .update({ service_day: day })
          .eq('customer_id', customerId);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('customer_service_details')
          .insert({ customer_id: customerId, service_day: day });

        if (error) throw error;
      }

      // Update local state without triggering fitBounds
      setShouldFitBounds(false);
      setServiceDetails(prev => {
        const updated = new Map(prev);
        updated.set(customerId, day);
        return updated;
      });

      toast({
        title: 'Service Day Updated',
        description: day ? `Assigned to ${day}` : 'Day assignment removed',
      });
    } catch (error) {
      console.error('Error updating service day:', error);
      toast({
        title: 'Error',
        description: 'Failed to update service day.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    checkForMapboxToken();
  }, []);

  const checkForMapboxToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error) {
        setShowTokenInput(true);
        return;
      }
      
      if (data?.token) {
        setMapboxToken(data.token);
        initializeMap(data.token);
      } else {
        setShowTokenInput(true);
      }
    } catch (error) {
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
        center: [-110.8, 32.2],
        zoom: 10,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        setMapLoaded(true);
        addCustomerMarkers();
      });

    } catch (error) {
      toast({
        title: 'Map Error',
        description: 'Failed to initialize map.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update markers when filters or service details change
  useEffect(() => {
    if (mapLoaded && map.current) {
      addCustomerMarkers();
    }
  }, [filteredCustomers, mapLoaded, serviceDetails, selectedDay]);

  const addCustomerMarkers = useCallback(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const customersWithCoordinates = filteredCustomers.filter(c => c.latitude && c.longitude);
    const bounds = new mapboxgl.LngLatBounds();
    let markersAdded = 0;

    customersWithCoordinates.forEach(customer => {
      if (!customer.latitude || !customer.longitude) return;

      const coordinates: [number, number] = [customer.longitude, customer.latitude];
      const serviceDay = serviceDetails.get(customer.id) || null;
      const dayInfo = serviceDay ? DAY_COLORS[serviceDay] : DAY_COLORS.Unassigned;
      const isPotential = potentialCustomerIds.includes(customer.id);

      // Create marker element with day color
      const markerElement = document.createElement('div');
      markerElement.className = 'customer-marker';
      
      const outerDiv = document.createElement('div');
      outerDiv.style.cssText = `
        width: 28px;
        height: 28px;
        background-color: ${dayInfo.hex};
        border-radius: 50%;
        border: 3px solid ${isPotential ? '#fbbf24' : '#ffffff'};
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      // Add day initial
      const dayLabel = document.createElement('span');
      dayLabel.style.cssText = 'color: white; font-size: 10px; font-weight: bold;';
      dayLabel.textContent = serviceDay ? serviceDay.charAt(0) : '?';
      outerDiv.appendChild(dayLabel);
      
      outerDiv.onmouseenter = () => { outerDiv.style.transform = 'scale(1.2)'; };
      outerDiv.onmouseleave = () => { outerDiv.style.transform = 'scale(1)'; };
      
      markerElement.appendChild(outerDiv);

      // Create popup content
      const fullAddress = `${customer.address || ''}, ${customer.city || ''}, ${customer.state || ''} ${customer.zip_code || ''}`.trim();
      
      const popupContainer = document.createElement('div');
      popupContainer.className = 'p-3 min-w-[220px]';
      
      // Customer name
      const nameHeader = document.createElement('h3');
      nameHeader.className = 'font-semibold text-sm';
      nameHeader.textContent = `${customer.first_name} ${customer.last_name}`;
      popupContainer.appendChild(nameHeader);
      
      // Potential badge
      if (isPotential) {
        const badge = document.createElement('span');
        badge.className = 'inline-block text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded mt-1';
        badge.textContent = 'Potential';
        popupContainer.appendChild(badge);
      }
      
      // Address
      const addressP = document.createElement('p');
      addressP.className = 'text-xs mt-1 text-gray-600';
      addressP.textContent = fullAddress;
      popupContainer.appendChild(addressP);

      // Current day display
      const currentDayDiv = document.createElement('div');
      currentDayDiv.className = 'mt-2 pt-2 border-t';
      const currentDayLabel = document.createElement('p');
      currentDayLabel.className = 'text-xs text-gray-500 mb-1';
      currentDayLabel.textContent = 'Service Day:';
      currentDayDiv.appendChild(currentDayLabel);
      
      const currentDayValue = document.createElement('span');
      currentDayValue.style.cssText = `
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        color: white;
        background-color: ${dayInfo.hex};
      `;
      currentDayValue.textContent = serviceDay || 'Unassigned';
      currentDayDiv.appendChild(currentDayValue);
      popupContainer.appendChild(currentDayDiv);

      // Day selector buttons
      const selectorDiv = document.createElement('div');
      selectorDiv.className = 'mt-2 pt-2 border-t';
      const selectorLabel = document.createElement('p');
      selectorLabel.className = 'text-xs text-gray-500 mb-2';
      selectorLabel.textContent = 'Assign to:';
      selectorDiv.appendChild(selectorLabel);
      
      const buttonsGrid = document.createElement('div');
      buttonsGrid.style.cssText = 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;';
      
      DAYS_OF_WEEK.forEach(day => {
        const btn = document.createElement('button');
        const isSelected = serviceDay === day;
        btn.style.cssText = `
          padding: 4px 6px;
          font-size: 10px;
          border-radius: 4px;
          border: ${isSelected ? '2px solid #1f2937' : '1px solid #e5e7eb'};
          background-color: ${isSelected ? DAY_COLORS[day].hex : '#f9fafb'};
          color: ${isSelected ? 'white' : '#374151'};
          cursor: pointer;
          transition: all 0.15s;
        `;
        btn.textContent = DAY_COLORS[day].label;
        btn.onclick = (e) => {
          e.stopPropagation();
          updateServiceDay(customer.id, isSelected ? null : day);
        };
        btn.onmouseenter = () => {
          if (!isSelected) {
            btn.style.backgroundColor = DAY_COLORS[day].hex;
            btn.style.color = 'white';
          }
        };
        btn.onmouseleave = () => {
          if (!isSelected) {
            btn.style.backgroundColor = '#f9fafb';
            btn.style.color = '#374151';
          }
        };
        buttonsGrid.appendChild(btn);
      });
      
      // Clear button
      const clearBtn = document.createElement('button');
      clearBtn.style.cssText = `
        padding: 4px 6px;
        font-size: 10px;
        border-radius: 4px;
        border: 1px solid #e5e7eb;
        background-color: #f9fafb;
        color: #6b7280;
        cursor: pointer;
      `;
      clearBtn.textContent = 'Clear';
      clearBtn.onclick = (e) => {
        e.stopPropagation();
        updateServiceDay(customer.id, null);
      };
      buttonsGrid.appendChild(clearBtn);
      
      selectorDiv.appendChild(buttonsGrid);
      popupContainer.appendChild(selectorDiv);

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        maxWidth: '280px'
      }).setDOMContent(popupContainer);

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
      bounds.extend(coordinates);
      markersAdded++;
    });

    // Only fit bounds on initial load or filter changes, not on day assignment updates
    if (markersAdded > 0 && !bounds.isEmpty() && shouldFitBounds) {
      map.current!.fitBounds(bounds, { padding: 50 });
    }
    // Reset the flag after first render
    setShouldFitBounds(false);
  }, [filteredCustomers, serviceDetails, potentialCustomerIds, mapLoaded]);

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

  // Count customers per day
  const dayCounts = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = cleaningCustomers.filter(c => serviceDetails.get(c.id) === day).length;
    return acc;
  }, {} as Record<string, number>);
  const unassignedCount = cleaningCustomers.filter(c => !serviceDetails.get(c.id)).length;

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
              </p>
              <div className="space-y-2">
                <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
                <Input
                  id="mapbox-token"
                  type="text"
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
    <div className="space-y-4">
      {/* Day Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by Service Day</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedDay === null ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShouldFitBounds(true);
                setSelectedDay(null);
              }}
              className="text-xs"
            >
              All ({cleaningCustomers.length})
            </Button>
            {DAYS_OF_WEEK.map(day => (
              <Button
                key={day}
                variant={selectedDay === day ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShouldFitBounds(true);
                  setSelectedDay(selectedDay === day ? null : day);
                }}
                className="text-xs"
                style={{
                  backgroundColor: selectedDay === day ? DAY_COLORS[day].hex : undefined,
                  borderColor: DAY_COLORS[day].hex,
                  color: selectedDay === day ? 'white' : DAY_COLORS[day].hex,
                }}
              >
                {DAY_COLORS[day].label} ({dayCounts[day]})
              </Button>
            ))}
            <Button
              variant={selectedDay === 'Unassigned' ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShouldFitBounds(true);
                setSelectedDay(selectedDay === 'Unassigned' ? null : 'Unassigned');
              }}
              className="text-xs"
              style={{
                backgroundColor: selectedDay === 'Unassigned' ? DAY_COLORS.Unassigned.hex : undefined,
                borderColor: DAY_COLORS.Unassigned.hex,
                color: selectedDay === 'Unassigned' ? 'white' : DAY_COLORS.Unassigned.hex,
              }}
            >
              Unassigned ({unassignedCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-muted-foreground font-medium">Legend:</span>
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: DAY_COLORS[day].hex }}
            />
            <span>{day}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: DAY_COLORS.Unassigned.hex }}
          />
          <span>Unassigned</span>
        </div>
        <div className="flex items-center gap-1 ml-2 pl-2 border-l">
          <div className="w-3 h-3 rounded-full border-2 border-amber-400 bg-gray-400" />
          <span>Potential Customer</span>
        </div>
      </div>

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
              {filteredCustomers.filter(c => c.latitude && c.longitude).length} customers shown
            </span>
          </div>
        </div>
      </div>

      {/* Customer List by Day */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Cleaning Customers by Day
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {DAYS_OF_WEEK.map(day => {
              const dayCustomers = cleaningCustomers.filter(c => serviceDetails.get(c.id) === day);
              if (dayCustomers.length === 0 && selectedDay && selectedDay !== day) return null;
              
              return (
                <div key={day} className="space-y-2">
                  <div 
                    className="flex items-center gap-2 p-2 rounded-lg"
                    style={{ backgroundColor: `${DAY_COLORS[day].hex}15` }}
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: DAY_COLORS[day].hex }}
                    />
                    <span className="font-medium text-sm">{day}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      ({dayCustomers.length})
                    </span>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {dayCustomers.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic px-2">No customers</p>
                    ) : (
                      dayCustomers.map(customer => (
                        <div 
                          key={customer.id}
                          className="text-xs p-2 rounded bg-muted/50 hover:bg-muted transition-colors cursor-pointer flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {customer.first_name} {customer.last_name}
                            </p>
                            {customer.address && (
                              <p className="text-muted-foreground truncate">
                                {customer.address}
                              </p>
                            )}
                          </div>
                          {potentialCustomerIds.includes(customer.id) && (
                            <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                              Potential
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Unassigned */}
            {(() => {
              const unassignedCustomers = cleaningCustomers.filter(c => !serviceDetails.get(c.id));
              if (unassignedCustomers.length === 0 && selectedDay && selectedDay !== 'Unassigned') return null;
              
              return (
                <div className="space-y-2">
                  <div 
                    className="flex items-center gap-2 p-2 rounded-lg"
                    style={{ backgroundColor: `${DAY_COLORS.Unassigned.hex}15` }}
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: DAY_COLORS.Unassigned.hex }}
                    />
                    <span className="font-medium text-sm">Unassigned</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      ({unassignedCustomers.length})
                    </span>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {unassignedCustomers.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic px-2">No customers</p>
                    ) : (
                      unassignedCustomers.map(customer => (
                        <div 
                          key={customer.id}
                          className="text-xs p-2 rounded bg-muted/50 hover:bg-muted transition-colors cursor-pointer flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {customer.first_name} {customer.last_name}
                            </p>
                            {customer.address && (
                              <p className="text-muted-foreground truncate">
                                {customer.address}
                              </p>
                            )}
                          </div>
                          {potentialCustomerIds.includes(customer.id) && (
                            <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                              Potential
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CleaningCustomerMap;