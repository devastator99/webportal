
import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Define the custom PushSubscription type to match the browser's PushSubscription
interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

// Define our own PushSubscription type that matches what we expect
interface CustomPushSubscription {
  endpoint: string;
  keys: PushSubscriptionKeys;
  unsubscribe?: () => Promise<boolean>;
}

// Define notification preferences type
interface NotificationPreferences {
  id?: string;
  user_id?: string;
  health_plan_enabled: boolean;
  appointment_enabled: boolean;
  medication_enabled: boolean;
  general_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  created_at?: string;
  updated_at?: string;
}

// Define the context type
interface NotificationContextType {
  isLoading: boolean;
  isSubscribed: boolean;
  subscription: CustomPushSubscription | null;
  permissionState: NotificationPermission;
  preferences: NotificationPreferences;
  subscribeToPushNotifications: () => Promise<void>;
  unsubscribeFromPushNotifications: () => Promise<void>;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
}

// Create context with default values
const NotificationContext = createContext<NotificationContextType>({
  isLoading: true,
  isSubscribed: false,
  subscription: null,
  permissionState: 'default',
  preferences: {
    health_plan_enabled: true,
    appointment_enabled: true,
    medication_enabled: true,
    general_enabled: true,
    quiet_hours_start: null,
    quiet_hours_end: null,
  },
  subscribeToPushNotifications: async () => {},
  unsubscribeFromPushNotifications: async () => {},
  updatePreferences: async () => {},
});

// Provider component
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<CustomPushSubscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    health_plan_enabled: true,
    appointment_enabled: true,
    medication_enabled: true,
    general_enabled: true,
    quiet_hours_start: null,
    quiet_hours_end: null,
  });

  // Initialize the service worker
  useEffect(() => {
    const initialize = async () => {
      try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          // Register service worker
          const registration = await navigator.serviceWorker.register('/push-notification-sw.js');
          setSwRegistration(registration);
          console.log('Service Worker registered successfully', registration);

          // Check permission state
          const permission = Notification.permission as NotificationPermission;
          setPermissionState(permission);

          // Check if already subscribed
          if (permission === 'granted') {
            const existingSub = await registration.pushManager.getSubscription();
            if (existingSub) {
              // Convert browser's PushSubscription to our CustomPushSubscription
              const customSub: CustomPushSubscription = {
                endpoint: existingSub.endpoint,
                keys: {
                  p256dh: '',
                  auth: ''
                },
                unsubscribe: existingSub.unsubscribe.bind(existingSub)
              };
              
              // Extract the keys (p256dh and auth) from the subscription
              const subJson = existingSub.toJSON();
              if (subJson.keys) {
                customSub.keys.p256dh = subJson.keys.p256dh;
                customSub.keys.auth = subJson.keys.auth;
              }
              
              setSubscription(customSub);
              setIsSubscribed(true);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Fetch user preferences from the database
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is the error code for no rows returned
          console.error('Error fetching notification preferences:', error);
          return;
        }

        if (data) {
          setPreferences(data);
        } else {
          // Create default preferences if none exist
          const { data: newPrefs, error: insertError } = await supabase
            .from('notification_preferences')
            .insert({
              user_id: user.id,
              health_plan_enabled: true,
              appointment_enabled: true,
              medication_enabled: true,
              general_enabled: true,
              quiet_hours_start: null,
              quiet_hours_end: null,
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating default notification preferences:', insertError);
            return;
          }

          if (newPrefs) {
            setPreferences(newPrefs);
          }
        }
      } catch (error) {
        console.error('Error in preferences fetch:', error);
      }
    };

    fetchPreferences();
  }, [user]);

  // Subscribe to push notifications
  const subscribeToPushNotifications = useCallback(async () => {
    if (!swRegistration || !user) return;

    try {
      setIsLoading(true);

      // Request permission if not granted
      if (permissionState !== 'granted') {
        const permission = await Notification.requestPermission();
        setPermissionState(permission);
        if (permission !== 'granted') {
          throw new Error('Permission not granted for Notification');
        }
      }

      // Get VAPID public key from Edge Function
      const vapidResponse = await fetch(`${supabase.functions.url}/get-vapid-public-key`);
      const { vapidPublicKey } = await vapidResponse.json();
      
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not available');
      }

      // Convert base64 string to Uint8Array for the subscription
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push notifications
      const pushSubscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // Convert browser's PushSubscription to our CustomPushSubscription
      const subJson = pushSubscription.toJSON();
      const customSub: CustomPushSubscription = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh || '',
          auth: subJson.keys?.auth || ''
        },
        unsubscribe: pushSubscription.unsubscribe.bind(pushSubscription)
      };

      // Save subscription to state
      setSubscription(customSub);
      setIsSubscribed(true);

      // Save subscription to database
      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: user.id,
        endpoint: customSub.endpoint,
        p256dh: customSub.keys.p256dh,
        auth: customSub.keys.auth,
      });

      if (error) {
        console.error('Error saving push subscription:', error);
        throw error;
      }

      toast.success('Push notifications enabled');
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast.error('Failed to enable notifications. Please try again.');
      
      // Cleanup failed subscription
      if (subscription && subscription.unsubscribe) {
        try {
          await subscription.unsubscribe();
        } catch (unsubError) {
          console.error('Error unsubscribing after failure:', unsubError);
        }
      }
      
      setSubscription(null);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, [swRegistration, user, permissionState, subscription]);

  // Unsubscribe from push notifications
  const unsubscribeFromPushNotifications = useCallback(async () => {
    if (!subscription || !user) return;

    try {
      setIsLoading(true);

      // Unsubscribe from push manager
      if (subscription.unsubscribe) {
        await subscription.unsubscribe();
      }

      // Delete subscription from database
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', subscription.endpoint)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting push subscription:', error);
        throw error;
      }

      // Update state
      setSubscription(null);
      setIsSubscribed(false);
      toast.success('Push notifications disabled');
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast.error('Failed to disable notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [subscription, user]);

  // Update notification preferences
  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!user) return;

    try {
      // Update local state optimistically
      setPreferences(prev => ({ ...prev, ...updates }));

      // Update in database
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          ...updates,
        });

      if (error) {
        console.error('Error updating notification preferences:', error);
        throw error;
      }

      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      toast.error('Failed to update preferences. Please try again.');
      
      // Revert local state on error
      setPreferences(prevState => ({ ...prevState }));
    }
  }, [user, preferences]);

  return (
    <NotificationContext.Provider
      value={{
        isLoading,
        isSubscribed,
        subscription,
        permissionState,
        preferences,
        subscribeToPushNotifications,
        unsubscribeFromPushNotifications,
        updatePreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Helper function to convert base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// Custom hook to use the notification context
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
