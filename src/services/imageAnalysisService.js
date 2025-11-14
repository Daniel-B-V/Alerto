// Gemini Image Analysis Service
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyDDL3nl6cR3xsIQ8Ilv046_7xjIa-iIo0E';
const GEMINI_VISION_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

/**
 * Analyze report images to verify they match the reported hazard
 * @param {Array} imageUrls - Array of image URLs from the report
 * @param {Object} reportData - Report data including hazardType, description, title
 * @param {Object} weatherData - Optional real-time weather data for the location
 * @returns {Object} Analysis result with credibility score and findings
 */
export const analyzeReportImages = async (imageUrls, reportData, weatherData = null) => {
  try {
    if (!imageUrls || imageUrls.length === 0) {
      return {
        credible: true,
        confidence: 50,
        reason: 'No images provided - cannot verify visually',
        matchesReport: 'unknown',
        detectedHazards: []
      };
    }

    // Fetch images and convert to base64
    const imagePromises = imageUrls.slice(0, 3).map(async (url) => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Error fetching image:', error);
        return null;
      }
    });

    const base64Images = (await Promise.all(imagePromises)).filter(img => img !== null);

    if (base64Images.length === 0) {
      return {
        credible: true,
        confidence: 50,
        reason: 'Could not load images for verification',
        matchesReport: 'unknown',
        detectedHazards: []
      };
    }

    // Prepare weather context if available
    const weatherContext = weatherData ? `

**CURRENT WEATHER CONDITIONS AT LOCATION:**
- Temperature: ${weatherData.temp}°C (Feels like: ${weatherData.feels_like}°C)
- Weather: ${weatherData.weather_main} - ${weatherData.weather_description}
- Humidity: ${weatherData.humidity}%
- Wind Speed: ${weatherData.wind_speed} m/s
- Rain (last hour): ${weatherData.rain_1h || 0}mm
- Clouds: ${weatherData.clouds}%
- Visibility: ${weatherData.visibility}m
- Pressure: ${weatherData.pressure}hPa

**CROSS-REFERENCE WITH WEATHER:**
- Does the visual evidence in images match current weather conditions?
- If reporting flood but no rain in weather data: REDUCE credibility
- If reporting heavy rain but weather shows clear skies: MAJOR red flag
- If images show flooding but humidity is low and no rain: Questionable timing
` : '';

    // Prepare the prompt for Gemini with strict protocol
    const prompt = `You are an AI verifying disaster reports using IMAGE ANALYSIS. Follow STRICT PROTOCOL.

**REPORTED HAZARD TYPE: ${reportData.hazardType || 'Unknown'}**
**Report Title:** "${reportData.title || 'No title'}"
**Report Description:** "${reportData.description || 'No description'}"
**Location:** ${reportData.location?.city || 'Unknown'}, ${reportData.location?.barangay || 'Unknown'}
${weatherContext}

**VERIFICATION PROTOCOL - Analyze ${base64Images.length} image(s):**

**STEP 1: IDENTIFY WHAT'S ACTUALLY IN THE IMAGES**
- What disaster/hazard is visible? (flooding, road damage, landslide, power outage, etc.)
- Describe specific visual evidence

**STEP 2: COMPARE WITH REPORTED HAZARD TYPE**
Reported: ${reportData.hazardType || 'Unknown'}
Actual in images: ____

**CRITICAL MISMATCH CHECK:**
- Report says "flooding" but image shows dry road damage → MAJOR MISMATCH (confidence ≤ 20%)
- Report says "flooding" but image shows clear skies/dry roads → MAJOR MISMATCH (confidence ≤ 15%)
- Report says "heavy_rain" but image shows sunshine → MAJOR MISMATCH (confidence ≤ 20%)
- Report says "landslide" but image shows flooding → MISMATCH (confidence ≤ 30%)
- Image shows completely different hazard → FLAG AS FAKE (confidence ≤ 25%)

**STEP 3: WEATHER DATA CROSS-CHECK**
${weatherData ? `
Current Weather:
- Condition: ${weatherData.weather_description}
- Rain (1h): ${weatherData.rain_1h || 0}mm
- Humidity: ${weatherData.humidity}%
- Clouds: ${weatherData.clouds}%

CRITICAL FLAGS:
- Report claims flooding BUT weather shows no rain + low humidity → FAKE (confidence ≤ 15%)
- Image shows wet roads BUT weather is clear/dry → OLD PHOTO or FAKE (confidence ≤ 25%)
- Visual evidence contradicts real-time weather → SUSPICIOUS (confidence ≤ 35%)
` : 'No weather data to cross-check'}

**STEP 4: FINAL CONFIDENCE SCORING**
- **85-100%:** Image perfectly matches reported hazard + weather data supports it
- **70-84%:** Image matches hazard, minor inconsistencies
- **40-69%:** Partial match OR unclear evidence
- **25-39%:** Image shows different hazard than reported
- **0-24%:** Complete mismatch, fake, or unrelated images

**RESPOND IN THIS EXACT JSON FORMAT:**
{
  "credible": true/false,
  "confidence": 0-100,
  "matchesReport": "yes/no/mismatch",
  "visualDescription": "What's actually in the image",
  "detectedHazards": ["actual hazard in image"],
  "reportedHazard": "${reportData.hazardType || 'Unknown'}",
  "weatherMatch": "matches/contradicts/unknown",
  "reason": "Specific explanation of match/mismatch",
  "redFlags": ["list specific mismatches"] or []
}

**BE EXTREMELY STRICT:**
- If image shows DIFFERENT hazard than reported → confidence ≤ 30%
- If weather contradicts visual evidence → confidence ≤ 25%
- If obvious mismatch (flooding report + dry road image) → confidence ≤ 20%

NO MERCY for mismatches. Report exactly what you see.`;

    // Prepare the request body with images
    const parts = [
      { text: prompt }
    ];

    // Add images
    base64Images.forEach(base64 => {
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: base64
        }
      });
    });

    const requestBody = {
      contents: [{
        parts: parts
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 1024,
      }
    };

    // Call Gemini API
    const response = await fetch(`${GEMINI_VISION_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);

      console.log('🔍 Image Analysis Result:', {
        confidence: analysis.confidence,
        matchesReport: analysis.matchesReport,
        reportedHazard: analysis.reportedHazard,
        detectedHazards: analysis.detectedHazards,
        redFlags: analysis.redFlags
      });

      return {
        credible: analysis.credible,
        confidence: analysis.confidence,
        matchesReport: analysis.matchesReport,
        visualDescription: analysis.visualDescription,
        detectedHazards: analysis.detectedHazards || [],
        reportedHazard: analysis.reportedHazard,
        reason: analysis.reason,
        redFlags: analysis.redFlags || []
      };
    }

    // Fallback if JSON parsing fails
    return {
      credible: true,
      confidence: 60,
      matchesReport: 'unknown',
      reason: 'Could not parse AI analysis',
      detectedHazards: []
    };

  } catch (error) {
    console.error('Error analyzing images with Gemini:', error);
    return {
      credible: true,
      confidence: 50,
      reason: `Analysis error: ${error.message}`,
      matchesReport: 'unknown',
      detectedHazards: []
    };
  }
};

/**
 * Generate credibility badge based on image analysis
 * 3-category system: Verified / Under Review / Flagged
 * @param {Object} analysis - Analysis result from analyzeReportImages
 * @returns {Object} Badge info with color, text, and icon
 */
export const getCredibilityBadge = (analysis) => {
  if (!analysis) {
    return {
      color: 'bg-gray-500',
      text: 'Under Review',
      icon: '⚠️',
      confidence: 0
    };
  }

  const confidence = analysis.confidence;

  // Verified: AI confidence ≥70%
  if (confidence >= 70) {
    return {
      color: 'bg-green-500',
      text: `✓ Verified`,
      icon: '✓',
      confidence: confidence,
      detail: analysis.reason
    };
  }
  // Under Review: AI confidence 40-69%
  else if (confidence >= 40) {
    return {
      color: 'bg-yellow-500',
      text: `⚠ Under Review`,
      icon: '⚠',
      confidence: confidence,
      detail: analysis.reason
    };
  }
  // Flagged: AI confidence <40%
  else {
    return {
      color: 'bg-red-500',
      text: `⚠ Flagged`,
      icon: '⚠',
      confidence: confidence,
      detail: analysis.reason
    };
  }
};
