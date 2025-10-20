import { Search, Bell, Cloud, User } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";

export function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100/50 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Cloud className="w-8 h-8 text-blue-500" />
            <Bell className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Alerto</h1>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <Input 
              placeholder="Search Batangas locations and reports..." 
              className="pl-10 bg-gray-50/80 backdrop-blur-sm border-gray-200/50 rounded-xl focus:bg-white/90 transition-all duration-200"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative w-10 h-10 rounded-full hover:bg-gray-100/80 transition-all duration-200">
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs bg-red-500 text-white rounded-full">
              3
            </Badge>
          </Button>

          {/* Profile */}
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src="" />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-500">Batangas Province</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}