
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { HealthPlanItem } from '@/interfaces/HealthPlan';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface HealthPlanItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: HealthPlanItem;
  mode: 'view' | 'edit';
  patientId: string;
}

const healthPlanItemSchema = z.object({
  type: z.enum(['food', 'exercise', 'medication']),
  description: z.string().min(1, { message: 'Description is required' }),
  scheduled_time: z.string().min(1, { message: 'Schedule time is required' }),
  frequency: z.string().min(1, { message: 'Frequency is required' }),
  duration: z.string().nullable(),
});

export const HealthPlanItemDialog = ({ 
  isOpen, 
  onClose, 
  item, 
  mode,
  patientId
}: HealthPlanItemDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof healthPlanItemSchema>>({
    resolver: zodResolver(healthPlanItemSchema),
    defaultValues: {
      type: item.type,
      description: item.description,
      scheduled_time: item.scheduled_time,
      frequency: item.frequency,
      duration: item.duration || null,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof healthPlanItemSchema>) => {
      if (!user?.id) throw new Error("User not authenticated");
      if (!item.id) throw new Error("Item ID is missing");
      
      const { error } = await supabase
        .from('health_plan_items')
        .update({
          ...values,
          patient_id: patientId,
          nutritionist_id: user.id,
        })
        .eq('id', item.id);
        
      if (error) throw error;
      
      return { ...item, ...values };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health_plan_items', patientId] });
      toast({
        title: 'Success',
        description: 'Health plan item updated successfully',
      });
      onClose();
    },
    onError: (error) => {
      console.error('Error updating health plan item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update health plan item',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = async (values: z.infer<typeof healthPlanItemSchema>) => {
    if (mode === 'edit') {
      updateMutation.mutate(values);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'view' ? 'View Health Plan Item' : 'Edit Health Plan Item'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select 
                    disabled={mode === 'view'} 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="exercise">Exercise</SelectItem>
                      <SelectItem value="medication">Medication</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Description" 
                      {...field} 
                      readOnly={mode === 'view'} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="scheduled_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule Time</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Morning, 8:00 AM" 
                      {...field} 
                      readOnly={mode === 'view'} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Daily, Weekly" 
                      {...field} 
                      readOnly={mode === 'view'} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 30 minutes, 2 weeks" 
                      {...field} 
                      value={field.value || ''}
                      readOnly={mode === 'view'} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {mode === 'edit' && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            )}
            
            {mode === 'view' && (
              <DialogFooter>
                <Button type="button" onClick={onClose}>
                  Close
                </Button>
              </DialogFooter>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
