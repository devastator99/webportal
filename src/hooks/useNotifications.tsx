
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  id?: string;
  health_plan_enabled: boolean;
  appointment_enabled: boolean;
  medication_enabled: boolean;
  general_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

// Define our custom subscription type that matches what we store in the database
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<PushSubscriptionData | null>(null);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [permissionState, setPermissionState] = useState<NotificationPermission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    health_plan_enabled: true,
    appointment_enabled: true,
    medication_enabled: true,
    general_enabled: true,
  });
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Function to get VAPID public key
  const getVapidPublicKey = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-vapid-public-key');
      if (error) throw error;
      
      if (data && data.vapidPublicKey) {
        setVapidPublicKey(data.vapidPublicKey);
        return data.vapidPublicKey;
      }
      return null;
    } catch (error) {
      console.error('Error getting VAPID public key:', error);
      toast({
        title: 'Error',
        description: 'Failed to get notification configuration',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Function to register service worker
  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported in this browser',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/push-notification-sw.js', {
        scope: '/',
      });
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      
      setServiceWorkerRegistration(registration);
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to register service worker for notifications',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Function to check current notification permission
  const checkPermission = useCallback(() => {
    if (!('Notification' in window)) {
      setPermissionState(null);
      return null;
    }
    
    const permission = Notification.permission;
    setPermissionState(permission);
    return permission;
  }, []);

  // Function to request notification permission
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Not Supported',
        description: 'Notifications are not supported in this browser',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      
      if (permission === 'granted') {
        return true;
      } else {
        toast({
          title: 'Permission Denied',
          description: 'You need to allow notification permission to receive alerts',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to request notification permission',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Function to convert base64 to Uint8Array
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  };

  // Function to subscribe to push notifications
  const subscribeToPushNotifications = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'You need to be logged in to enable notifications',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Get service worker registration
      let swRegistration = serviceWorkerRegistration;
      if (!swRegistration) {
        swRegistration = await registerServiceWorker();
        if (!swRegistration) {
          throw new Error('Failed to register service worker');
        }
      }
      
      // Check/request permission
      const permission = checkPermission();
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          throw new Error('Notification permission denied');
        }
      }
      
      // Get VAPID public key
      let publicKey = vapidPublicKey;
      if (!publicKey) {
        publicKey = await getVapidPublicKey();
        if (!publicKey) {
          throw new Error('Failed to get VAPID public key');
        }
      }
      
      // Get current subscription or create a new one
      let currentSubscription = await swRegistration.pushManager.getSubscription();
      
      if (!currentSubscription) {
        const convertedKey = urlBase64ToUint8Array(publicKey);
        
        currentSubscription = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      }
      
      // Convert browser PushSubscription to our PushSubscriptionData type
      const subscriptionJson = currentSubscription.toJSON();
      const subscriptionData: PushSubscriptionData = {
        endpoint: currentSubscription.endpoint,
        keys: {
          p256dh: subscriptionJson.keys.p256dh,
          auth: subscriptionJson.keys.auth
        }
      };
      
      // Save to state
      setSubscription(subscriptionData);
      
      // Save to database
      const { error } = await supabase.rpc('upsert_push_subscription', {
        p_endpoint: subscriptionData.endpoint,
        p_p256dh: subscriptionData.keys.p256dh,
        p_auth: subscriptionData.keys.auth,
        p_user_agent: navigator.userAgent,
      });
      
      if (error) throw error;
      
      setIsSubscribed(true);
      
      toast({
        title: 'Notifications Enabled',
        description: 'You will now receive important notifications',
      });
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: 'Subscription Failed',
        description: error.message || 'Failed to enable notifications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to unsubscribe from push notifications
  const unsubscribeFromPushNotifications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Get browser's push subscription
      let currentBrowserSubscription = null;
      if (serviceWorkerRegistration) {
        currentBrowserSubscription = await serviceWorkerRegistration.pushManager.getSubscription();
      }
      
      // If we have a browser subscription, unsubscribe from it
      if (currentBrowserSubscription) {
        await currentBrowserSubscription.unsubscribe();
      }
      
      // If we have our subscription data, delete it from the database
      if (subscription && subscription.endpoint) {
        await supabase.rpc('delete_push_subscription', {
          p_endpoint: subscription.endpoint,
        });
      }
      
      setSubscription(null);
      setIsSubscribed(false);
      
      toast({
        title: 'Notifications Disabled',
        description: 'You have unsubscribed from notifications',
      });
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to disable notifications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update notification preferences
  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.rpc('update_notification_preferences', {
        p_health_plan_enabled: newPreferences.health_plan_enabled,
        p_appointment_enabled: newPreferences.appointment_enabled,
        p_medication_enabled: newPreferences.medication_enabled,
        p_general_enabled: newPreferences.general_enabled,
        p_quiet_hours_start: newPreferences.quiet_hours_start,
        p_quiet_hours_end: newPreferences.quiet_hours_end,
      });
      
      if (error) throw error;
      
      setPreferences(prev => ({ ...prev, ...newPreferences }));
      
      toast({
        title: 'Preferences Updated',
        description: 'Your notification preferences have been saved',
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update preferences',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to load user's preferences
  const loadPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_user_notification_preferences');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setPreferences({
          id: data[0].id,
          health_plan_enabled: data[0].health_plan_enabled,
          appointment_enabled: data[0].appointment_enabled,
          medication_enabled: data[0].medication_enabled,
          general_enabled: data[0].general_enabled,
          quiet_hours_start: data[0].quiet_hours_start,
          quiet_hours_end: data[0].quiet_hours_end,
        });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  // Function to check if user is already subscribed
  const checkSubscriptionStatus = async () => {
    if (!user || !serviceWorkerRegistration) return;
    
    try {
      const browserSubscription = await serviceWorkerRegistration.pushManager.getSubscription();
      
      if (browserSubscription) {
        // Convert browser PushSubscription to our PushSubscriptionData format
        const subscriptionJson = browserSubscription.toJSON();
        const subscriptionData: PushSubscriptionData = {
          endpoint: browserSubscription.endpoint,
          keys: {
            p256dh: subscriptionJson.keys.p256dh,
            auth: subscriptionJson.keys.auth
          }
        };
        
        setSubscription(subscriptionData);
        setIsSubscribed(true);
        return true;
      } else {
        setSubscription(null);
        setIsSubscribed(false);
        return false;
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  };

  // Initialize notification system
  useEffect(() => {
    if (!user) return;
    
    // Setup in sequence
    const initNotifications = async () => {
      await getVapidPublicKey();
      await registerServiceWorker();
      checkPermission();
      await loadPreferences();
      await checkSubscriptionStatus();
    };
    
    initNotifications();
  }, [user, checkPermission]);

  // Return all notification-related functions and state
  return {
    isLoading,
    permissionState,
    isSubscribed,
    preferences,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    updatePreferences,
    requestPermission,
  };
};
