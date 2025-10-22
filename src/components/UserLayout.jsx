import { Header } from "./Header";
import { UserSidebar } from "./UserSidebar";
import { UserDashboard } from "./UserDashboard";
import { UserSuspensionView } from "./UserSuspensionView";
import { UserReportingCenter } from "./UserReportingCenter";
import { UserMyReports } from "./UserMyReports";
import { SocketProvider } from "../contexts/SocketContext";
import { useState } from "react";

// Settings panel for users (logout, notifications)
function UserSettings() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Settings
        </h1>
        <p className="text-gray-600">
          Manage your account and notification preferences
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{user?.displayName || 'User'}</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
              <p className="text-xs text-gray-500 mt-1">Community Member</p>
            </div>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {loggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useAuth } from "../contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { User, LogOut } from "lucide-react";

export function UserLayout() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const renderContent = () => {
    switch (activeSection) {
      case 'suspensions':
        return <UserSuspensionView />;
      case 'report':
        return <UserReportingCenter />;
      case 'my-reports':
        return <UserMyReports />;
      case 'settings':
        return <UserSettings />;
      default:
        return <UserDashboard />;
    }
  };

  return (
    <SocketProvider>
      <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/30">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <UserSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
          <main className="flex-1 overflow-auto">
            <div className="bg-gradient-to-br from-gray-50/80 to-blue-50/50 min-h-full">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </SocketProvider>
  );
}
