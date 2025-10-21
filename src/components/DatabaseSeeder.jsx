import React, { useState } from 'react';
import { Database, Trash2, Upload, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { resetDatabase, clearAllReports, getScenarioInfo } from '../utils/seedDatabase';

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
                    ? `${result.count || result.deleted || 0} reports ${result.count ? 'added' : 'deleted'} successfully`
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
          <p><strong>1. Full Dataset:</strong> Best for comprehensive testing. Includes Lipa City with 45 reports (high confidence - should recommend suspension), Batangas City with 18 reports, and scattered reports across other cities.</p>

          <p><strong>2. High Confidence Scenario:</strong> Use this to test the suspension feature. Lipa City will have 45 reports with ~89% AI confidence and should show "Issue Class Suspension" button enabled.</p>

          <p><strong>3. Medium Confidence Scenario:</strong> Test borderline cases. Tanauan City will have 15 reports with ~65-75% confidence.</p>

          <p><strong>4. Low Confidence Scenario:</strong> Test how the system handles few reports. Only 5 scattered reports with low confidence (~40-50%).</p>

          <p className="mt-4 pt-4 border-t text-xs text-gray-600">
            <strong>Note:</strong> Each scenario will clear existing data first. Make sure to backup any important reports before using this tool.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
