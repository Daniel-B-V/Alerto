# Class Suspension Prediction System

## Overview

The **Class Suspension Predictor** is an AI-powered system that analyzes real-time weather data from OpenWeather API to predict the likelihood of class suspensions in Batangas Province.

## How It Works

### Prediction Algorithm

The system calculates a risk score (0-100) based on multiple weather factors:

#### 1. Rainfall Criteria (Primary Factor)
| Rainfall (mm/h) | Risk Points | Classification |
|-----------------|-------------|----------------|
| > 20mm          | +40         | Heavy rainfall - High risk |
| > 10mm          | +25         | Moderate rainfall - Medium risk |
| > 5mm           | +10         | Light rainfall - Low risk |

#### 2. Wind Speed Criteria
| Wind Speed (km/h) | Risk Points | Classification |
|-------------------|-------------|----------------|
| > 60 km/h         | +35         | Strong winds - High risk |
| > 40 km/h         | +20         | Gusty winds - Medium risk |
| > 30 km/h         | +10         | Moderate winds - Low risk |

#### 3. Weather Conditions
| Condition       | Risk Points | Classification |
|-----------------|-------------|----------------|
| Thunderstorm    | +25         | Severe weather |
| Storm           | +25         | Severe weather |

#### 4. Temperature Extremes
| Temperature | Risk Points | Classification |
|-------------|-------------|----------------|
| > 38°C      | +15         | Extreme heat |

### Risk Level Classification

Based on the total risk score:

| Risk Score | Likelihood | Suspension Probability | Color Code |
|------------|------------|------------------------|------------|
| 70-100     | VERY HIGH  | 85%                   | Red        |
| 50-69      | HIGH       | 65%                   | Orange     |
| 30-49      | MODERATE   | 40%                   | Yellow     |
| 15-29      | LOW        | 15%                   | Blue       |
| 0-14       | VERY LOW   | 5%                    | Green      |

## Features

### 1. Main Prediction Card
- Large percentage display (0-100%)
- Risk level badge (VERY HIGH, HIGH, MODERATE, LOW, VERY LOW)
- Color-coded background (Red, Orange, Yellow, Blue, Green)
- Visual icon indicators

### 2. Contributing Factors
Lists specific weather conditions contributing to the risk:
- Heavy/Moderate rainfall in specific cities
- Strong wind warnings
- Thunderstorm alerts
- Extreme temperature warnings

### 3. Affected Cities
Shows which cities are potentially affected by severe weather conditions.

### 4. Recommendations
Provides actionable advice based on risk level:
- **VERY HIGH**: Strong recommendation for suspension
- **HIGH**: High likelihood, stay alert
- **MODERATE**: Monitor closely
- **LOW**: Continue monitoring
- **VERY LOW**: Normal operations expected

### 5. City-by-City Weather Cards
Individual cards for 8 Batangas cities showing:
- Current temperature
- Weather description
- Rainfall (color-coded by severity)
- Wind speed (color-coded by severity)
- Humidity
- Risk level badge (HIGH, MEDIUM, LOW, NORMAL)

### 6. Province-wide Statistics
- Average temperature across province
- Number of high-risk areas
- Number of moderate-risk areas
- Number of normal-condition areas

## Monitored Cities

1. Batangas City
2. Lipa City
3. Tanauan City
4. Santo Tomas
5. Taal
6. Balayan
7. Nasugbu
8. Lemery

## Data Source

- **Primary**: OpenWeather API
- **Update Frequency**: Every 10 minutes (auto-refresh)
- **Manual Refresh**: Available via "Refresh Data" button

## Visual Indicators

### Color Coding System

**Risk Levels:**
- 🔴 **Red** - Very High/High Risk (Class suspension likely)
- 🟠 **Orange** - High/Moderate Risk (Monitor closely)
- 🟡 **Yellow** - Moderate/Low Risk (Be prepared)
- 🔵 **Blue** - Low Risk (Normal monitoring)
- 🟢 **Green** - Very Low/Normal (Safe conditions)

**Weather Metrics:**
- **Rainfall > 10mm/h**: Red text
- **Rainfall > 5mm/h**: Orange text
- **Wind > 40 km/h**: Red text
- **Wind > 30 km/h**: Orange text

## Usage

### Accessing the Predictor

1. Login to Alerto
2. Navigate to **Analytics** in the sidebar
3. View the Class Suspension Prediction at the top of the page

### Interpreting Results

#### Very High Risk (85% probability)
- **Action**: Strong recommendation for class suspension
- **What to do**: Monitor official LGU announcements
- **Expect**: Severe weather conditions

#### High Risk (65% probability)
- **Action**: High likelihood of suspension
- **What to do**: Stay alert for announcements
- **Expect**: Heavy rainfall or strong winds

#### Moderate Risk (40% probability)
- **Action**: Monitor conditions closely
- **What to do**: Be prepared for possible changes
- **Expect**: Changing weather conditions

#### Low Risk (15% probability)
- **Action**: Continue normal monitoring
- **What to do**: Check periodic updates
- **Expect**: Mostly normal conditions

#### Very Low Risk (5% probability)
- **Action**: Classes expected to proceed
- **What to do**: Routine monitoring
- **Expect**: Favorable weather

## Technical Implementation

### Prediction Function
Located in: `src/components/AnalyticsPanel.jsx`

```javascript
const predictClassSuspension = (weatherData) => {
  // Analyzes weather data from all 8 cities
  // Calculates risk score based on multiple factors
  // Returns prediction with percentage and recommendations
}
```

### State Management
- `suspensionPrediction`: Main prediction object
- `citiesWeather`: Array of city weather data
- `weatherStats`: Province-wide statistics
- Auto-refresh: Every 10 minutes

## Advantages Over PAGASA Integration

### Why We Removed PAGASA:
1. ❌ Required backend proxy server
2. ❌ Complex setup and dependencies
3. ❌ Inconsistent data availability
4. ❌ Additional failure points
5. ❌ Messy data presentation

### Why OpenWeather-Only is Better:
1. ✅ **Simpler**: Direct API integration
2. ✅ **Reliable**: Proven uptime and accuracy
3. ✅ **Real-time**: 10-minute updates
4. ✅ **Clean**: Clear, organized data
5. ✅ **Predictive**: AI-powered risk calculation
6. ✅ **Actionable**: Clear recommendations
7. ✅ **Visual**: Color-coded for easy understanding

## Example Scenarios

### Scenario 1: Typhoon Approaching
```
Weather Conditions:
- Rainfall: 35mm/h in Batangas City
- Wind: 75 km/h
- Condition: Thunderstorm

Prediction Result:
- Risk Score: 100 (40+35+25)
- Likelihood: VERY HIGH
- Percentage: 85%
- Recommendation: Strong suspension recommendation
- Affected Cities: All 8 cities
```

### Scenario 2: Normal Day
```
Weather Conditions:
- Rainfall: 0mm/h
- Wind: 15 km/h
- Condition: Clear

Prediction Result:
- Risk Score: 0
- Likelihood: VERY LOW
- Percentage: 5%
- Recommendation: Normal operations
- Affected Cities: None
```

### Scenario 3: Light Rain
```
Weather Conditions:
- Rainfall: 7mm/h in Lipa City
- Wind: 25 km/h
- Condition: Light Rain

Prediction Result:
- Risk Score: 10
- Likelihood: VERY LOW to LOW
- Percentage: 5-15%
- Recommendation: Monitor conditions
- Affected Cities: Lipa City
```

## Best Practices

### For Users:
1. Check the predictor regularly (morning and afternoon)
2. Don't rely solely on the prediction - monitor official LGU announcements
3. Use the city-by-city breakdown for local conditions
4. Share predictions with your community

### For Administrators:
1. Set up auto-refresh notifications
2. Cross-reference with official weather bulletins
3. Use as a decision-support tool, not final authority
4. Keep historical data for accuracy improvement

## Future Enhancements

Planned improvements:
- [ ] Historical accuracy tracking
- [ ] Machine learning model training
- [ ] Integration with LGU announcement systems
- [ ] Push notifications for high-risk conditions
- [ ] 24-hour forecast predictions
- [ ] Flood risk mapping
- [ ] School-specific notifications

## Disclaimer

**IMPORTANT**: This is a prediction system based on weather data analysis. It does not replace official announcements from:
- Department of Education (DepEd)
- Local Government Units (LGUs)
- Provincial Disaster Risk Reduction and Management Office (PDRRMO)

Always follow official government announcements for class suspension decisions.

## Support

For questions or issues:
1. Check browser console for errors
2. Verify OpenWeather API is working
3. Ensure internet connection is stable
4. Try manual refresh
5. Check TROUBLESHOOTING.md

---

**Built to help keep students and teachers safe during severe weather conditions.**

**Data Source**: OpenWeather API
**Update Frequency**: Every 10 minutes
**Coverage**: 8 cities in Batangas Province
**Accuracy**: Based on real-time meteorological data
