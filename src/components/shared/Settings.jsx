/**
 * Settings Component
 * User settings including role management for development/testing
 */

import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import {
  User,
  Shield,
  Building2,
  Crown,
  MapPin,
  RefreshCw,
  Check,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { setUserRole } from '../../firebase/firestore';
import { BATANGAS_LOCATIONS } from '../../constants/suspensionCriteria';

const Settings = () => {
  const { user, logout } = useAuth();
  const [selectedCity, setSelectedCity] = useState('Batangas City');
  const [switching, setSwitching] = useState(false);
  const [message, setMessage] = useState(null);

  const currentRole = user?.role || 'user';

  const handleSwitchRole = async (role, city = null) => {
    setSwitching(true);
    setMessage(null);

    try {
      const result = await setUserRole(user.uid, role, city);

      if (result.success) {
        const roleLabel = role === 'governor' ? 'Governor' : role === 'mayor' ? `Mayor of ${city}` : 'User';
        setMessage({
          type: 'success',
          text: `✅ Successfully switched to ${roleLabel}! Refreshing...`
        });

        // Refresh page after 1.5 seconds
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage({
          type: 'error',
          text: `❌ Failed to switch role: ${result.error}`
        });
        setSwitching(false);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Error: ${error.message}`
      });
      setSwitching(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and role settings</p>
      </div>

      {/* Current User Info */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Current User
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Email:</span>
            <span className="font-medium">{user?.email}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Display Name:</span>
            <span className="font-medium">{user?.displayName || 'Not set'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">User ID:</span>
            <span className="font-mono text-xs text-gray-500">{user?.uid}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-gray-600">Current Role:</span>
            <Badge className={
              currentRole === 'governor' || currentRole === 'admin' || currentRole === 'super_admin'
                ? 'bg-purple-100 text-purple-800'
                : currentRole === 'mayor'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }>
              {currentRole === 'governor' || currentRole === 'admin' || currentRole === 'super_admin'
                ? '👑 Governor/Admin'
                : currentRole === 'mayor'
                ? `🏛️ Mayor${user?.assignedCity ? ` of ${user.assignedCity}` : ''}`
                : '👤 User'}
            </Badge>
          </div>

          {user?.assignedCity && currentRole === 'mayor' && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Assigned City:</span>
              <span className="font-medium text-blue-600">{user.assignedCity}</span>
            </div>
          )}

          {user?.assignedProvince && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Province:</span>
              <span className="font-medium">{user.assignedProvince}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Role Management */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Role Management
        </h2>

        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Development Feature:</strong> Switch between roles to test different views and permissions.
            In production, roles would be assigned by administrators only.
          </AlertDescription>
        </Alert>

        {message && (
          <Alert className={message.type === 'success' ? 'bg-green-50 border-green-200 mb-4' : 'bg-red-50 border-red-200 mb-4'}>
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Governor Option */}
          <div className="border-2 rounded-lg p-5 hover:border-purple-300 hover:bg-purple-50/30 transition-all">
            <div className="flex items-center mb-3">
              <Crown className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="font-bold text-lg">Governor</h3>
              {(currentRole === 'governor' || currentRole === 'admin' || currentRole === 'super_admin') && (
                <Badge className="ml-2 bg-green-100 text-green-800">
                  <Check className="w-3 h-3 mr-1" />
                  Current
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Full access to all cities, can issue suspensions directly, approve mayor requests, view analytics.
            </p>
            <ul className="text-xs text-gray-500 space-y-1 mb-4">
              <li>✓ View all 34 Batangas cities</li>
              <li>✓ Issue and manage suspensions</li>
              <li>✓ Approve/reject mayor requests</li>
              <li>✓ Access analytics dashboard</li>
            </ul>
            <div className="pt-3 border-t mt-4">
              <button
                onClick={() => handleSwitchRole('governor')}
                disabled={switching || currentRole === 'governor' || currentRole === 'admin' || currentRole === 'super_admin'}
                className="w-full !bg-purple-600 hover:!bg-purple-700 disabled:!bg-gray-400 disabled:cursor-not-allowed !text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: switching || currentRole === 'governor' || currentRole === 'admin' || currentRole === 'super_admin' ? '#9ca3af' : '#9333ea', color: 'white' }}
              >
                {switching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Switching...
                  </>
                ) : (currentRole === 'governor' || currentRole === 'admin' || currentRole === 'super_admin') ? (
                  'Current Role'
                ) : (
                  'Switch to Governor'
                )}
              </button>
            </div>
          </div>

          {/* Mayor Option */}
          <div className="border-2 rounded-lg p-5 hover:border-blue-300 hover:bg-blue-50/30 transition-all">
            <div className="flex items-center mb-3">
              <Building2 className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="font-bold text-lg">Mayor</h3>
              {currentRole === 'mayor' && (
                <Badge className="ml-2 bg-green-100 text-green-800">
                  <Check className="w-3 h-3 mr-1" />
                  Current
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">
              City-specific view, can request suspensions from governor, limited to assigned city only.
            </p>
            <ul className="text-xs text-gray-500 space-y-1 mb-4">
              <li>✓ View your city's weather only</li>
              <li>✓ 12-hour forecast chart</li>
              <li>✓ Request suspensions (needs approval)</li>
              <li>✓ Track your request status</li>
            </ul>

            {/* City Selector */}
            <div className="mb-4">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                Select Your City:
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full border-2 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                disabled={switching}
              >
                {BATANGAS_LOCATIONS.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t mt-4">
              <button
                onClick={() => handleSwitchRole('mayor', selectedCity)}
                disabled={switching || (currentRole === 'mayor' && user?.assignedCity === selectedCity)}
                className="w-full !bg-blue-600 hover:!bg-blue-700 disabled:!bg-gray-400 disabled:cursor-not-allowed !text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: switching || (currentRole === 'mayor' && user?.assignedCity === selectedCity) ? '#9ca3af' : '#2563eb', color: 'white' }}
              >
                {switching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Switching...
                  </>
                ) : (currentRole === 'mayor' && user?.assignedCity === selectedCity) ? (
                  'Current Role'
                ) : (
                  'Switch to Mayor'
                )}
              </button>
            </div>
          </div>

          {/* Regular User Option */}
          <div className="border-2 rounded-lg p-5 hover:border-gray-300 hover:bg-gray-50/50 transition-all">
            <div className="flex items-center mb-3">
              <User className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="font-bold text-lg">Regular User</h3>
              {currentRole === 'user' && (
                <Badge className="ml-2 bg-green-100 text-green-800">
                  <Check className="w-3 h-3 mr-1" />
                  Current
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Standard citizen access, can view public information and submit community reports.
            </p>
            <ul className="text-xs text-gray-500 space-y-1 mb-4">
              <li>✓ View active suspensions</li>
              <li>✓ Submit community reports</li>
              <li>✓ View weather information</li>
            </ul>
            <div className="pt-3 border-t mt-4">
              <button
                onClick={() => handleSwitchRole('user')}
                disabled={switching || currentRole === 'user'}
                className="w-full !bg-gray-600 hover:!bg-gray-700 disabled:!bg-gray-400 disabled:cursor-not-allowed !text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: switching || currentRole === 'user' ? '#9ca3af' : '#4b5563', color: 'white' }}
              >
                {switching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Switching...
                  </>
                ) : currentRole === 'user' ? (
                  'Current Role'
                ) : (
                  'Switch to User'
                )}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Account Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Account Actions</h2>
        <Button
          onClick={logout}
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          Sign Out
        </Button>
      </Card>
    </div>
  );
};

export default Settings;
