import React, { useState } from 'react';
import { Database, Trash2, Upload, Info, CheckCircle, AlertCircle, Cloud, CloudRain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { resetDatabase, clearAllReports, clearAllWeatherData, seedWeatherData, getScenarioInfo } from '../utils/seedDatabase';

export const DatabaseSeeder = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const scenarios = getScenarioInfo();

  const handleSeed = async (scenario) => {
    if (!window.confirm(`This will clear all existing reports and add test data for: ${scenarios[scenario].name}. Continue?`)) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await resetDatabase(scenario);
      setResult(response);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('This will DELETE ALL REPORTS from the database. This action cannot be undone. Continue?')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await clearAllReports();
      setResult(response);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadWeather = async () => {
    if (!window.confirm('This will load critical weather data for testing the suspension system. Continue?')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await seedWeatherData();
      setResult(response);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClearWeather = async () => {
    if (!window.confirm('This will DELETE ALL WEATHER DATA from the database. Continue?')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await clearAllWeatherData();
      setResult(response);
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
                   key === 'highConfidence' ? '45 reports' :
                   key === 'mediumConfidence' ? '15 reports' : '5 reports'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Info className="w-4 h-4" />
                <span>{scenario.recommended}</span>
              </div>
              <Button
                onClick={() => handleSeed(key)}
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
              What's Included:
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• <strong>Lipa City:</strong> Typhoon conditions (65 km/h winds, 45mm rainfall)</li>
              <li>• <strong>Batangas City:</strong> Heavy rain (58 km/h winds, 38mm rainfall)</li>
              <li>• <strong>Tanauan City:</strong> Severe thunderstorm (52 km/h winds, 32mm rainfall)</li>
              <li>• <strong>Santo Tomas & Taal:</strong> Moderate rain conditions</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleLoadWeather}
              disabled={loading}
              style={{ backgroundColor: '#2563eb', color: 'white' }}
              className="hover:bg-blue-700 font-semibold shadow-md"
              size="default"
            >
              <Cloud className="w-5 h-5 mr-2" />
              {loading ? 'Loading...' : 'Load Weather Data'}
            </Button>
            <Button
              onClick={handleClearWeather}
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
            Permanently delete all reports from the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleClear}
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
          <p><strong>1. Full Dataset:</strong> Best for comprehensive testing. Includes Lipa City with 45 reports (high confidence - should recommend suspension), Batangas City with 18 reports, and scattered reports across other cities. Also seeds critical weather data for suspension testing.</p>

          <p><strong>2. High Confidence Scenario:</strong> Use this to test the suspension feature. Lipa City will have 45 reports with ~89% AI confidence and should show "Issue Class Suspension" button enabled. Includes typhoon-level weather conditions (65 km/h winds, 45mm rainfall).</p>

          <p><strong>3. Medium Confidence Scenario:</strong> Test borderline cases. Tanauan City will have 15 reports with ~65-75% confidence. Includes moderate weather alerts.</p>

          <p><strong>4. Low Confidence Scenario:</strong> Test how the system handles few reports. Only 5 scattered reports with low confidence (~40-50%). Light weather conditions.</p>

          <p className="mt-4 pt-4 border-t text-xs text-gray-600">
            <strong>Weather Data:</strong> Each scenario automatically seeds critical weather data including typhoon conditions in Lipa City (65 km/h winds, 45mm rainfall), heavy rain in Batangas City (58 km/h winds, 38mm rainfall), and moderate conditions in other cities. This triggers the suspension advisory system.
          </p>

          <p className="mt-2 text-xs text-gray-600">
            <strong>Note:</strong> Each scenario will clear existing data first. Make sure to backup any important reports before using this tool.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
