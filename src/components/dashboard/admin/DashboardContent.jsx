import { WeatherPanel } from "../../weather/WeatherPanel";
import SuspensionPanel from "../../suspension/SuspensionPanel";
import { UserSuspensionView } from "../user/UserSuspensionView";
import { CommunityFeed } from "../../community/CommunityFeed";
import { AdminPanel } from "./AdminPanel";
import { AnalyticsPanel } from "../../analytics/AnalyticsPanel";
import { EnhancedReportsPage } from "../../reports/EnhancedReportsPage";
import { DatabaseSeeder } from "../../shared/DatabaseSeeder";
import Settings from "../../shared/Settings";

// Dashboard now shows weather overview as main content
function DashboardOverview() {
  return <WeatherPanel />;
}

export function DashboardContent({ activeSection }) {
  const renderContent = () => {
    switch (activeSection) {
      case 'community':
        return <CommunityFeed />;
      case 'suspension':
        return <SuspensionPanel />;
      case 'user-suspension':
        return <UserSuspensionView />;
      case 'analytics':
        return <AnalyticsPanel />;
      case 'admin':
        return <EnhancedReportsPage />;
      case 'seeder':
        return <DatabaseSeeder />;
      case 'settings':
        return <Settings />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50/80 to-blue-50/50 min-h-full">
      {renderContent()}
    </div>
  );
}