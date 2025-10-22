import {
  LayoutDashboard,
  Cloud,
  GraduationCap,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  BarChart3,
  Database
} from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export function Sidebar({ activeSection, onSectionChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  // Define all navigation items with role requirements
  const allNavItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["user", "admin", "super_admin"] },
    { id: "community", icon: Users, label: "Community", roles: ["user", "admin", "super_admin"] },
    { id: "user-suspension", icon: GraduationCap, label: "Suspensions", roles: ["user"] },
    { id: "suspension", icon: GraduationCap, label: "Suspension", roles: ["admin", "super_admin"] },
    { id: "analytics", icon: BarChart3, label: "Analytics", roles: ["admin", "super_admin"] },
    { id: "admin", icon: FileText, label: "Reports", roles: ["admin", "super_admin"] },
    { id: "seeder", icon: Database, label: "Test Data", roles: ["admin", "super_admin"] },
    { id: "settings", icon: Settings, label: "Settings", roles: ["user", "admin", "super_admin"] },
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
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={`w-full justify-start rounded-xl transition-all duration-200 relative ${
              activeSection === item.id
                ? 'bg-blue-500 text-white shadow-lg hover:bg-blue-600 hover:shadow-xl'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => onSectionChange(item.id)}
          >
            <item.icon className="w-5 h-5" />
            {!collapsed && (
              <>
                <span className="ml-3">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto text-xs px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </Button>
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