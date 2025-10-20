import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { DashboardContent } from "./components/DashboardContent";
import { Login } from "./components/Login";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { useState } from "react";

function AppContent() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const { isAuthenticated, loading } = useAuth();

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
    return <Login />;
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