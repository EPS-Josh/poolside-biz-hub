import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface EquipmentDataScraperProps {
  onEquipmentDataFetched: (equipment: { 
    pumps: { [type: string]: string[] };
    filters: { [type: string]: string[] };
    heaters: { [type: string]: string[] };
  }) => void;
}

export const EquipmentDataScraper = ({ onEquipmentDataFetched }: EquipmentDataScraperProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const scrapeEquipmentData = async () => {
    setIsLoading(true);
    toast.info('Fetching equipment data from manufacturer websites...');
    
    try {
      // Simulate fetching data from manufacturer websites
      // In a real implementation, you would use web scraping or APIs
      
      const mockEquipmentData = {
        pumps: {
          'Variable Speed': [
            'Pentair IntelliFlo VSF 3HP',
            'Pentair IntelliFlo3 VSF 3HP',
            'Hayward TriStar VS 2.7HP',
            'Hayward MaxFlo VS 2HP',
            'Jandy FloPro VS 2.7HP',
            'Sta-Rite IntelliPro VSF 3HP'
          ],
          'Single Speed': [
            'Pentair SuperFlo 1HP',
            'Pentair SuperFlo 1.5HP',
            'Hayward Super Pump 1HP',
            'Hayward Super Pump 1.5HP',
            'Hayward Matrix 1HP',
            'Sta-Rite Dura-Glas 1HP',
            'Jandy FloPro 1.5HP'
          ],
          'Dual Speed': [
            'Pentair SuperFlo Dual Speed 1HP',
            'Hayward Super Pump Dual Speed 1HP',
            'Sta-Rite Dura-Glas II Dual Speed 1HP'
          ]
        },
        filters: {
          'Sand Filter': [
            'Pentair Sand Dollar SD-40',
            'Pentair Sand Dollar SD-60',
            'Hayward Pro Series S244T',
            'Hayward Pro Series S310T',
            'Jandy JS48',
            'Jandy JS60',
            'Sta-Rite Cristal-Flo II T-40'
          ],
          'Cartridge Filter': [
            'Pentair Clean & Clear 150',
            'Pentair Clean & Clear 200',
            'Hayward Star-Clear C150',
            'Hayward Star-Clear C200',
            'Jandy CV460',
            'Jandy CV580',
            'Sta-Rite System:3 S7M120'
          ],
          'DE Filter': [
            'Pentair FNS Plus 48',
            'Pentair FNS Plus 60',
            'Hayward Perflex EC40',
            'Hayward Perflex EC50',
            'Jandy DEV48',
            'Jandy DEV60'
          ]
        },
        heaters: {
          'Gas Heater': [
            'Pentair MasterTemp 125K BTU',
            'Pentair MasterTemp 200K BTU',
            'Pentair MasterTemp 400K BTU',
            'Hayward H150FD 150K BTU',
            'Hayward H200FD 200K BTU',
            'Hayward H400FD 400K BTU',
            'Jandy LXi250N 250K BTU',
            'Jandy LXi400N 400K BTU',
            'Raypak Digital 156A 156K BTU',
            'Raypak Digital 266A 266K BTU'
          ],
          'Heat Pump': [
            'Pentair UltraTemp 70 Heat Pump',
            'Pentair UltraTemp 90 Heat Pump',
            'Pentair UltraTemp 120 Heat Pump',
            'Hayward HeatPro HP21104T 110K BTU',
            'Hayward HeatPro HP21404T 140K BTU',
            'Jandy EnergyGuard Variable Speed',
            'AquaCal Heat Wave SuperQuiet SQ120',
            'AquaCal Heat Wave SuperQuiet SQ175'
          ],
          'Electric Heater': [
            'Pentair Electric Spa Heater 11kW',
            'Pentair Electric Spa Heater 15kW',
            'Hayward CSPAXI11 11kW Electric',
            'Hayward CSPAXI15 15kW Electric',
            'Watkins Electric Heater 4kW',
            'Balboa Electric Heater 5.5kW'
          ],
          'Solar Heater': [
            'Pentair SolarTouch Control System',
            'Hayward Solar Panel HP2040',
            'FAFCO Solar Bear Economy System',
            'SunGrabber Solar Panel 2x20',
            'Heliocol Solar Panel HC-40'
          ]
        }
      };

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onEquipmentDataFetched(mockEquipmentData);
      toast.success('Equipment data loaded successfully!');
      
    } catch (error) {
      console.error('Error fetching equipment data:', error);
      toast.error('Failed to fetch equipment data. Using default options.');
      
      // Provide fallback data
      onEquipmentDataFetched({
        pumps: {},
        filters: {},
        heaters: {}
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={scrapeEquipmentData} 
      disabled={isLoading}
      variant="outline"
      className="w-full"
    >
      {isLoading ? 'Loading Equipment Data...' : 'Load Equipment Data from Web'}
    </Button>
  );
};