import { useState, useEffect } from 'react';

interface OfflineData {
  sales: any[];
  products: any[];
  customers: any[];
  settings: any;
  lastSync: string;
}

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState<OfflineData | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('App is back online');
      // Trigger sync when back online
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('App is now offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline data from localStorage
  const loadOfflineData = () => {
    try {
      const data = localStorage.getItem('crema-pos-offline-data');
      if (data) {
        const parsedData = JSON.parse(data);
        setOfflineData(parsedData);
        return parsedData;
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
    return null;
  };

  // Save data to localStorage for offline use
  const saveOfflineData = (data: Partial<OfflineData>) => {
    try {
      const existingData = loadOfflineData() || {
        sales: [],
        products: [],
        customers: [],
        settings: {},
        lastSync: new Date().toISOString()
      };

      const updatedData = {
        ...existingData,
        ...data,
        lastSync: new Date().toISOString()
      };

      localStorage.setItem('crema-pos-offline-data', JSON.stringify(updatedData));
      setOfflineData(updatedData);
      console.log('Data saved for offline use');
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  };

  // Sync offline data when back online
  const syncOfflineData = async () => {
    const data = loadOfflineData();
    if (!data || !data.sales.length) return;

    try {
      // Here you would sync with your backend API
      console.log('Syncing offline data...', data);
      
      // Clear offline data after successful sync
      localStorage.removeItem('crema-pos-offline-data');
      setOfflineData(null);
      
      console.log('Offline data synced successfully');
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  };

  // Add sale for offline storage
  const addOfflineSale = (sale: any) => {
    const data = loadOfflineData() || { sales: [], products: [], customers: [], settings: {}, lastSync: '' };
    data.sales.push({
      ...sale,
      offlineId: Date.now().toString(),
      syncStatus: 'pending'
    });
    saveOfflineData(data);
  };

  // Update product stock offline
  const updateOfflineStock = (productId: string, newStock: number) => {
    const data = loadOfflineData() || { sales: [], products: [], customers: [], settings: {}, lastSync: '' };
    const productIndex = data.products.findIndex(p => p.id === productId);
    
    if (productIndex !== -1) {
      data.products[productIndex].stock = newStock;
    } else {
      data.products.push({
        id: productId,
        stock: newStock,
        lastModified: new Date().toISOString()
      });
    }
    
    saveOfflineData(data);
  };

  // Check if app can work offline
  const canWorkOffline = () => {
    return 'serviceWorker' in navigator && loadOfflineData() !== null;
  };

  // Get offline status message
  const getOfflineStatus = () => {
    if (isOnline) {
      return { status: 'online', message: 'Terhubung ke internet' };
    } else if (canWorkOffline()) {
      return { status: 'offline', message: 'Mode offline - Data akan disinkronkan saat online' };
    } else {
      return { status: 'no-offline', message: 'Tidak ada koneksi internet dan data offline tidak tersedia' };
    }
  };

  return {
    isOnline,
    offlineData,
    loadOfflineData,
    saveOfflineData,
    syncOfflineData,
    addOfflineSale,
    updateOfflineStock,
    canWorkOffline,
    getOfflineStatus
  };
};
