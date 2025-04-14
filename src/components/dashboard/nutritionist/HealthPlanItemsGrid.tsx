
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HealthPlanItem } from '@/interfaces/HealthPlan';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  PenSquare, 
  Trash2, 
  Loader2, 
  Utensils, 
  Dumbbell, 
  Pill 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HealthPlanItemDialog } from './HealthPlanItemDialog';

interface HealthPlanItemsGridProps {
  patientId: string;
}

export const HealthPlanItemsGrid = ({ patientId }: HealthPlanItemsGridProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<HealthPlanItem | null>(null);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'delete' | null>(null);

  // Fetch health plan items for this patient
  const { data: healthPlanItems = [], isLoading } = useQuery({
    queryKey: ['health_plan_items', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_plan_items')
        .select('*')
        .eq('patient_id', patientId);
        
      if (error) {
        console.error('Error fetching health plan items:', error);
        toast({
          title: 'Error',
          description: 'Failed to load health plan items',
          variant: 'destructive'
        });
        return [];
      }
      
      return data as HealthPlanItem[];
    }
  });

  // Delete mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('health_plan_items')
        .delete()
        .eq('id', itemId);
        
      if (error) throw error;
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health_plan_items', patientId] });
      toast({
        title: 'Success',
        description: 'Health plan item deleted successfully',
      });
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Error deleting health plan item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete health plan item',
        variant: 'destructive'
      });
    }
  });

  const handleView = (item: HealthPlanItem) => {
    setSelectedItem(item);
    setDialogMode('view');
  };

  const handleEdit = (item: HealthPlanItem) => {
    setSelectedItem(item);
    setDialogMode('edit');
  };

  const handleDelete = (item: HealthPlanItem) => {
    setSelectedItem(item);
    setDialogMode('delete');
  };

  const handleCloseDialog = () => {
    setSelectedItem(null);
    setDialogMode(null);
  };

  const confirmDelete = () => {
    if (selectedItem?.id) {
      deleteItemMutation.mutate(selectedItem.id);
    }
  };

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'food':
        return <Utensils className="h-4 w-4 text-green-500" />;
      case 'exercise':
        return <Dumbbell className="h-4 w-4 text-blue-500" />;
      case 'medication':
        return <Pill className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Health Plan Items</h3>
      
      {healthPlanItems.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">
          No health plan items found for this patient
        </p>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {healthPlanItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {renderTypeIcon(item.type)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell>{item.scheduled_time}</TableCell>
                  <TableCell>{item.frequency}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleView(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(item)}
                      >
                        <PenSquare className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:text-destructive" 
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* View/Edit Dialog */}
      {selectedItem && (dialogMode === 'view' || dialogMode === 'edit') && (
        <HealthPlanItemDialog
          isOpen={true}
          onClose={handleCloseDialog}
          item={selectedItem}
          mode={dialogMode}
          patientId={patientId}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      {selectedItem && dialogMode === 'delete' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-2">Confirm Deletion</h3>
            <p className="mb-4">
              Are you sure you want to delete this health plan item? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={deleteItemMutation.isPending}
              >
                {deleteItemMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
