import { WeatherPanel } from "./WeatherPanel";
import { SuspensionPanel } from "./SuspensionPanel";
import { CommunityFeed } from "./CommunityFeed";
import { AdminPanel } from "./AdminPanel";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Settings, Shield, Users, Database } from "lucide-react";

function SettingsPanel() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Settings
        </h1>
        <p className="text-gray-600">
          System configuration and monitoring preferences for Batangas Province
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Alert Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Configure emergency alert thresholds and notification preferences.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Manage community reporters and admin access levels.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-500" />
              Data Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Configure weather data sources and monitoring stations.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-500" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Monitor system performance and data accuracy.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
      case 'analytics':
        return <AnalyticsPanel />;
      case 'admin':
        return <AdminPanel />;
      case 'settings':
        return <SettingsPanel />;
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