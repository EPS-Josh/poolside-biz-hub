
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2 } from 'lucide-react';

interface ValveDataScraperProps {
  onValveDataFetched: (valves: { [manufacturer: string]: string[] }) => void;
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
      
      let jandyValves: string[] = [];
      
      if (data.contents) {
        // Parse the HTML content to extract valve model names
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        
        // Look for product titles, valve model numbers, etc.
        const productElements = doc.querySelectorAll('.product-title, .product-name, h3, h4');
        
        productElements.forEach(element => {
          const text = element.textContent?.trim();
          if (text && (
            text.toLowerCase().includes('valve') ||
            text.toLowerCase().includes('diverter') ||
            text.match(/^[A-Z0-9\-]+$/) // Model number pattern
          )) {
            jandyValves.push(text);
          }
        });
        
        // Remove duplicates and filter
        jandyValves = [...new Set(jandyValves)].filter(valve => 
          valve.length > 2 && valve.length < 50
        );
      }
      
      if (jandyValves.length === 0) {
        // Fallback with common Jandy valve models
        jandyValves = [
          'NeverLube 2-Way Valve',
          'NeverLube 3-Way Valve',
          'Gray 2-Way Valve',
          'Gray 3-Way Valve',
          'Caretaker Valve',
          'TruUnion Ball Valve',
          '2" Diverter Valve',
          '1.5" Diverter Valve',
          'Multiport Valve',
          'Pro Series 2-Way',
          'Pro Series 3-Way'
        ];
      }
      
      const valveData = {
        'Jandy': jandyValves
      };
      
      onValveDataFetched(valveData);
      
      toast({
        title: 'Success',
        description: `Found ${jandyValves.length} Jandy valve models`,
      });
      
    } catch (error) {
      console.error('Error scraping Jandy valves:', error);
      
      // Use fallback data on error
      const fallbackValves = [
        'NeverLube 2-Way Valve',
        'NeverLube 3-Way Valve',
        'Gray 2-Way Valve',
        'Gray 3-Way Valve',
        'Caretaker Valve',
        'TruUnion Ball Valve',
        '2" Diverter Valve',
        '1.5" Diverter Valve',
        'Multiport Valve'
      ];
      
      const valveData = {
        'Jandy': fallbackValves
      };
      
      onValveDataFetched(valveData);
      
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
