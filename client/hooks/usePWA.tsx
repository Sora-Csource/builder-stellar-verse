import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  isSupported: boolean;
  installApp: () => Promise<void>;
  showInstallPrompt: boolean;
  dismissInstallPrompt: () => void;
}

export const usePWA = (): PWAState => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Check if PWA is supported
  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  useEffect(() => {
    // Register service worker
    if (isSupported) {
      registerServiceWorker();
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      // Show install prompt after a delay if not already installed
      setTimeout(() => {
        if (!isInstalled) {
          setShowInstallPrompt(true);
        }
      }, 10000); // Show after 10 seconds
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    };

    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSupported, isInstalled]);

  const registerServiceWorker = async () => {
    try {
      if (!('serviceWorker' in navigator)) {
        console.log('Service Worker not supported');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'DATA_SYNCED') {
          console.log(`PWA: ${event.data.count} items synced`);
          // You can show a toast notification here
        }
      });

      // Enable background sync if supported
      if ('sync' in registration) {
        console.log('Background sync is supported');
      }

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, prompt user to refresh
              if (confirm('New version available! Refresh to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const installApp = async (): Promise<void> => {
    if (!deferredPrompt) {
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstalled(true);
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error during app installation:', error);
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    // Store dismissal in localStorage to avoid showing again soon
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  return {
    isInstallable,
    isInstalled,
    isOffline,
    isSupported,
    installApp,
    showInstallPrompt,
    dismissInstallPrompt
  };
};

// Helper function to initialize IndexedDB
const initializeIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pos-offline-db', 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('offline-data')) {
        db.createObjectStore('offline-data', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Utility function to save data offline
export const saveOfflineData = async (key: string, data: any): Promise<void> => {
  try {
    // Always save to localStorage as primary storage and fallback
    localStorage.setItem(`offline_${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));

    // Try to save to IndexedDB for larger storage (optional enhancement)
    try {
      if ('indexedDB' in window) {
        const db = await initializeIndexedDB();
        const transaction = db.transaction(['offline-data'], 'readwrite');
        const store = transaction.objectStore('offline-data');

        await new Promise<void>((resolve, reject) => {
          const putRequest = store.put({
            key,
            data,
            timestamp: Date.now()
          });

          putRequest.onsuccess = () => {
            db.close();
            resolve();
          };

          putRequest.onerror = () => {
            db.close();
            reject(putRequest.error);
          };
        });
      }
    } catch (indexedDBError) {
      // IndexedDB failed, but localStorage succeeded, so continue
      console.warn('IndexedDB save failed, using localStorage only:', indexedDBError);
    }
  } catch (error) {
    console.error('Error saving offline data:', error);
    throw error;
  }
};

// Utility function to load offline data
export const loadOfflineData = async (key: string): Promise<any> => {
  try {
    // Try IndexedDB first if available
    if ('indexedDB' in window) {
      try {
        const db = await initializeIndexedDB();
        const transaction = db.transaction(['offline-data'], 'readonly');
        const store = transaction.objectStore('offline-data');

        const result = await new Promise<any>((resolve, reject) => {
          const getRequest = store.get(key);

          getRequest.onsuccess = () => {
            db.close();
            resolve(getRequest.result);
          };

          getRequest.onerror = () => {
            db.close();
            reject(getRequest.error);
          };
        });

        if (result) {
          return result.data;
        }
      } catch (indexedDBError) {
        console.warn('IndexedDB load failed, falling back to localStorage:', indexedDBError);
      }
    }

    // Fallback to localStorage
    const stored = localStorage.getItem(`offline_${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.data;
    }

    return null;
  } catch (error) {
    console.error('Error loading offline data:', error);
    return null;
  }
};
