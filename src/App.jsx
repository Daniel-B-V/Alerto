import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { DashboardContent } from "./components/DashboardContent";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { useState } from "react";

export default function App() {
  const [activeSection, setActiveSection] = useState("dashboard");

  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}