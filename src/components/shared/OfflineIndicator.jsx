import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * Offline Indicator Component
 * Shows a banner when the app is offline or using cached data
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Show "Back Online" message briefly
        setShowBanner(true);
        setTimeout(() => {
          setShowBanner(false);
          setWasOffline(false);
        }, 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      setWasOffline(true);
    };

    // Listen for app-offline custom event from service worker
    const handleAppOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('app-offline', handleAppOffline);

    // Check if service worker is serving cached content
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHED_RESPONSE') {
          // Service worker is serving cached data
          console.log('Using cached data');
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('app-offline', handleAppOffline);
    };
  }, [wasOffline]);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] ${
        isOnline
          ? 'bg-green-500'
          : 'bg-orange-500'
      } text-white shadow-lg transition-all duration-300`}
      style={{
        animation: showBanner ? 'slideDown 0.3s ease-out' : 'slideUp 0.3s ease-in'
      }}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="w-5 h-5" />
            ) : (
              <WifiOff className="w-5 h-5 animate-pulse" />
            )}
            <div>
              <div className="font-semibold">
                {isOnline ? 'Back Online!' : 'You\'re Offline'}
              </div>
              <div className="text-sm opacity-90">
                {isOnline
                  ? 'Connection restored. Data will sync automatically.'
                  : 'Using cached data. Some features may be limited.'}
              </div>
            </div>
          </div>

          {!isOnline && (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          )}

          {isOnline && (
            <button
              onClick={() => setShowBanner(false)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
