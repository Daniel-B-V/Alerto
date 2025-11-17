import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "leaflet/dist/leaflet.css";

// Suppress known harmless console warnings
const originalError = console.error;
console.error = (...args) => {
  const message = args[0]?.toString() || '';

  // Suppress Firebase COOP warnings (harmless browser policy warnings)
  if (message.includes('Cross-Origin-Opener-Policy') ||
      message.includes('window.closed')) {
    return;
  }

  // Suppress backend connection warnings when backend is unavailable
  if (message.includes('ERR_CONNECTION_REFUSED') ||
      message.includes(':5000/api/')) {
    return;
  }

  originalError.apply(console, args);
};

const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args[0]?.toString() || '';

  // Suppress Firebase auth warnings
  if (message.includes('firebase_auth') ||
      message.includes('Cross-Origin')) {
    return;
  }

  originalWarn.apply(console, args);
};

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, prompt user to reload
              console.log('🔄 New version available! Please refresh.');

              // Optional: Show a notification to the user
              if (confirm('A new version of Alerto is available. Reload to update?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });

  // Handle service worker messages
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'OFFLINE_MODE') {
      console.warn('⚠️ App is running in offline mode');
      // You can dispatch a custom event here to show offline indicator in UI
      window.dispatchEvent(new CustomEvent('app-offline'));
    }
  });

  // Reload page when service worker takes control
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      window.location.reload();
      refreshing = true;
    }
  });
}

createRoot(document.getElementById("root")).render(<App />);
