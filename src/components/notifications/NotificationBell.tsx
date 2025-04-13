
import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const { isSubscribed, subscribeToPushNotifications, permissionState } = useNotifications();
  const navigate = useNavigate();
  
  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {isSubscribed ? (
            <Bell className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <BellOff className="h-[1.2rem] w-[1.2rem] text-muted-foreground" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!isSubscribed && permissionState !== 'denied' && (
          <DropdownMenuItem onClick={() => subscribeToPushNotifications()}>
            Enable Notifications
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => navigate('/notifications')}>
          Notification Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
