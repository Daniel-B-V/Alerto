import { Bell, Cloud, User, X, AlertTriangle, Shield, Building2, Crown } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";
import { getRoleBadge } from "../../utils/permissions";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const { notifications } = useSocket();
  const { user } = useAuth();
  const notificationCount = notifications.length;
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // Get role badge data
  const roleBadge = getRoleBadge(user);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100/50 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <img
            src="/assets/logo.png"
            alt="Alerto Logo"
            className="h-10 object-contain"
          />
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              size="sm"
              className="relative w-10 h-10 rounded-full hover:bg-gray-100/80 transition-all duration-200"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs bg-red-500 text-white rounded-full">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div
                className="absolute right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200"
                style={{ width: '480px', maxWidth: '90vw', maxHeight: '500px', zIndex: 9999 }}
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notification, index) => (
                        <div
                          key={index}
                          className="p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 mb-1">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mb-2">
                                {notification.message}
                              </p>
                              {notification.timestamp && (
                                <p className="text-xs text-gray-400">
                                  {new Date(notification.timestamp).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="flex items-center gap-3">
            {/* Role Badge */}
            <Badge
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 ${
                roleBadge.color === 'red'
                  ? 'bg-red-100 text-red-700 border-red-200'
                  : roleBadge.color === 'purple'
                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                  : roleBadge.color === 'blue'
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              {roleBadge.color === 'red' && <Shield className="w-3.5 h-3.5" />}
              {roleBadge.color === 'purple' && <Crown className="w-3.5 h-3.5" />}
              {roleBadge.color === 'blue' && <Building2 className="w-3.5 h-3.5" />}
              {roleBadge.color === 'gray' && <User className="w-3.5 h-3.5" />}
              <span className="text-xs font-semibold">{roleBadge.fullLabel}</span>
            </Badge>

            <Avatar className="w-8 h-8 ring-2 ring-offset-2 ring-gray-100">
              <AvatarImage src={user?.photoURL || ""} />
              <AvatarFallback className={`${
                roleBadge.color === 'red'
                  ? 'bg-red-100 text-red-600'
                  : roleBadge.color === 'purple'
                  ? 'bg-purple-100 text-purple-600'
                  : roleBadge.color === 'blue'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {user?.displayName?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium">
                {user?.displayName || user?.email || 'User'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.assignedProvince || user?.province || 'Batangas'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}