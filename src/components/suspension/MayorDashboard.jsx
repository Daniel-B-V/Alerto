/**
 * Mayor Dashboard - Refactored
 * Integrated city-specific view for mayors to directly manage suspensions
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import {
  AlertTriangle,
  RefreshCw,
  Activity,
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSuspensions } from '../../hooks/useSuspensions';
import { getUserCity } from '../../utils/permissions';
import { getBatangasWeatherWithSuspensionCriteria } from '../../services/weatherService';
import {
  createSuspension,
  getCitySuspensionHistory,
  getSuspensionRecommendation,
  liftSuspension,
  extendSuspension,
  updateSuspension
} from '../../services/suspensionService';
import BarangayInsightsPanel from '../dashboard/mayor/BarangayInsightsPanel';

// New Components
import { QuickSuspendModal } from './mayor/QuickSuspendModal';
import { ActiveSuspensionBanner } from './mayor/ActiveSuspensionBanner';
import { WeatherMonitoringGrid } from './mayor/WeatherMonitoringGrid';
import { DecisionSupportWidget } from './mayor/DecisionSupportWidget';
import { SuspensionHistoryCard } from './mayor/SuspensionHistoryCard';
import { SuspensionManagementPanel } from './mayor/SuspensionManagementPanel';

const MayorDashboard = () => {
  const { user } = useAuth();
  const { activeSuspensions } = useSuspensions();
  const [cityWeather, setCityWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [suspensionHistory, setSuspensionHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [recommendation, setRecommendation] = useState(null);

  // Modal states
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showManagementPanel, setShowManagementPanel] = useState(false);
  const [managementAction, setManagementAction] = useState(null); // 'extend', 'edit', 'lift'
  const [processingAction, setProcessingAction] = useState(false);

  const userCity = getUserCity(user);

  // Get active suspension for this city
  const activeSuspension = activeSuspensions.find(
    s => s.city === userCity && s.status === 'active' && new Date(s.effectiveUntil) > new Date()
  );

  // Load city weather data
  const loadCityWeather = async () => {
    try {
      setRefreshing(true);
      const allWeather = await getBatangasWeatherWithSuspensionCriteria();
      const myCityWeather = allWeather.find(w => w.city === userCity);
      setCityWeather(myCityWeather);
    } catch (error) {
      console.error('Error loading city weather:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Load suspension history and analytics
  const loadSuspensionHistory = async () => {
    try {
      const { suspensions, analytics: analyticsData } = await getCitySuspensionHistory(userCity, 50);
      setSuspensionHistory(suspensions);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading suspension history:', error);
    }
  };

  // Load AI recommendation
  const loadRecommendation = async () => {
    if (!cityWeather) return;

    try {
      const reportCount = 0; // TODO: Get from barangay insights
      const criticalReports = 0; // TODO: Get from barangay insights

      const rec = await getSuspensionRecommendation(
        userCity,
        cityWeather.criteria,
        reportCount,
        criticalReports
      );
      setRecommendation(rec);
    } catch (error) {
      console.error('Error loading recommendation:', error);
    }
  };

  // Initial load
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        loadCityWeather(),
        loadSuspensionHistory()
      ]);
      setLoading(false);
    };

    if (userCity) {
      loadAllData();

      // Refresh weather every 5 minutes
      const weatherInterval = setInterval(loadCityWeather, 5 * 60 * 1000);

      return () => {
        clearInterval(weatherInterval);
      };
    }
  }, [userCity]);

  // Load recommendation when weather data changes
  useEffect(() => {
    loadRecommendation();
  }, [cityWeather]);

  // Handle refresh
  const handleRefresh = async () => {
    await Promise.all([
      loadCityWeather(),
      loadSuspensionHistory()
    ]);
  };

  // Handle issue suspension
  const handleIssueSuspension = async (data) => {
    setProcessingAction(true);
    try {
      const now = new Date();
      const effectiveUntil = new Date(now.getTime() + data.durationHours * 60 * 60 * 1000);

      const suspensionData = {
        city: userCity,
        province: 'Batangas',
        status: 'active',
        levels: data.levels,
        issuedBy: {
          name: user.displayName || user.email,
          title: `Mayor of ${userCity}`,
          office: `${userCity} City Hall`,
          role: 'mayor'
        },
        criteria: cityWeather?.criteria || {},
        aiAnalysis: {
          recommendation: recommendation?.recommendation?.action || 'manual',
          confidence: recommendation?.riskScore || 0,
          reportCount: 0, // TODO: Get from barangay insights
          criticalReports: 0,
          summary: data.customMessage || 'City-wide suspension issued by mayor',
          justification: data.customMessage || 'Suspension issued based on current weather conditions',
          riskLevel: recommendation?.recommendation?.level || 'moderate'
        },
        issuedAt: now,
        effectiveFrom: now,
        effectiveUntil,
        durationHours: data.durationHours,
        message: data.customMessage || `Class suspension issued for ${userCity}`,
        reason: cityWeather?.autoSuspend?.triggers.map(t => t.description).join(', ') || 'Weather conditions',
        isAutoSuspended: false,
        notificationSent: false
      };

      await createSuspension(suspensionData);

      // Reload suspension history (activeSuspensions updates automatically via real-time subscription)
      await loadSuspensionHistory();

      setShowSuspendModal(false);
      alert('✅ Suspension issued successfully!');
    } catch (error) {
      console.error('Error issuing suspension:', error);
      alert(`❌ Failed to issue suspension: ${error.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle extend suspension
  const handleExtendSuspension = async (data) => {
    if (!activeSuspension) return;

    setProcessingAction(true);
    try {
      const currentEnd = new Date(activeSuspension.effectiveUntil);
      const newEnd = new Date(currentEnd.getTime() + data.extendHours * 60 * 60 * 1000);

      await extendSuspension(activeSuspension.id, {
        newEffectiveUntil: newEnd,
        reason: `Extended by ${data.extendHours} hours`
      });

      // activeSuspensions updates automatically via real-time subscription
      setShowManagementPanel(false);
      alert('✅ Suspension extended successfully!');
    } catch (error) {
      console.error('Error extending suspension:', error);
      alert(`❌ Failed to extend suspension: ${error.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle edit message
  const handleEditMessage = async (data) => {
    if (!activeSuspension) return;

    setProcessingAction(true);
    try {
      await updateSuspension(activeSuspension.id, {
        message: data.newMessage,
        updates: [
          ...(activeSuspension.updates || []),
          {
            type: 'message_updated',
            timestamp: new Date(),
            by: user.displayName || user.email,
            oldMessage: activeSuspension.message,
            newMessage: data.newMessage
          }
        ]
      });

      // activeSuspensions updates automatically via real-time subscription
      setShowManagementPanel(false);
      alert('✅ Message updated successfully!');
    } catch (error) {
      console.error('Error updating message:', error);
      alert(`❌ Failed to update message: ${error.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle lift suspension
  const handleLiftSuspension = async (data) => {
    if (!activeSuspension) return;

    setProcessingAction(true);
    try {
      await liftSuspension(activeSuspension.id, {
        updates: [
          {
            type: 'lifted_early',
            timestamp: new Date(),
            by: user.displayName || user.email,
            reason: data.reason || 'Conditions improved'
          }
        ]
      });

      // Reload suspension history (activeSuspensions updates automatically via real-time subscription)
      await loadSuspensionHistory();
      setShowManagementPanel(false);
      alert('✅ Suspension lifted successfully!');
    } catch (error) {
      console.error('Error lifting suspension:', error);
      alert(`❌ Failed to lift suspension: ${error.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle management panel confirm
  const handleManagementConfirm = async (data) => {
    if (managementAction === 'extend') {
      await handleExtendSuspension(data);
    } else if (managementAction === 'edit') {
      await handleEditMessage(data);
    } else if (managementAction === 'lift') {
      await handleLiftSuspension(data);
    }
  };

  // Open management panel
  const openManagementPanel = (action) => {
    setManagementAction(action);
    setShowManagementPanel(true);
  };

  if (!userCity) {
    return (
      <div className="p-6">
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>No City Assigned</strong>
            <p className="mt-1">You don't have an assigned city. Please contact the administrator.</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            {userCity} Suspension Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Monitor weather conditions and manage city-wide suspensions</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Active Suspension Banner */}
      {activeSuspension && (
        <ActiveSuspensionBanner
          suspension={activeSuspension}
          onExtend={() => openManagementPanel('extend')}
          onLift={() => openManagementPanel('lift')}
          onEditMessage={() => openManagementPanel('edit')}
        />
      )}

      {/* Weather Monitoring Grid */}
      <WeatherMonitoringGrid weatherData={cityWeather?.criteria} />

      {/* Decision Support Widget + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DecisionSupportWidget
            weatherData={cityWeather?.criteria}
            aiRecommendation={recommendation?.recommendation}
            reportCount={0} // TODO: Get from barangay insights
            criticalReports={0}
            historicalSuspensions={suspensionHistory}
            onIssueSuspension={() => setShowSuspendModal(true)}
          />
        </div>

        {/* Quick Actions Panel */}
        <Card className="p-6 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
          </div>

          <div className="space-y-3">
            {/* Primary Action - Issue Suspension */}
            <Button
              onClick={() => setShowSuspendModal(true)}
              disabled={!!activeSuspension}
              variant="destructive"
              className="w-full font-semibold py-4 text-base h-auto"
            >
              <AlertTriangle className="w-5 h-5 mr-2" />
              Issue City-Wide Suspension
            </Button>

            {/* Management Actions (when suspension is active) */}
            {activeSuspension ? (
              <>
                <div className="pt-2 pb-2 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Manage Active Suspension</p>
                </div>

                <Button
                  onClick={() => openManagementPanel('extend')}
                  variant="outline"
                  className="w-full !border-2 !border-blue-400 !text-blue-700 hover:!bg-blue-50 font-medium py-3 h-auto"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Extend Suspension
                </Button>

                <Button
                  onClick={() => openManagementPanel('edit')}
                  variant="outline"
                  className="w-full !border-2 !border-amber-400 !text-amber-700 hover:!bg-amber-50 font-medium py-3 h-auto"
                >
                  Edit Message
                </Button>

                <Button
                  onClick={() => openManagementPanel('lift')}
                  variant="outline"
                  className="w-full !border-2 !border-red-400 !text-red-700 hover:!bg-red-50 font-medium py-3 h-auto"
                >
                  Lift Suspension Early
                </Button>
              </>
            ) : (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold text-gray-900">No Active Suspension</span>
                </p>
                <p className="text-xs text-gray-500">
                  Issue a suspension when weather conditions warrant class cancellations for {userCity}.
                </p>
              </div>
            )}

            {/* Status Info */}
            {activeSuspension && (
              <div className="pt-3 border-t border-gray-200 bg-blue-50 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900">✓ Active suspension in effect</p>
                <p className="text-xs text-blue-700 mt-1">
                  Cannot issue new suspension while one is active
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Suspension History */}
      <SuspensionHistoryCard suspensions={suspensionHistory} />

      {/* Barangay Insights */}
      <BarangayInsightsPanel city={userCity} />

      {/* Modals */}
      <QuickSuspendModal
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        onConfirm={handleIssueSuspension}
        cityName={userCity}
        weatherData={cityWeather?.criteria}
        aiRecommendation={recommendation?.recommendation}
        isLoading={processingAction}
      />

      <SuspensionManagementPanel
        isOpen={showManagementPanel}
        onClose={() => setShowManagementPanel(false)}
        suspension={activeSuspension}
        action={managementAction}
        onConfirm={handleManagementConfirm}
        isLoading={processingAction}
      />
    </div>
  );
};

export default MayorDashboard;
