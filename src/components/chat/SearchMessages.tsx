
import React, { useState, useEffect } from 'react';
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Brain } from "lucide-react";

interface SearchMessagesProps {
  messages: any[];
  onMessageClick: (messageId: string) => void;
  isOpen: boolean;
}

export const SearchMessages = ({ messages, onMessageClick, isOpen }: SearchMessagesProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMessages, setFilteredMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMessages([]);
      return;
    }

    const results = messages.filter(message =>
      message.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredMessages(results);
  }, [searchTerm, messages]);

  if (!isOpen) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="absolute inset-0 bg-background border-l flex flex-col">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {searchTerm && (
          <div className="p-2 text-sm text-muted-foreground">
            {filteredMessages.length} {filteredMessages.length === 1 ? 'message' : 'messages'} found
          </div>
        )}
        
        <div className="space-y-2 p-2">
          {filteredMessages.map((message) => {
            const messageDate = new Date(message.created_at);
            const isAi = message.is_ai_message || message.sender_id === '00000000-0000-0000-0000-000000000000';

            return (
              <div
                key={message.id}
                className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded-lg cursor-pointer"
                onClick={() => onMessageClick(message.id)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={isAi ? 'bg-purple-100 text-purple-800' : 'bg-primary/10'}>
                    {isAi ? (
                      <Brain className="h-4 w-4" />
                    ) : (
                      getInitials(message.sender_name || 'User')
                    )}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {message.sender_name || 'Unknown'}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {message.sender_role}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {message.message}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {format(messageDate, 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
