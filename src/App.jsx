import { Header } from "./components/shared/Header";
import { Sidebar } from "./components/shared/Sidebar";
import { OfflineIndicator } from "./components/shared/OfflineIndicator";
import { DashboardContent } from "./components/dashboard/admin/DashboardContent";
import { UserLayout } from "./components/dashboard/user/UserLayout";
import { Login } from "./components/auth/Login";
import { SignUp } from "./components/auth/SignUp";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { SuspensionProvider } from "./contexts/SuspensionContext";
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

  // Import admin utilities (for development testing)
  import('./utils/adminUtils').then(module => {
    window.makeCurrentUserAdmin = module.makeCurrentUserAdmin;
    window.makeUserAdmin = module.makeUserAdmin;
    window.makeCurrentUserGovernor = module.makeCurrentUserGovernor;
    window.makeCurrentUserMayor = module.makeCurrentUserMayor;
    window.checkMyRole = module.checkCurrentUserRole;
    console.log('\n👑 Role Management Commands:');
    console.log('   window.checkMyRole() - Check your current role');
    console.log('   window.makeCurrentUserGovernor() - Become Governor (full access)');
    console.log('   window.makeCurrentUserMayor("Batangas City") - Become Mayor of a city');
    console.log('   window.makeCurrentUserAdmin() - Become Admin (same as Governor)\n');
  });

  // Import cleanup utilities (for spam/test report cleanup)
  import('./utils/cleanupSpamReports').then(module => {
    window.cleanupSpamReports = module.cleanupSpamReports;
    window.deleteAllReports = module.deleteAllReports;
    console.log('🧹 Cleanup Utilities Loaded:');
    console.log('   window.cleanupSpamReports() - Delete spam/gibberish reports');
    console.log('   window.cleanupSpamReports({ dryRun: true }) - Preview deletions');
    console.log('   window.deleteAllReports() - Delete ALL reports (⚠️ dangerous!)\n');
  });
}

function AppContent() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [authPage, setAuthPage] = useState("login"); // "login" or "signup"
  const { isAuthenticated, loading, userRole } = useAuth();

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

  // Route based on user role
  if (userRole === 'admin' || userRole === 'governor' || userRole === 'mayor') {
    // Admin/Governor/Mayor Interface (with role-based dashboards inside)
    return (
      <SocketProvider>
        <SuspensionProvider>
          <OfflineIndicator />
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
        </SuspensionProvider>
      </SocketProvider>
    );
  } else {
    // Regular User Interface
    return (
      <SuspensionProvider>
        <OfflineIndicator />
        <UserLayout />
      </SuspensionProvider>
    );
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
