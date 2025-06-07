
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ValveDataScraper } from '@/components/ValveDataScraper';
import { Settings } from 'lucide-react';

interface ProductDataCardProps {
  valveData: { [manufacturer: string]: string[] };
  onValveDataFetched: (valves: { [manufacturer: string]: string[] }) => void;
}

export const ProductDataCard = ({ valveData, onValveDataFetched }: ProductDataCardProps) => {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Product Data Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Valve Data</h3>
          <p className="text-sm text-gray-600 mb-4">
            Load product data from manufacturer websites to use in service forms.
          </p>
          <ValveDataScraper onValveDataFetched={onValveDataFetched} />
          
          {Object.keys(valveData).length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Loaded Valve Data:</h4>
              {Object.entries(valveData).map(([manufacturer, valves]) => (
                <div key={manufacturer} className="mb-2">
                  <span className="font-medium text-gray-700">{manufacturer}:</span>
                  <span className="ml-2 text-gray-600">{valves.length} valves loaded</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
