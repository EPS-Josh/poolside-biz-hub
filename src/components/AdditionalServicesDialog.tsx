import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

export interface AdditionalService {
  id: string;
  name: string;
  price: string;
  description: string;
  weeklyAddOn?: number;
}

interface AdditionalServicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tierName: string;
  weeklyRate: number;
  onContinue: (selectedServices: AdditionalService[]) => void;
}

const additionalServicesOptions: AdditionalService[] = [
  { 
    id: "spa-hot-tub", 
    name: "Spa/Hot Tub Add-on", 
    price: "+$10/week", 
    description: "Full spa maintenance included with weekly service",
    weeklyAddOn: 10
  },
  { 
    id: "water-features", 
    name: "Standalone Water Features", 
    price: "+$10/week", 
    description: "Fountains, waterfalls, and decorative water features",
    weeklyAddOn: 10
  },
];

export const AdditionalServicesDialog = ({
  open,
  onOpenChange,
  tierName,
  weeklyRate,
  onContinue,
}: AdditionalServicesDialogProps) => {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const handleToggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleContinue = () => {
    const selected = additionalServicesOptions.filter((service) =>
      selectedServices.includes(service.id)
    );
    onContinue(selected);
  };

  const calculateTotalWeekly = () => {
    const addOns = selectedServices.reduce((total, serviceId) => {
      const service = additionalServicesOptions.find((s) => s.id === serviceId);
      return total + (service?.weeklyAddOn || 0);
    }, 0);
    return weeklyRate + addOns;
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedServices([]);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Additional Services</DialogTitle>
          <DialogDescription>
            You've selected {tierName} at ${weeklyRate}/week. Would you like to add any additional services?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {additionalServicesOptions.map((service) => (
            <div
              key={service.id}
              className="flex items-start space-x-3 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={service.id}
                checked={selectedServices.includes(service.id)}
                onCheckedChange={() => handleToggleService(service.id)}
              />
              <div className="flex-1">
                <Label
                  htmlFor={service.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span className="font-medium">{service.name}</span>
                  <Badge variant="secondary">{service.price}</Badge>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Estimated Weekly Total:</span>
          <span className="text-lg font-bold">${calculateTotalWeekly()}/week</span>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleContinue} className="gap-2">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
