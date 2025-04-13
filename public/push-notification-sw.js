
// Push notification service worker

self.addEventListener('install', event => {
  console.log('Push notification service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Push notification service worker activated');
  return self.clients.claim();
});

self.addEventListener('push', event => {
  console.log('Push notification received:', event);

  if (!event.data) {
    console.log('No payload in push notification');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Notification data:', data);

    const title = data.title || 'Anubhuti Health';
    const options = {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      badge: data.badge,
      image: data.image,
      tag: data.tag || 'default',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: true,
      silent: false
    };

    // Record the notification for analytics
    if (data.data && data.data.userId && data.data.subscriptionId) {
      // We'd log delivery here if we had a direct method
      // For now, we'll just show the notification
    }

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Error processing push notification:', error);
  }
});

self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  // Track notification click
  const data = event.notification.data || {};
  const userId = data.userId;
  const subscriptionId = data.subscriptionId;
  const url = data.url || '/';
  const clickAction = event.action || 'default';

  // Open the appropriate URL based on click action
  let targetUrl = url;
  if (clickAction !== 'default' && event.notification.actions) {
    const clickedAction = event.notification.actions.find(a => a.action === clickAction);
    if (clickedAction && clickedAction.url) {
      targetUrl = clickedAction.url;
    }
  }

  event.waitUntil(
    clients.matchAll({type: 'window'}).then(windowClients => {
      // Check if there is already a window open with the target URL
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('pushsubscriptionchange', event => {
  console.log('Push subscription changed:', event);
  
  // This event is fired when the subscription has been changed or expired
  // We should resubscribe the user
  
  // In production, you would implement a resubscription logic here
  console.log('Subscription needs renewal');
});
