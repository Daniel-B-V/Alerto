// Gemini AI Service for Report Compilation and Analysis
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Analyze multiple community reports and compile them into a single executive summary
 * @param {Array} reports - Array of report objects with text, location, images, etc.
 * @returns {Object} Compiled report with severity, confidence, summary, and images
 */
export const compileReports = async (reports) => {
  try {
    if (!reports || reports.length === 0) {
      throw new Error('No reports provided');
    }

    // Prepare the prompt for Gemini
    const reportsText = reports.map((report, index) => {
      return `
Report ${index + 1}:
Location: ${report.location || 'Unknown'}
Time: ${report.timestamp || 'Unknown'}
Type: ${report.type || 'General'}
Description: ${report.description || report.text || ''}
Reporter: ${report.reporterName || 'Anonymous'}
${report.images && report.images.length > 0 ? `Images: ${report.images.length} attached` : 'No images'}
---`;
    }).join('\n');

    const prompt = `You are an AI assistant helping the Local Government Unit (LGU) analyze weather-related community reports for class suspension decisions.

Analyze these ${reports.length} community reports and provide:

1. **Severity Level**: Classify as "critical", "high", "medium", or "low"
   - Critical: Immediate danger, flooding, impassable roads, severe storm
   - High: Heavy rain, strong winds, potential flooding, safety concerns
   - Medium: Moderate weather conditions, some disruption
   - Low: Light rain, minor issues

2. **Confidence Score**: Percentage (0-100%) based on:
   - Number of reports from the same location
   - Consistency of descriptions
   - Severity of reported conditions

3. **Compiled Summary**: Create a concise, professional summary (100-150 words) that:
   - Highlights the main weather issue
   - Mentions the affected location(s)
   - Notes the number of sources/reports
   - Describes the impact (road conditions, flooding, etc.)
   - Is written for government officials to make quick decisions

4. **Key Points**: List 3-5 bullet points of the most critical information

5. **Recommendation**: Brief recommendation for the LGU (e.g., "Recommend class suspension", "Monitor situation", "No action needed")

Reports to analyze:
${reportsText}

Respond in JSON format:
{
  "severity": "critical|high|medium|low",
  "confidence": 85,
  "summary": "Your compiled summary here...",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "recommendation": "Your recommendation",
  "location": "Primary affected location",
  "sources": ${reports.length}
}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;

    // Parse JSON response from AI
    let compiledData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
      compiledData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback parsing
      compiledData = {
        severity: 'medium',
        confidence: 70,
        summary: aiResponse,
        keyPoints: ['Manual review recommended'],
        recommendation: 'Review reports manually',
        location: reports[0]?.location || 'Unknown',
        sources: reports.length
      };
    }

    // Collect all images from reports
    const allImages = reports.reduce((images, report) => {
      if (report.images && Array.isArray(report.images)) {
        return [...images, ...report.images];
      }
      return images;
    }, []);

    // Return compiled report
    return {
      id: `compiled_${Date.now()}`,
      severity: compiledData.severity,
      confidence: compiledData.confidence,
      summary: compiledData.summary,
      keyPoints: compiledData.keyPoints || [],
      recommendation: compiledData.recommendation,
      location: compiledData.location,
      sources: reports.length,
      images: allImages.slice(0, 10), // Limit to 10 images
      timestamp: new Date().toISOString(),
      originalReports: reports.map(r => ({
        id: r.id,
        location: r.location,
        timestamp: r.timestamp
      })),
      verified: true,
      compressed: `Compressed from ${reports.reduce((total, r) => total + (r.description?.split(' ').length || 0), 0)} words`
    };

  } catch (error) {
    console.error('Error compiling reports with Gemini:', error);
    throw error;
  }
};

/**
 * Analyze a single report with images for severity and authenticity
 * Uses current weather data to verify credibility
 * @param {Object} report - Single report with text and images
 * @param {Object} weatherData - Current weather data from OpenWeather API
 * @returns {Object} Analysis results
 */
export const analyzeReportWithImages = async (report, weatherData = null) => {
  try {
    const weatherInfo = weatherData ? `

CURRENT WEATHER DATA FOR ${weatherData.location?.city || 'the location'}:
- Temperature: ${weatherData.current?.temperature || 'N/A'}°C
- Weather Condition: ${weatherData.current?.weather?.description || 'N/A'}
- Rainfall: ${weatherData.current?.rainfall || 0}mm/h
- Wind Speed: ${weatherData.current?.windSpeed || 'N/A'} km/h
- Humidity: ${weatherData.current?.humidity || 'N/A'}%
- Cloudiness: ${weatherData.current?.cloudiness || 'N/A'}%

IMPORTANT: Compare the user's report with the actual weather data above. If they claim severe weather (storm, heavy rain, flooding, strong winds) but the weather data shows calm/clear conditions, mark it as NOT CREDIBLE.` : '';

    const parts = [{
      text: `Analyze this weather-related report and determine:
1. Severity level (critical/high/medium/low)
2. Credibility based on actual weather data (0-100%)
3. Brief assessment (2-3 sentences)
4. Whether the report is credible based on current weather

Report Details:
Location: ${report.location}
Description: ${report.description}
Type: ${report.type}${weatherInfo}

CREDIBILITY RULES:
- If report claims "storm/typhoon" but wind is <30km/h and rain is <5mm/h: LOW credibility (<40%)
- If report claims "flooding/heavy rain" but rainfall is 0mm/h and weather is clear: LOW credibility (<30%)
- If report claims "strong winds" but wind speed is <20km/h: LOW credibility (<35%)
- If weather data supports the report: HIGH credibility (>75%)

Respond in JSON:
{
  "severity": "critical/high/medium/low",
  "confidence": 85,
  "assessment": "your assessment explaining if weather data supports the report",
  "isAuthentic": true/false,
  "isCredible": true/false,
  "credibilityReason": "explanation why credible or not based on weather data"
}`
    }];

    // Add images if available
    if (report.images && report.images.length > 0) {
      for (const imageUrl of report.images.slice(0, 3)) { // Limit to 3 images
        try {
          // Fetch image and convert to base64
          const imageResponse = await fetch(imageUrl);
          const blob = await imageResponse.blob();
          const base64 = await blobToBase64(blob);

          parts.push({
            inlineData: {
              mimeType: blob.type,
              data: base64.split(',')[1] // Remove data:image/xxx;base64, prefix
            }
          });
        } catch (imgError) {
          console.error('Error processing image:', imgError);
        }
      }
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.3,
          topK: 32,
          topP: 1,
          maxOutputTokens: 512,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;

    // Parse JSON response
    const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
    const analysis = JSON.parse(jsonText);

    return {
      severity: analysis.severity || 'medium',
      confidence: analysis.confidence || 50,
      assessment: analysis.assessment || 'Report analyzed',
      isAuthentic: analysis.isAuthentic !== false,
      isCredible: analysis.isCredible !== false,
      credibilityReason: analysis.credibilityReason || analysis.assessment
    };

  } catch (error) {
    console.error('Error analyzing report with images:', error);
    return {
      severity: 'medium',
      confidence: 50,
      assessment: 'Unable to analyze report',
      isAuthentic: true,
      isCredible: true,
      credibilityReason: 'Analysis unavailable - manual review required'
    };
  }
};

/**
 * Helper function to convert blob to base64
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Group reports by location and time proximity
 * @param {Array} reports - All reports
 * @param {number} timeWindowMinutes - Time window in minutes to group reports
 * @returns {Array} Grouped reports
 */
export const groupReportsByLocationAndTime = (reports, timeWindowMinutes = 60) => {
  const groups = {};

  reports.forEach(report => {
    const location = report.location || 'Unknown';
    const timestamp = new Date(report.timestamp || Date.now());

    // Find existing group for this location within time window
    let groupKey = null;
    for (const key in groups) {
      const [groupLocation, groupTime] = key.split('_');
      if (groupLocation === location) {
        const timeDiff = Math.abs(timestamp - new Date(parseInt(groupTime))) / 1000 / 60;
        if (timeDiff <= timeWindowMinutes) {
          groupKey = key;
          break;
        }
      }
    }

    // Create new group if not found
    if (!groupKey) {
      groupKey = `${location}_${timestamp.getTime()}`;
      groups[groupKey] = [];
    }

    groups[groupKey].push(report);
  });

  return Object.values(groups);
};

/**
 * Get severity badge color
 */
export const getSeverityColor = (severity) => {
  const colors = {
    critical: { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
    high: { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500' },
    medium: { bg: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500' },
    low: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
  };
  return colors[severity] || colors.medium;
};

/**
 * Analyze community reports for class suspension advisory
 * @param {Array} reports - Array of community reports
 * @returns {Promise<Object>} Analysis with priority classification
 */
export const analyzeClassSuspensionReports = async (reports) => {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not configured. Using fallback analysis.');
    return fallbackClassSuspensionAnalysis(reports);
  }

  try {
    const reportsText = reports.slice(0, 50).map((report, index) => {
      return `${index + 1}. Location: ${report.location?.city || 'Unknown'}, ${report.location?.barangay || ''}
   Category: ${report.category || 'general'}
   Description: ${report.description || 'No description'}
   Severity: ${report.severity || 'unknown'}
   Time: ${report.createdAt ? new Date(report.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}`;
    }).join('\n\n');

    const prompt = `You are an AI assistant for Batangas Province disaster management system in the Philippines.
Analyze these community disaster reports and classify them by priority for class suspension decisions.

Instructions:
1. Classify each report as: Critical (immediate danger), Medium (monitor closely), or Low (normal conditions)
2. Identify patterns across locations (flooding, landslides, strong winds, etc.)
3. Count critical reports per city/municipality
4. Provide overall risk assessment
5. Recommend whether class suspension should be considered

Reports (${reports.length} total):
${reportsText}

Respond in JSON format:
{
  "summary": "Brief summary of overall situation",
  "totalReports": ${reports.length},
  "criticalCount": 0,
  "mediumCount": 0,
  "lowCount": 0,
  "affectedAreas": ["City1", "City2"],
  "mainThreats": ["flooding", "strong winds"],
  "priority": "Critical|Medium|Low",
  "recommendation": "Detailed recommendation for LGUs and schools",
  "suspensionAdvised": true|false,
  "reportsByLocation": {
    "CityName": {
      "critical": 0,
      "medium": 0,
      "low": 0,
      "mainIssues": ["flooding"]
    }
  }
}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error('No response from Gemini AI');
    }

    // Extract JSON from response
    let jsonText = aiResponse;
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
                      aiResponse.match(/```\s*([\s\S]*?)\s*```/);

    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const analysis = JSON.parse(jsonText.trim());

    return {
      success: true,
      analysis,
      rawResponse: aiResponse,
      source: 'gemini'
    };

  } catch (error) {
    console.error('Gemini AI class suspension analysis failed:', error);
    return fallbackClassSuspensionAnalysis(reports);
  }
};

/**
 * Analyze combined weather data and reports for suspension advisory
 * @param {Array} weatherData - Weather data for cities
 * @param {Array} reports - Community reports
 * @returns {Promise<Object>} Combined suspension analysis
 */
export const analyzeSuspensionAdvisory = async (weatherData, reports) => {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not configured. Using fallback suspension advisory.');
    return fallbackSuspensionAdvisory(weatherData, reports);
  }

  try {
    const weatherSummary = weatherData.map(city => {
      return `${city.location.city}: ${city.current.temperature}°C, ${city.current.description}
Rainfall: ${city.current.rainfall}mm/h, Wind: ${city.current.windSpeed} km/h, Humidity: ${city.current.humidity}%`;
    }).join('\n');

    const recentReports = reports.slice(0, 20).map((r, i) => {
      return `${i + 1}. [${r.category || 'general'}] ${r.location?.city || 'Unknown'}: ${r.description} (Severity: ${r.severity || 'unknown'})`;
    }).join('\n');

    const prompt = `You are a disaster management AI for Batangas Province, Philippines.
Analyze weather conditions and community reports to determine if class suspension should be recommended.

WEATHER DATA (OpenWeather API - ${weatherData.length} cities):
${weatherSummary}

COMMUNITY REPORTS (${reports.length} total, showing most recent):
${recentReports}

CRITERIA FOR CLASS SUSPENSION:
- Heavy rainfall (>20mm/h) OR Strong winds (>60km/h)
- Multiple flooding reports in school areas
- Landslides or infrastructure damage near schools
- Critical severity reports affecting transport routes
- Temperature extremes (>38°C)

Provide analysis in JSON format:
{
  "overallRisk": "Critical|High|Moderate|Low",
  "suspensionRecommended": true|false,
  "affectedCities": ["City1", "City2"],
  "riskFactors": ["heavy rainfall in Lipa", "5 flooding reports"],
  "weatherScore": 0-100,
  "reportsScore": 0-100,
  "combinedScore": 0-100,
  "advisory": "Detailed advisory message for LGUs, schools, and parents",
  "priorityActions": ["Issue immediate suspension", "Alert affected schools"],
  "expectedConditions": "Description of expected conditions in next 6-12 hours",
  "timestamp": "${new Date().toISOString()}"
}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    // Extract JSON
    let jsonText = aiResponse;
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
                      aiResponse.match(/```\s*([\s\S]*?)\s*```/);

    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const analysis = JSON.parse(jsonText.trim());

    return {
      success: true,
      analysis,
      source: 'gemini'
    };

  } catch (error) {
    console.error('Suspension advisory analysis failed:', error);
    return fallbackSuspensionAdvisory(weatherData, reports);
  }
};

/**
 * Fallback analysis for class suspension (when Gemini unavailable)
 */
const fallbackClassSuspensionAnalysis = (reports) => {
  const analysis = {
    summary: '',
    totalReports: reports.length,
    criticalCount: 0,
    mediumCount: 0,
    lowCount: 0,
    affectedAreas: new Set(),
    mainThreats: new Set(),
    priority: 'Low',
    recommendation: '',
    suspensionAdvised: false,
    reportsByLocation: {}
  };

  const criticalKeywords = ['flood', 'landslide', 'strong wind', 'typhoon', 'severe', 'emergency', 'impassable', 'evacuation', 'danger'];
  const mediumKeywords = ['rain', 'wind', 'weather', 'storm', 'warning', 'alert', 'slippery'];

  reports.forEach(report => {
    const text = `${report.description || ''} ${report.category || ''}`.toLowerCase();
    const city = report.location?.city || 'Unknown';

    analysis.affectedAreas.add(city);

    if (!analysis.reportsByLocation[city]) {
      analysis.reportsByLocation[city] = { critical: 0, medium: 0, low: 0, mainIssues: [] };
    }

    let isCritical = false;
    let isMedium = false;

    // Check severity field
    if (report.severity === 'critical' || report.severity === 'high') {
      isCritical = true;
    } else {
      // Check keywords
      for (const keyword of criticalKeywords) {
        if (text.includes(keyword)) {
          isCritical = true;
          analysis.mainThreats.add(keyword);
          analysis.reportsByLocation[city].mainIssues.push(keyword);
          break;
        }
      }

      if (!isCritical) {
        for (const keyword of mediumKeywords) {
          if (text.includes(keyword)) {
            isMedium = true;
            break;
          }
        }
      }
    }

    if (isCritical) {
      analysis.criticalCount++;
      analysis.reportsByLocation[city].critical++;
    } else if (isMedium) {
      analysis.mediumCount++;
      analysis.reportsByLocation[city].medium++;
    } else {
      analysis.lowCount++;
      analysis.reportsByLocation[city].low++;
    }

    if (report.category) {
      analysis.mainThreats.add(report.category);
    }
  });

  // Determine priority
  if (analysis.criticalCount >= 5) {
    analysis.priority = 'Critical';
    analysis.suspensionAdvised = true;
  } else if (analysis.criticalCount >= 2 || analysis.mediumCount >= 10) {
    analysis.priority = 'Medium';
    analysis.suspensionAdvised = false;
  } else {
    analysis.priority = 'Low';
    analysis.suspensionAdvised = false;
  }

  analysis.affectedAreas = Array.from(analysis.affectedAreas);
  analysis.mainThreats = Array.from(analysis.mainThreats);

  const threatsList = analysis.mainThreats.slice(0, 3).join(', ');
  analysis.summary = `${analysis.totalReports} community reports analyzed. ${analysis.criticalCount} critical alerts detected${threatsList ? ` involving ${threatsList}` : ''}.`;

  if (analysis.suspensionAdvised) {
    analysis.recommendation = `High priority: ${analysis.criticalCount} critical reports indicate dangerous conditions in ${analysis.affectedAreas.join(', ')}. Strongly recommend class suspension and public safety advisory.`;
  } else if (analysis.priority === 'Medium') {
    analysis.recommendation = `Monitor situation closely. ${analysis.mediumCount} moderate reports require attention. Prepare contingency plans and keep schools on alert.`;
  } else {
    analysis.recommendation = 'Situation under control. Continue routine monitoring. No class suspension necessary at this time.';
  }

  return {
    success: true,
    analysis,
    source: 'fallback'
  };
};

/**
 * Fallback suspension advisory (when Gemini unavailable)
 */
const fallbackSuspensionAdvisory = (weatherData, reports) => {
  let weatherScore = 0;
  let reportsScore = 0;
  const affectedCities = new Set();
  const riskFactors = [];

  // Analyze weather
  weatherData.forEach(city => {
    const { rainfall, windSpeed, temperature } = city.current;

    if (rainfall > 20) {
      weatherScore += 40;
      riskFactors.push(`Heavy rainfall in ${city.location.city} (${rainfall}mm/h)`);
      affectedCities.add(city.location.city);
    } else if (rainfall > 10) {
      weatherScore += 25;
      riskFactors.push(`Moderate rainfall in ${city.location.city}`);
    }

    if (windSpeed > 60) {
      weatherScore += 35;
      riskFactors.push(`Strong winds in ${city.location.city} (${windSpeed} km/h)`);
      affectedCities.add(city.location.city);
    } else if (windSpeed > 40) {
      weatherScore += 20;
    }

    if (temperature > 38) {
      weatherScore += 15;
      riskFactors.push(`Extreme heat in ${city.location.city} (${temperature}°C)`);
      affectedCities.add(city.location.city);
    }
  });

  // Analyze reports
  const criticalReports = reports.filter(r =>
    r.severity === 'critical' || r.severity === 'high'
  );

  reportsScore = Math.min(criticalReports.length * 10, 100);

  if (criticalReports.length >= 5) {
    riskFactors.push(`${criticalReports.length} critical community reports`);
    criticalReports.slice(0, 3).forEach(r => {
      if (r.location?.city) {
        affectedCities.add(r.location.city);
      }
    });
  }

  const combinedScore = Math.min((weatherScore + reportsScore) / 2, 100);

  let overallRisk = 'Low';
  let suspensionRecommended = false;

  if (combinedScore >= 70) {
    overallRisk = 'Critical';
    suspensionRecommended = true;
  } else if (combinedScore >= 50) {
    overallRisk = 'High';
    suspensionRecommended = true;
  } else if (combinedScore >= 30) {
    overallRisk = 'Moderate';
  }

  const affectedCitiesArray = Array.from(affectedCities);

  const advisory = suspensionRecommended
    ? `CLASS SUSPENSION RECOMMENDED for ${affectedCitiesArray.join(', ')}. Dangerous conditions detected: ${riskFactors.slice(0, 3).join('; ')}. Parents and guardians should keep children at home. Schools should prepare for extended closure if conditions worsen.`
    : `Monitor conditions closely. Risk level: ${overallRisk}. ${riskFactors.length > 0 ? 'Current concerns: ' + riskFactors.slice(0, 2).join('; ') + '.' : 'Weather conditions within normal parameters.'}`;

  const priorityActions = suspensionRecommended
    ? [
        'Issue immediate class suspension announcement',
        `Alert all schools in ${affectedCitiesArray.join(', ')}`,
        'Notify parents via SMS/social media',
        'Activate emergency response teams',
        'Monitor conditions for possible extension'
      ]
    : [
        'Continue active monitoring',
        'Prepare contingency plans',
        'Keep communication channels open',
        'Update every 2-3 hours'
      ];

  const expectedConditions = combinedScore >= 50
    ? 'Conditions expected to remain severe for the next 6-12 hours. Heavy rainfall and strong winds may continue. Roads may become impassable. Exercise extreme caution.'
    : combinedScore >= 30
    ? 'Moderate weather conditions expected to persist. Situation may improve or worsen depending on weather system movement. Stay updated with latest advisories.'
    : 'Weather conditions expected to remain stable or improve gradually. Normal activities can proceed with routine weather monitoring.';

  return {
    success: true,
    analysis: {
      overallRisk,
      suspensionRecommended,
      affectedCities: affectedCitiesArray,
      riskFactors,
      weatherScore: Math.round(weatherScore),
      reportsScore: Math.round(reportsScore),
      combinedScore: Math.round(combinedScore),
      advisory,
      priorityActions,
      expectedConditions,
      timestamp: new Date().toISOString()
    },
    source: 'fallback'
  };
};

export default {
  compileReports,
  analyzeReportWithImages,
  groupReportsByLocationAndTime,
  getSeverityColor,
  analyzeClassSuspensionReports,
  analyzeSuspensionAdvisory
};
