import { Header } from "../../shared/Header";
import { UserSidebar } from "../../shared/UserSidebar";
import { UserDashboard } from "./UserDashboard";
import { UserSuspensionView } from "./UserSuspensionView";
import { UserReportsPage } from "../../reports/UserReportsPage";
import { CommunityViewUser } from "../../community/CommunityViewUser";
import { TyphoonTracker } from "../../typhoon/TyphoonTracker";
import Settings from "../../shared/Settings";
import { SocketProvider } from "../../../contexts/SocketContext";
import { useState } from "react";


export function UserLayout() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const renderContent = () => {
    switch (activeSection) {
      case 'suspensions':
        return <UserSuspensionView />;
      case 'my-reports':
        return <UserReportsPage />;
      case 'community':
        return <CommunityViewUser />;
      case 'typhoon-tracker':
        return <TyphoonTracker />;
      case 'settings':
        return <Settings />;
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
            <div className="p-6 bg-gradient-to-br from-gray-50/80 to-blue-50/50 min-h-full">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </SocketProvider>
  );
}
