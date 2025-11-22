import React, { useState } from 'react';
import { Database, Trash2, Upload, Info, CheckCircle, AlertCircle, Cloud, CloudRain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { resetDatabase, clearAllReports, clearAllWeatherData, seedWeatherData, getScenarioInfo } from '../../utils/seedDatabase';

export const DatabaseSeeder = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [showClearWeatherModal, setShowClearWeatherModal] = useState(false);
  const [showClearReportsModal, setShowClearReportsModal] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const scenarios = getScenarioInfo();

  const handleSeed = async () => {
    setShowScenarioModal(false);
    setLoading(true);
    setResult(null);

    try {
      const response = await resetDatabase(selectedScenario);
      setResult(response);

      // Trigger refresh event
      window.dispatchEvent(new Event('dataRefresh'));
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
      setSelectedScenario(null);
    }
  };

  const handleClear = async () => {
    setShowClearReportsModal(false);
    setLoading(true);
    setResult(null);

    try {
      const response = await clearAllReports();
      setResult(response);

      // Trigger refresh event
      window.dispatchEvent(new Event('dataRefresh'));
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadWeather = async () => {
    setShowWeatherModal(false);
    setLoading(true);
    setResult(null);

    try {
      const response = await seedWeatherData();
      setResult(response);

      // Trigger refresh event
      window.dispatchEvent(new Event('dataRefresh'));
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClearWeather = async () => {
    setShowClearWeatherModal(false);
    setLoading(true);
    setResult(null);

    try {
      const response = await clearAllWeatherData();
      setResult(response);

      // Trigger refresh event
      window.dispatchEvent(new Event('dataRefresh'));
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Database Seeder</h1>
          <p className="text-sm text-gray-600">Populate database with test data for development</p>
        </div>
      </div>

      {/* Result Message */}
      {result && (
        <Card className={`border-2 ${result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div>
                <p className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? 'Success!' : 'Error'}
                </p>
                <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.success
                    ? result.count !== undefined
                      ? `${result.count} reports ${result.count ? 'added' : 'deleted'} successfully${result.weatherCount ? ` + ${result.weatherCount} critical weather records` : ''}`
                      : result.deleted !== undefined
                      ? `${result.deleted} items deleted successfully`
                      : 'Operation completed successfully'
                    : result.error}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(scenarios).map(([key, scenario]) => (
          <Card key={key} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{scenario.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {scenario.description}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {key === 'fullDataset' ? '~98 reports' :
                   key === 'highConfidence' ? '~110 reports' :
                   key === 'mediumConfidence' ? '15 reports' : '12 reports'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Info className="w-4 h-4" />
                <span>{scenario.recommended}</span>
              </div>
              <Button
                onClick={() => {
                  setSelectedScenario(key);
                  setShowScenarioModal(true);
                }}
                disabled={loading}
                className="w-full"
                size="sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                {loading ? 'Loading...' : 'Load This Scenario'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weather Data Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <CloudRain className="w-5 h-5" />
            Critical Weather Test Data
          </CardTitle>
          <CardDescription className="text-blue-700">
            Load or clear critical weather conditions for suspension system testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              What's Included (All 34 Cities - 18 with severe weather):
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• <strong>CRITICAL (3 cities):</strong> Lipa City (65 km/h, 45mm), Nasugbu (62 km/h, 42mm), Calatagan (60 km/h, 40mm)</li>
              <li>• <strong>HIGH (7 cities):</strong> Batangas City, Tanauan City, Lemery, Taal, Bauan, San Juan, Lobo (51-58 km/h winds, 31-38mm rainfall)</li>
              <li>• <strong>MEDIUM (8 cities):</strong> Santo Tomas, Rosario, Ibaan, Cuenca, Malvar, San Pascual, Alitagtag, Laurel (40-45 km/h winds, 20-25mm rainfall)</li>
              <li>• <strong>LOW (16 cities):</strong> All remaining municipalities with normal to light rain conditions</li>
            </ul>
            <p className="text-xs text-gray-600 mt-2">Perfect for testing the suspension system with province-wide weather emergency simulation</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setShowWeatherModal(true)}
              disabled={loading}
              style={{ backgroundColor: '#2563eb', color: 'white' }}
              className="hover:bg-blue-700 font-semibold shadow-md"
              size="default"
            >
              <Cloud className="w-5 h-5 mr-2" />
              {loading ? 'Loading...' : 'Load Weather Data'}
            </Button>
            <Button
              onClick={() => setShowClearWeatherModal(true)}
              disabled={loading}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100 font-semibold"
              size="default"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              {loading ? 'Clearing...' : 'Clear Weather'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-red-700">
            Permanently delete all reports, suspensions, and announcements from the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setShowClearReportsModal(true)}
            disabled={loading}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {loading ? 'Deleting...' : 'Clear All Reports'}
          </Button>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700">
          <p><strong>1. Full Dataset:</strong> Best for comprehensive testing. Includes Lipa City with 45 reports (high confidence - should recommend suspension), Batangas City with 18 reports, and scattered reports across other cities. Also seeds severe weather data for 18 cities (3 critical, 7 high, 8 medium severity).</p>

          <p><strong>2. High Confidence Scenario:</strong> Multi-city crisis simulation with ~110 reports across 7+ cities. Lipa City (45), Batangas City (28), Tanauan City (22), plus Santo Tomas, Rosario, Ibaan, and Taal. Includes province-wide severe weather conditions (18 cities affected) for realistic suspension testing.</p>

          <p><strong>3. Medium Confidence Scenario:</strong> Test borderline cases. Tanauan City will have 15 reports with ~65-75% confidence. Includes moderate weather alerts.</p>

          <p><strong>4. Low Confidence Scenario:</strong> Test how the system handles scattered reports. 12 reports spread across 8 different cities (Mabini, San Juan, Balayan, Lemery, Nasugbu, Bauan, San Pascual, Calaca) with varying weather conditions from fair to light rain.</p>

          <p className="mt-4 pt-4 border-t text-xs text-gray-600">
            <strong>Weather Data:</strong> Each scenario automatically seeds weather data for all 34 cities, with 18 cities experiencing severe conditions: 3 CRITICAL (Lipa City, Nasugbu, Calatagan with typhoon conditions 60-65 km/h winds, 40-45mm rainfall), 7 HIGH (Batangas City, Tanauan City, Lemery, Taal, Bauan, San Juan, Lobo with 51-58 km/h winds, 31-38mm rainfall), and 8 MEDIUM (Santo Tomas, Rosario, Ibaan, Cuenca, Malvar, San Pascual, Alitagtag, Laurel with 40-45 km/h winds, 20-25mm rainfall). This ensures realistic province-wide emergency simulation for the suspension advisory system.
          </p>

          <p className="mt-2 text-xs text-gray-600">
            <strong>Note:</strong> Each scenario will clear existing data first. Make sure to backup any important reports before using this tool. Weather data and reports will automatically appear in the dashboard and all panels.
          </p>
        </CardContent>
      </Card>

      {/* Weather Data Modal */}
      {showWeatherModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowWeatherModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6"
            style={{ width: '420px', maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <CloudRain className="w-8 h-8 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Load Critical Weather Data</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This will load critical weather data for testing the suspension system. Continue?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowWeatherModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLoadWeather}
                style={{ backgroundColor: '#2563eb', color: 'white' }}
                className="flex-1 font-semibold hover:opacity-90"
              >
                <Cloud className="w-4 h-4 mr-2" />
                OK
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Modal */}
      {showScenarioModal && selectedScenario && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowScenarioModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6"
            style={{ width: '420px', maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <Upload className="w-8 h-8 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Load Test Scenario</h3>
            </div>
            <p className="text-gray-600 mb-2">
              This will clear all existing reports and add test data for:
            </p>
            <p className="text-lg font-semibold text-gray-900 mb-6">
              {scenarios[selectedScenario].name}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowScenarioModal(false);
                  setSelectedScenario(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSeed}
                style={{ backgroundColor: '#9333ea', color: 'white' }}
                className="flex-1 font-semibold hover:opacity-90"
              >
                <Upload className="w-4 h-4 mr-2" />
                OK
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Weather Modal */}
      {showClearWeatherModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowClearWeatherModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6"
            style={{ width: '420px', maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">Clear Weather Data</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This will DELETE ALL WEATHER DATA from the database. Continue?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowClearWeatherModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleClearWeather}
                style={{ backgroundColor: '#DC2626', color: 'white' }}
                className="flex-1 font-semibold hover:opacity-90"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                OK
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Reports Modal */}
      {showClearReportsModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowClearReportsModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6"
            style={{ width: '420px', maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">Clear All Reports</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This will DELETE ALL REPORTS, SUSPENSIONS, and ANNOUNCEMENTS (mayor/governor posts) from the database. This action cannot be undone. Continue?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowClearReportsModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleClear}
                style={{ backgroundColor: '#DC2626', color: 'white' }}
                className="flex-1 font-semibold hover:opacity-90"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
