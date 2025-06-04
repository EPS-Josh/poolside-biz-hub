
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2 } from 'lucide-react';

interface ValveDataScraperProps {
  onValveDataFetched: (valves: string[]) => void;
}

export const ValveDataScraper = ({ onValveDataFetched }: ValveDataScraperProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const scrapeJandyValves = async () => {
    setIsLoading(true);
    
    try {
      // Using a simple approach to scrape Jandy's valve products
      const jandyUrl = 'https://www.jandy.com/en/products/valves-and-fittings';
      
      const response = await fetch(`https://api.allorigins.org/get?url=${encodeURIComponent(jandyUrl)}`);
      const data = await response.json();
      
      if (data.contents) {
        // Parse the HTML content to extract valve model names
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        
        // Look for product titles, valve model numbers, etc.
        const productElements = doc.querySelectorAll('.product-title, .product-name, h3, h4');
        const valveModels: string[] = [];
        
        productElements.forEach(element => {
          const text = element.textContent?.trim();
          if (text && (
            text.toLowerCase().includes('valve') ||
            text.toLowerCase().includes('diverter') ||
            text.match(/^[A-Z0-9\-]+$/) // Model number pattern
          )) {
            valveModels.push(text);
          }
        });
        
        // Remove duplicates and filter
        const uniqueValves = [...new Set(valveModels)].filter(valve => 
          valve.length > 2 && valve.length < 50
        );
        
        if (uniqueValves.length > 0) {
          onValveDataFetched(uniqueValves);
          toast({
            title: 'Success',
            description: `Found ${uniqueValves.length} Jandy valve models`,
          });
        } else {
          // Fallback with common Jandy valve models
          const fallbackValves = [
            'Jandy NeverLube 2-Way Valve',
            'Jandy NeverLube 3-Way Valve',
            'Jandy Gray 2-Way Valve',
            'Jandy Gray 3-Way Valve',
            'Jandy Caretaker Valve',
            'Jandy TruUnion Ball Valve',
            'Jandy 2" Diverter Valve',
            'Jandy 1.5" Diverter Valve',
            'Jandy Multiport Valve'
          ];
          onValveDataFetched(fallbackValves);
          toast({
            title: 'Fallback Data Used',
            description: `Used ${fallbackValves.length} common Jandy valve models`,
          });
        }
      }
    } catch (error) {
      console.error('Error scraping Jandy valves:', error);
      
      // Use fallback data on error
      const fallbackValves = [
        'Jandy NeverLube 2-Way Valve',
        'Jandy NeverLube 3-Way Valve',
        'Jandy Gray 2-Way Valve',
        'Jandy Gray 3-Way Valve',
        'Jandy Caretaker Valve',
        'Jandy TruUnion Ball Valve',
        'Jandy 2" Diverter Valve',
        'Jandy 1.5" Diverter Valve',
        'Jandy Multiport Valve'
      ];
      onValveDataFetched(fallbackValves);
      
      toast({
        title: 'Using Fallback Data',
        description: `Loaded ${fallbackValves.length} common Jandy valve models`,
        variant: 'default',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={scrapeJandyValves}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="mb-2"
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
      ) : (
        <Download className="h-3 w-3 mr-1" />
      )}
      {isLoading ? 'Loading...' : 'Load Jandy Valves'}
    </Button>
  );
};
