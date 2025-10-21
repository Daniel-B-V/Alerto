// Weather API Test Utility
// This file helps test the OpenWeather API connection

const API_KEY = '13616e53cdfb9b00c018abeaa05e9784';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Test current weather API for Batangas
 */
export async function testCurrentWeather() {
  try {
    console.log('🌤️ Testing OpenWeather API connection...');

    const url = `${BASE_URL}/weather?q=Batangas,PH&appid=${API_KEY}&units=metric`;
    console.log('Fetching:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('✅ API Connection Successful!');
    console.log('📍 Location:', data.name, data.sys.country);
    console.log('🌡️ Temperature:', Math.round(data.main.temp), '°C');
    console.log('💧 Humidity:', data.main.humidity, '%');
    console.log('🌬️ Wind Speed:', Math.round(data.wind.speed * 3.6), 'km/h');
    console.log('☁️ Weather:', data.weather[0].main, '-', data.weather[0].description);

    if (data.rain) {
      console.log('🌧️ Rainfall (1h):', data.rain['1h'] || 0, 'mm');
    }

    return {
      success: true,
      data: {
        location: data.name,
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6),
        weather: data.weather[0].description,
        icon: data.weather[0].icon
      }
    };
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test weather forecast API
 */
export async function testWeatherForecast() {
  try {
    console.log('🔮 Testing Weather Forecast API...');

    const url = `${BASE_URL}/forecast?q=Batangas,PH&appid=${API_KEY}&units=metric`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('✅ Forecast API Successful!');
    console.log('📊 Forecast Points:', data.list.length);
    console.log('⏰ Next 3-hour forecast:');

    // Show next 3 forecasts
    data.list.slice(0, 3).forEach((item, index) => {
      const time = new Date(item.dt * 1000);
      console.log(`  ${index + 1}. ${time.toLocaleString()}: ${Math.round(item.main.temp)}°C, ${item.weather[0].description}`);
    });

    return { success: true, forecastCount: data.list.length };
  } catch (error) {
    console.error('❌ Forecast Test Failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Run all weather API tests
 */
export async function runAllTests() {
  console.log('\n═══════════════════════════════════════');
  console.log('    OPENWEATHER API TEST SUITE');
  console.log('═══════════════════════════════════════\n');

  const results = {
    currentWeather: await testCurrentWeather(),
    forecast: await testWeatherForecast()
  };

  console.log('\n═══════════════════════════════════════');
  console.log('    TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log('Current Weather:', results.currentWeather.success ? '✅ PASS' : '❌ FAIL');
  console.log('Weather Forecast:', results.forecast.success ? '✅ PASS' : '❌ FAIL');
  console.log('═══════════════════════════════════════\n');

  return results;
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  window.testWeatherAPI = {
    testCurrentWeather,
    testWeatherForecast,
    runAllTests
  };
  console.log('💡 Weather API test functions available in console:');
  console.log('   - window.testWeatherAPI.testCurrentWeather()');
  console.log('   - window.testWeatherAPI.testWeatherForecast()');
  console.log('   - window.testWeatherAPI.runAllTests()');
}
