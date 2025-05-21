
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
      // Make an RPC call to the delete_room_message function with explicit type casting
      // since it's not in the generated types
      const { data, error } = await supabase.rpc('delete_room_message', {
        p_message_id: messageId,
      } as any);

      if (error) {
        throw error;
      }

      if (data) {
        toast({
          title: "Message deleted",
          description: "Your message has been deleted successfully.",
        });
        onDeleteSuccess();
      } else {
        toast({
          title: "Failed to delete message",
          description: "The message could not be deleted.",
          variant: "destructive",
        });
      }
    } catch (error) {
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Message</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this message? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
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
