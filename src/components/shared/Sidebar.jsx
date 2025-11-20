import {
  LayoutDashboard,
  Cloud,
  GraduationCap,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  BarChart3,
  Database,
  Shield,
  Crown,
  Building2
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { isGovernor, isMayor } from "../../utils/permissions";

export function Sidebar({ activeSection, onSectionChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  // Get role-specific badge helper
  const getRoleBadgeIcon = () => {
    if (user?.role === 'admin' || user?.role === 'super_admin') return <Shield className="w-3 h-3" />;
    if (isMayor(user)) return <Building2 className="w-3 h-3" />;
    return null;
  };

  // Define all navigation items with role requirements
  const allNavItems = [
    {
      id: "dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      roles: ["user", "admin", "super_admin", "governor", "mayor"],
      description: isGovernor(user) ? "Provincial Overview" : isMayor(user) ? "City Dashboard" : "Weather Monitor"
    },
    {
      id: "community",
      icon: Users,
      label: "Community",
      roles: ["user", "admin", "super_admin", "governor", "mayor"],
      description: "Reports & Feed"
    },
    {
      id: "user-suspension",
      icon: GraduationCap,
      label: "Suspensions",
      roles: ["user"],
      description: "Active suspensions"
    },
    {
      id: "suspension",
      icon: GraduationCap,
      label: "Suspension",
      roles: ["admin", "super_admin", "governor", "mayor"],
      description: isMayor(user) ? "Request Suspension" : "Manage Suspensions",
      roleIcon: true
    },
    {
      id: "mayor-reports",
      icon: FileText,
      label: "Reports",
      roles: ["mayor"],
      description: "Barangay Reports",
      roleIcon: true
    },
    {
      id: "analytics",
      icon: BarChart3,
      label: "Analytics",
      roles: ["admin", "super_admin", "governor"],
      description: "Statistics",
      roleIcon: true
    },
    {
      id: "admin",
      icon: FileText,
      label: "Reports",
      roles: ["admin", "super_admin", "governor"],
      description: "Management",
      roleIcon: true
    },
    {
      id: "seeder",
      icon: Database,
      label: "Test Data",
      roles: ["admin", "super_admin", "governor"],
      description: "Seeding Tools",
      roleIcon: true
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      roles: ["user", "admin", "super_admin", "governor", "mayor"],
      description: "Preferences"
    },
  ];

  // Filter nav items based on user role
  const navItems = allNavItems.filter(item =>
    item.roles.includes(user?.role || 'user')
  );

  return (
    <div className={`bg-white/80 backdrop-blur-xl border-r border-gray-100/50 h-full transition-all duration-300 shadow-sm ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100/50">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-gray-900">Alerto</h2>
              <p className="text-xs text-gray-500">Batangas Province</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 p-0 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <div key={item.id}>
            <Button
              variant="ghost"
              className={`w-full rounded-xl transition-all duration-200 relative ${
                collapsed ? 'justify-center' : 'justify-start'
              } ${
                activeSection === item.id
                  ? 'bg-blue-500 text-white shadow-lg hover:bg-blue-600 hover:shadow-xl'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => onSectionChange(item.id)}
            >
              <item.icon className="w-5 h-5" />
              {!collapsed && (
                <>
                  <div className="ml-3 flex-1 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{item.label}</span>
                      {item.roleIcon && (
                        <span className={`${
                          activeSection === item.id ? 'text-white/70' : 'text-gray-400'
                        }`}>
                          {getRoleBadgeIcon()}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </Button>
          </div>
        ))}
      </nav>

      {/* Status Indicator */}
      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-800">System Online</span>
            </div>
            <p className="text-xs text-green-600">Monitoring Batangas Province</p>
          </div>
        </div>
      )}
    </div>
  );
}