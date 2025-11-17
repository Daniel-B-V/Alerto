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

createRoot(document.getElementById("root")).render(<App />);
