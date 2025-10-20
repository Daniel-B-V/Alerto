import { X, Check, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const suspensions = [
  {
    id: 1,
    location: "Batangas City",
    level: "All Levels",
    status: "suspended",
    reason: "Severe Storm Warning",
    time: "2 hours ago",
    authority: "City Mayor's Office"
  },
  {
    id: 2,
    location: "Lipa City",
    level: "Elementary",
    status: "suspended",
    reason: "Heavy Rainfall Alert",
    time: "1 hour ago",
    authority: "DepEd Lipa"
  },
  {
    id: 3,
    location: "Tanauan City",
    level: "All Levels",
    status: "ongoing",
    reason: "Weather conditions stable",
    time: "30 minutes ago",
    authority: "City Government"
  },
  {
    id: 4,
    location: "Santo Tomas",
    level: "Secondary",
    status: "suspended",
    reason: "Flood in School Areas",
    time: "45 minutes ago",
    authority: "Municipal Office"
  },
  {
    id: 5,
    location: "Lemery",
    level: "All Levels",
    status: "ongoing",
    reason: "Clear weather conditions",
    time: "1 hour ago",
    authority: "DepEd Lemery"
  }
];

const notifications = [
  {
    id: 1,
    title: "Emergency Alert: Batangas City",
    message: "All educational institutions are suspended due to severe weather conditions.",
    type: "emergency",
    time: "2 hours ago"
  },
  {
    id: 2,
    title: "Update: Lipa City Schools",
    message: "Elementary classes suspended. Secondary and tertiary classes continue with caution.",
    type: "update",
    time: "1 hour ago"
  },
  {
    id: 3,
    title: "All Clear: Tanauan City",
    message: "Classes resume normal schedule. Weather conditions have improved.",
    type: "normal",
    time: "30 minutes ago"
  }
];

export function SuspensionPanel() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Class Suspension Dashboard
        </h1>
        <p className="text-gray-600">
          Real-time monitoring and management of class suspensions across Batangas Province
        </p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-50/80 to-red-100/80 backdrop-blur-sm border-red-200/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 mb-1">Suspended</p>
                <p className="text-2xl font-bold text-red-900">8</p>
                <p className="text-xs text-red-500">Cities/Municipalities</p>
              </div>
              <X className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50/80 to-green-100/80 backdrop-blur-sm border-green-200/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 mb-1">Ongoing</p>
                <p className="text-2xl font-bold text-green-900">12</p>
                <p className="text-xs text-green-500">Cities/Municipalities</p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50/80 to-yellow-100/80 backdrop-blur-sm border-yellow-200/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 mb-1">Monitoring</p>
                <p className="text-2xl font-bold text-yellow-900">5</p>
                <p className="text-xs text-yellow-500">High-risk Areas</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Status Table */}
        <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle>Current Class Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suspensions.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-lg border-l-4 ${
                    item.status === 'suspended' 
                      ? 'bg-red-50 border-l-red-500' 
                      : 'bg-green-50 border-l-green-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {item.status === 'suspended' ? (
                          <X className="w-5 h-5 text-red-500" />
                        ) : (
                          <Check className="w-5 h-5 text-green-500" />
                        )}
                        <h4 className="font-medium text-gray-900">{item.location}</h4>
                        <Badge variant={item.status === 'suspended' ? 'destructive' : 'default'}>
                          {item.level}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{item.reason}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.time}
                        </span>
                        <span>By: {item.authority}</span>
                      </div>
                    </div>
                    <Badge 
                      variant={item.status === 'suspended' ? 'destructive' : 'default'}
                      className="shrink-0"
                    >
                      {item.status === 'suspended' ? 'SUSPENDED' : 'ONGOING'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications Preview */}
        <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 rounded-lg border ${
                    notification.type === 'emergency' 
                      ? 'bg-red-50 border-red-200' 
                      : notification.type === 'update'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notification.type === 'emergency' 
                        ? 'bg-red-500' 
                        : notification.type === 'update'
                        ? 'bg-blue-500'
                        : 'bg-green-500'
                    }`}></div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{notification.time}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button variant="outline" className="w-full">
                View All Announcements
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}