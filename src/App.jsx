import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { DashboardContent } from "./components/DashboardContent";
import { Login } from "./components/Login";
import { SignUp } from "./components/SignUp";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { useState, useEffect } from "react";

// Import weather API test utility (for development testing)
if (import.meta.env.DEV) {
  import('./utils/testWeatherAPI').then(module => {
    window.testWeatherAPI = {
      testCurrentWeather: module.testCurrentWeather,
      testWeatherForecast: module.testWeatherForecast,
      runAllTests: module.runAllTests
    };
    console.log('🌤️ Weather API test functions loaded! Try:');
    console.log('   window.testWeatherAPI.runAllTests()');
  });
}

function AppContent() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [authPage, setAuthPage] = useState("login"); // "login" or "signup"
  const { isAuthenticated, loading } = useAuth();

  // Listen for navigation events from Login/SignUp pages
  useEffect(() => {
    const handleNavigation = (e) => {
      const path = e.detail?.path || window.location.pathname;
      if (path === '/signup') {
        setAuthPage('signup');
      } else if (path === '/login' || path === '/') {
        setAuthPage('login');
      }
    };

    window.addEventListener('navigate', handleNavigation);

    // Check initial URL
    if (window.location.pathname === '/signup') {
      setAuthPage('signup');
    }

    return () => window.removeEventListener('navigate', handleNavigation);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return authPage === 'signup' ? <SignUp /> : <Login />;
  }

  return (
    <SocketProvider>
      <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/30">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
          <main className="flex-1 overflow-auto">
            <DashboardContent activeSection={activeSection} />
          </main>
        </div>
      </div>
    </SocketProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}