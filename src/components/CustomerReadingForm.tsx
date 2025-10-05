import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

const readingSchema = z.object({
  reading_date: z.string().min(1, "Date is required"),
  reading_time: z.string().min(1, "Time is required"),
  total_hardness: z.string().optional(),
  total_chlorine_bromine: z.string().optional(),
  free_chlorine: z.string().optional(),
  ph: z.string().optional(),
  total_alkalinity: z.string().optional(),
  cyanuric_acid: z.string().optional(),
  notes: z.string().optional(),
});

type ReadingFormValues = z.infer<typeof readingSchema>;

interface CustomerReadingFormProps {
  customerId: string;
  onSuccess: () => void;
}

export function CustomerReadingForm({ customerId, onSuccess }: CustomerReadingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReadingFormValues>({
    resolver: zodResolver(readingSchema),
    defaultValues: {
      reading_date: new Date().toISOString().split('T')[0],
      reading_time: new Date().toTimeString().slice(0, 5),
      total_hardness: "",
      total_chlorine_bromine: "",
      free_chlorine: "",
      ph: "",
      total_alkalinity: "",
      cyanuric_acid: "",
      notes: "",
    },
  });

  const onSubmit = async (data: ReadingFormValues) => {
    setIsSubmitting(true);
    try {
      const readings = {
        total_hardness: data.total_hardness || null,
        total_chlorine_bromine: data.total_chlorine_bromine || null,
        free_chlorine: data.free_chlorine || null,
        ph: data.ph || null,
        total_alkalinity: data.total_alkalinity || null,
        cyanuric_acid: data.cyanuric_acid || null,
      };

      const { error } = await supabase.from("customer_readings").insert({
        customer_id: customerId,
        reading_date: data.reading_date,
        reading_time: data.reading_time,
        readings,
        notes: data.notes || null,
      });

      if (error) throw error;

      toast.success("Reading submitted successfully!");
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error("Error submitting reading:", error);
      toast.error("Failed to submit reading: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Submit New Reading
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reading_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reading_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="total_hardness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Hardness (ppm)</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="e.g., 250" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="total_chlorine_bromine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Chlorine/Bromine (ppm)</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="e.g., 3.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="free_chlorine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Free Chlorine (ppm)</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="e.g., 1.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ph"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>pH</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="e.g., 7.4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="total_alkalinity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Alkalinity (ppm)</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="e.g., 120" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cyanuric_acid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cyanuric Acid (ppm)</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="e.g., 30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any observations or notes about your pool/spa..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Reading"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
