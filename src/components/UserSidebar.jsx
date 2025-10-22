import {
  LayoutDashboard,
  GraduationCap,
  FileText,
  Settings,
  ChevronLeft,
  List
} from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

export function UserSidebar({ activeSection, onSectionChange }) {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "suspensions", icon: GraduationCap, label: "Class Suspensions" },
    { id: "report", icon: FileText, label: "Submit Report" },
    { id: "my-reports", icon: List, label: "My Reports" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

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
              <p className="text-xs text-gray-500">Community Portal</p>
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
            {!collapsed && <span className="ml-3">{item.label}</span>}
          </Button>
        ))}
      </nav>

      {/* Status Indicator */}
      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-800">Community Member</span>
            </div>
            <p className="text-xs text-blue-600">Batangas Weather Monitoring</p>
          </div>
        </div>
      )}
    </div>
  );
}
