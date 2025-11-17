import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Wind, AlertCircle, TestTube } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { getPhilippinesTyphoons, getTestTyphoons } from '../../services/typhoonService';
import TyphoonMap from './TyphoonMap';
import StormDetailsPanel from './StormDetailsPanel';
import TyphoonTimeline from './TyphoonTimeline';

/**
 * TyphoonTracker Component
 * Main component that integrates map and details panel with auto-refresh
 */
export function TyphoonTracker() {
  const [typhoons, setTyphoons] = useState([]);
  const [selectedTyphoon, setSelectedTyphoon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [useTestData, setUseTestData] = useState(false);
  const [isTestDataMode, setIsTestDataMode] = useState(false);
  const [selectedTimelineDate, setSelectedTimelineDate] = useState(null);

  // Auto-refresh interval (10 minutes)
  const REFRESH_INTERVAL = 10 * 60 * 1000;

  /**
   * Load typhoon data
   */
  const loadTyphoonData = useCallback(async (showLoading = true, forceTestData = false) => {
    try {
      if (showLoading) {
        setIsRefreshing(true);
      }
      setError(null);

      let data;
      let isTest = forceTestData || useTestData;

      if (isTest) {
        console.log('🧪 Loading TEST typhoon data...');
        const result = await getTestTyphoons();
        data = result.data;
        setIsTestDataMode(true);
      } else {
        console.log('🌀 Loading REAL typhoon data from backend...');
        data = await getPhilippinesTyphoons();

        // Check if data is actually test data (auto-fallback from service)
        if (data.length > 0 && data[0].isTestData) {
          console.log('⚠️ Backend unavailable, auto-loaded test data');
          setIsTestDataMode(true);
        } else {
          setIsTestDataMode(false);
        }
      }

      setTyphoons(data);
      setLastUpdate(new Date());

      // Auto-select first typhoon if none selected
      if (data.length > 0 && !selectedTyphoon) {
        setSelectedTyphoon(data[0]);
      }

      console.log(`✅ Loaded ${data.length} typhoon(s) ${isTest || (data.length > 0 && data[0].isTestData) ? '(TEST DATA)' : '(REAL DATA)'}`);

      // Clear any previous errors since we have data
      setError(null);
    } catch (err) {
      console.error('❌ Error loading typhoons:', err);

      // Only show error if we have no fallback data
      setError('Unable to load typhoon data. Please try refreshing.');
      setTyphoons([]); // Clear any existing data
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedTyphoon, useTestData]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadTyphoonData();
  }, []);

  /**
   * Auto-refresh setup
   */
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing typhoon data...');
      loadTyphoonData(false);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [loadTyphoonData, REFRESH_INTERVAL]);

  /**
   * Manual refresh
   */
  const handleRefresh = () => {
    loadTyphoonData(true);
  };

  /**
   * Handle typhoon selection
   */
  const handleSelectTyphoon = (typhoon) => {
    setSelectedTyphoon(typhoon);
  };

  /**
   * Toggle between real and test data
   */
  const handleToggleTestData = () => {
    const newTestDataState = !useTestData;
    setUseTestData(newTestDataState);
    setSelectedTyphoon(null); // Reset selection
    loadTyphoonData(true, newTestDataState);
  };

  /**
   * Handle timeline date change
   */
  const handleTimelineDateChange = (date) => {
    setSelectedTimelineDate(date);
  };

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-gray-600">Loading typhoon data from NOAA ATCF...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content - Always show map (Unified Single Card) */}
      {!loading && (
        <Card className="bg-white border-gray-200 overflow-hidden">
          {/* Header - Inside Container */}
          <div className="flex items-center justify-between flex-wrap gap-4 px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Wind className="w-7 h-7 text-red-500" />
                Real-Time Typhoon Tracker
                {isTestDataMode && (
                  <Badge className="bg-yellow-500 text-white flex items-center gap-1">
                    <TestTube className="w-3 h-3" />
                    TEST MODE
                  </Badge>
                )}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Live tracking of tropical cyclones affecting the Philippines
              </p>
            </div>

            <div className="flex items-center gap-3">
              {lastUpdate && (
                <div className="text-sm text-gray-600">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
              <button
                onClick={handleToggleTestData}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  useTestData
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <TestTube className="w-4 h-4" />
                {useTestData ? 'Using Test Data' : 'Use Test Data'}
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[700px] gap-4 px-6 pb-6">
            {/* Left Side - Map and Timeline */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {/* Map Container */}
              <div className="relative flex-1 min-h-[500px] bg-white">
                <div className="h-full rounded-lg overflow-hidden border border-gray-200">
                  <TyphoonMap
                    typhoons={typhoons}
                    onTyphoonClick={handleSelectTyphoon}
                    selectedDate={selectedTimelineDate}
                  />
                </div>
              </div>

              {/* Timeline Control - Below Map - Only show when there's a selected typhoon */}
              {selectedTyphoon && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <TyphoonTimeline
                    typhoon={selectedTyphoon}
                    selectedDate={selectedTimelineDate}
                    onDateChange={handleTimelineDateChange}
                    compact={true}
                  />
                </div>
              )}
            </div>

            {/* Right Side - Storm Details (Full Height) */}
            <div className="lg:col-span-1 bg-white flex flex-col h-full">
              {/* Storm Details Section */}
              <div className="flex-1 overflow-y-auto pt-4 pb-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-500" />
                    <h3 className="font-bold text-lg text-gray-900">Active Storms</h3>
                  </div>
                  {typhoons.length > 0 ? (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                      {typhoons.length} active
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      0 active
                    </Badge>
                  )}
                </div>

                {typhoons.length > 0 ? (
                  <StormDetailsPanel
                    typhoons={typhoons}
                    selectedTyphoon={selectedTyphoon}
                    onSelectTyphoon={handleSelectTyphoon}
                  />
                ) : (
                  <Card className="bg-green-50 border-green-200 flex-1 flex flex-col">
                    <CardContent className="p-4 flex-1 flex items-center justify-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <Wind className="w-10 h-10 text-green-400" />
                        <div>
                          <h3 className="text-base font-bold text-gray-900 mb-1">No Active Typhoons</h3>
                          <p className="text-sm text-gray-600 mb-1">
                            There are currently no active tropical cyclones near the Philippines.
                          </p>
                          <p className="text-xs text-gray-500">
                            The Western Pacific basin is currently clear.
                          </p>
                        </div>
                        <button
                          onClick={handleToggleTestData}
                          className="flex items-center gap-2 px-3 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors"
                        >
                          <TestTube className="w-4 h-4" />
                          View Test Data for Demo
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Data Source Info - Always show */}
                <Card className={isTestDataMode ? "bg-yellow-50 border-yellow-300" : "bg-blue-50 border-blue-200"}>
                  <CardContent className="p-3">
                    <div className="text-xs space-y-2">
                      {isTestDataMode ? (
                        <>
                          <div className="font-semibold text-yellow-900 flex items-center gap-2">
                            <TestTube className="w-4 h-4" />
                            Test Data Mode
                          </div>
                          <div className="text-yellow-700">
                            Currently displaying synthetic test data for demonstration purposes.
                          </div>
                          <div className="text-yellow-600">
                            Sample typhoon:
                            <ul className="list-disc list-inside mt-1 ml-2">
                              <li>UWAN (Usagi) - Recent Nov 2025 typhoon approaching Northern Luzon</li>
                            </ul>
                          </div>
                          <div className="pt-2 border-t border-yellow-300 text-yellow-700 font-semibold">
                            ⚠️ This is NOT real typhoon data!
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-semibold text-blue-900">Data Source</div>
                          <div className="text-blue-700">
                            NOAA ATCF (Automated Tropical Cyclone Forecasting System)
                          </div>
                          <div className="text-blue-600">
                            Updates every 10 minutes • Western Pacific Basin
                          </div>
                          <div className="pt-2 border-t border-blue-200 text-blue-600">
                            For official warnings, please monitor{' '}
                            <a
                              href="https://www.pagasa.dost.gov.ph"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold underline hover:text-blue-800"
                            >
                              PAGASA
                            </a>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </Card>
      )}

    </div>
  );
}

export default TyphoonTracker;
