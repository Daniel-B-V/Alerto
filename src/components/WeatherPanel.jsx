import { Cloud, Droplets, Wind, Gauge, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const weatherData = [
  { time: "6AM", rainfall: 2.1, humidity: 82, wind: 15 },
  { time: "9AM", rainfall: 4.5, humidity: 85, wind: 18 },
  { time: "12PM", rainfall: 8.2, humidity: 90, wind: 22 },
  { time: "3PM", rainfall: 12.3, humidity: 88, wind: 25 },
  { time: "6PM", rainfall: 15.7, humidity: 92, wind: 28 },
  { time: "9PM", rainfall: 18.9, humidity: 95, wind: 32 },
];

const alertAreas = [
  { location: "Batangas City", level: "high", status: "Storm Warning" },
  { location: "Lipa City", level: "medium", status: "Heavy Rain" },
  { location: "Tanauan", level: "low", status: "Light Rain" },
  { location: "Santo Tomas", level: "high", status: "Flood Alert" },
];

export function WeatherPanel() {
  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Weather Monitoring
        </h1>
        <p className="text-gray-600">
          Real-time weather conditions and forecasting across Batangas Province
        </p>
      </div>
      
      {/* Quick Stats - moved from dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 backdrop-blur-sm border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">32</div>
              <div className="text-sm text-blue-600">Cities/Municipalities</div>
              <div className="text-xs text-blue-500">Monitored</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50/80 to-green-100/80 backdrop-blur-sm border-green-200/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-900">24</div>
              <div className="text-sm text-green-600">Classes Ongoing</div>
              <div className="text-xs text-green-500">Normal Operations</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50/80 to-red-100/80 backdrop-blur-sm border-red-200/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-900">8</div>
              <div className="text-sm text-red-600">Suspensions Active</div>
              <div className="text-xs text-red-500">Weather Related</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50/80 to-purple-100/80 backdrop-blur-sm border-purple-200/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-900">156</div>
              <div className="text-sm text-purple-600">Community Reports</div>
              <div className="text-xs text-purple-500">Last 24 Hours</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Weather Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 backdrop-blur-sm border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 mb-1">Temperature</p>
                <p className="text-2xl font-bold text-blue-900">28°C</p>
                <p className="text-xs text-blue-500">Feels like 32°C</p>
              </div>
              <Cloud className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50/80 to-cyan-100/80 backdrop-blur-sm border-cyan-200/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-600 mb-1">Humidity</p>
                <p className="text-2xl font-bold text-cyan-900">92%</p>
                <p className="text-xs text-cyan-500">Very High</p>
              </div>
              <Droplets className="w-8 h-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50/80 to-indigo-100/80 backdrop-blur-sm border-indigo-200/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600 mb-1">Rainfall</p>
                <p className="text-2xl font-bold text-indigo-900">18.9mm</p>
                <p className="text-xs text-indigo-500">Last hour</p>
              </div>
              <Gauge className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50/80 to-purple-100/80 backdrop-blur-sm border-purple-200/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 mb-1">Wind Speed</p>
                <p className="text-2xl font-bold text-purple-900">32 km/h</p>
                <p className="text-xs text-purple-500">Gusty winds</p>
              </div>
              <Wind className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weather Map */}
        <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              Storm Tracking Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-64 bg-gray-50 rounded-lg overflow-hidden">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1739320365494-ff3e8f18f1f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWF0aGVyJTIwc3Rvcm0lMjBjbG91ZHMlMjBwaGlsaXBwaW5lc3xlbnwxfHx8fDE3NTgwMjgwMTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Weather map showing storm systems"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <p className="font-medium">Active Storm Systems</p>
                <p className="text-sm opacity-90">Updated 5 minutes ago</p>
              </div>
            </div>
            
            {/* Alert Areas */}
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-gray-900">Alert Areas</h4>
              {alertAreas.map((area) => (
                <div key={area.location} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      area.level === 'high' ? 'destructive' : 
                      area.level === 'medium' ? 'default' : 'secondary'
                    }>
                      {area.level}
                    </Badge>
                    <span className="font-medium">{area.location}</span>
                  </div>
                  <span className="text-sm text-gray-600">{area.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="space-y-4">
          <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader>
              <CardTitle>Rainfall Trends (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={weatherData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis dataKey="time" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rainfall" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader>
              <CardTitle>Humidity & Wind</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={weatherData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis dataKey="time" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="humidity" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="wind" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}