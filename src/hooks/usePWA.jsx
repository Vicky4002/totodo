import { useState, useEffect, useCallback } from 'react';

interface PWACapabilities {
  isInstalled: boolean;
  isOnline: boolean;
  canInstall: boolean;
  hasUpdate: boolean;
  isStandalone: boolean;
}

export const usePWA = () => {
  const [capabilities, setCapabilities] = useState<PWACapabilities>({
    isInstalled: false,
    isOnline: navigator.onLine,
    canInstall: false,
    hasUpdate: false,
    isStandalone: false,
  });

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const updateCapabilities = useCallback(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    
    const isInstalled = isStandalone || 
                       localStorage.getItem('pwa-installed') === 'true';

    setCapabilities(prev => ({
      ...prev,
      isOnline: navigator.onLine,
      isStandalone,
      isInstalled,
    }));
  }, []);

  useEffect(() => {
    updateCapabilities();

    // Listen for online/offline events
    const handleOnline = () => updateCapabilities();
    const handleOffline = () => updateCapabilities();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for app installation
    const handleAppInstalled = () => {
      localStorage.setItem('pwa-installed', 'true');
      updateCapabilities();
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setCapabilities(prev => ({ ...prev, canInstall: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          setRegistration(reg);
          
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                  setCapabilities(prev => ({ ...prev, hasUpdate: true }));
                }
              });
            }
          });
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [updateCapabilities]);

  const installApp = useCallback(async () => {
    const prompt = (window as any).deferredPrompt;
    if (prompt) {
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          localStorage.setItem('pwa-installed', 'true');
          updateCapabilities();
        }
        (window as any).deferredPrompt = null;
      } catch (error) {
        console.error('Failed to install app:', error);
      }
    }
  }, [updateCapabilities]);

  const updateApp = useCallback(() => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  const shareApp = useCallback(async (data?: ShareData) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ToTodo - Task Management App',
          text: 'Check out this awesome task management app!',
          url: window.location.origin,
          ...data,
        });
        return true;
      } catch (error) {
        console.error('Error sharing:', error);
        return false;
      }
    }
    return false;
  }, []);

  const requestPersistentStorage = useCallback(async () => {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const persistent = await navigator.storage.persist();
        return persistent;
      } catch (error) {
        console.error('Failed to request persistent storage:', error);
        return false;
      }
    }
    return false;
  }, []);

  const getStorageEstimate = useCallback(async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota || 0,
          usage: estimate.usage || 0,
        };
      } catch (error) {
        console.error('Failed to get storage estimate:', error);
        return null;
      }
    }
    return null;
  }, []);

  return {
    capabilities,
    updateAvailable,
    installApp,
    updateApp,
    shareApp,
    requestPersistentStorage,
    getStorageEstimate,
    updateCapabilities,
  };
};