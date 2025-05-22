
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DeleteMessageDialogProps {
  messageId: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onDeleteSuccess: () => void;
}

export const DeleteMessageDialog = ({ messageId, isOpen, setIsOpen, onDeleteSuccess }: DeleteMessageDialogProps) => {
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      // Use type assertion to fix TypeScript error with RPC function
      const { data, error } = await supabase.rpc(
        'delete_room_message' as any, 
        {
          p_message_id: messageId
        }
      );

      if (error) {
        throw error;
      }

      toast({
        title: "Message deleted",
        description: "Your message has been deleted successfully.",
      });
      onDeleteSuccess();
    } catch (error: any) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while deleting the message.",
        variant: "destructive",
      });
    } finally {
      setIsOpen(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="max-w-[95%] sm:max-w-lg rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Message</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this message? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <AlertDialogCancel className="sm:mt-0">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
