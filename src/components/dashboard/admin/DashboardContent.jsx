import { WeatherPanel } from "../../weather/WeatherPanel";
import SuspensionPanel from "../../suspension/SuspensionPanel";
import { UserSuspensionView } from "../user/UserSuspensionView";
import { CommunityFeed } from "../../community/CommunityFeed";
import { AdminPanel } from "./AdminPanel";
import { AnalyticsPanel } from "../../analytics/AnalyticsPanel";
import { EnhancedReportsPage } from "../../reports/EnhancedReportsPage";
import { DatabaseSeeder } from "../../shared/DatabaseSeeder";
import Settings from "../../shared/Settings";
import CityGridView from "./CityGridView";
import MayorDashboard from "../../suspension/MayorDashboard";
import { useAuth } from "../../../contexts/AuthContext";
import { isGovernor, isMayor } from "../../../utils/permissions";

// Dashboard now shows different views based on role
function DashboardOverview() {
  const { user } = useAuth();

  // Mayors see their city-specific dashboard
  if (isMayor(user)) {
    return <MayorDashboard />;
  }

  // Governors see weather panel without announcements (they issue suspensions)
  if (isGovernor(user)) {
    return <WeatherPanel showAnnouncement={false} />;
  }

  // Regular users see weather panel with announcements
  return <WeatherPanel showAnnouncement={true} />;
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