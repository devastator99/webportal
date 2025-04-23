import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface WhatsAppStyleChatInterfaceProps {
  patientRoomId?: string | null;
}

export const WhatsAppStyleChatInterface: React.FC<WhatsAppStyleChatInterfaceProps> = ({ patientRoomId }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePrescriptionsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      navigate('/prescriptions');
      toast({
        title: "Loading prescriptions",
        description: "Opening your prescription history...",
      });
    } catch (error) {
      console.error("Navigation error:", error);
      toast({
        title: "Navigation error",
        description: "Could not navigate to prescriptions page. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end p-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="mr-2 flex items-center"
          onClick={handlePrescriptionsClick}
        >
          <FileText className="mr-2 h-4 w-4" />
          My Prescriptions
        </Button>
      </div>
    </div>
  );
};
