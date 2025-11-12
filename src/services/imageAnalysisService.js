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

    // Prepare the prompt for Gemini
    const prompt = `You are an AI assistant analyzing images from a weather/hazard report to verify its credibility.

**REPORT DETAILS:**
- Hazard Type: ${reportData.hazardType || 'Unknown'}
- Title: ${reportData.title || 'No title'}
- Description: ${reportData.description || 'No description'}
- Location: ${reportData.location?.city || 'Unknown'}, ${reportData.location?.barangay || 'Unknown'}
${weatherContext}

**YOUR TASK:**
Analyze the ${base64Images.length} image(s) and determine:

1. **What do you see in the images?** (Describe the main content)
2. **Do the images match the reported hazard type?** (Yes/No/Partially)
3. **Weather Data Cross-Check:** ${weatherData ? 'Compare images with actual weather conditions above' : 'No weather data available'}
4. **Credibility Assessment:**
   - If images show the reported hazard AND match weather data: HIGH credibility (85-100%)
   - If images show hazard but weather data contradicts: MEDIUM-LOW credibility (40-60%)
   - If images show different hazard but weather-related: MEDIUM credibility (50-70%)
   - If images are unrelated (signatures, people, random objects): LOW credibility (0-30%)
   - If weather shows clear/sunny but images show flooding: RED FLAG (10-25%)
5. **Detected Hazards:** List any weather/disaster hazards visible in the images
6. **Red Flags:** Any signs of fake/misleading report?
   - Mismatched weather conditions
   - Unrelated images (signatures, selfies)
   - Inconsistent timing (dry weather but flood images)
   - Stock photos or old images

**RESPOND IN THIS EXACT JSON FORMAT:**
{
  "credible": true/false,
  "confidence": 0-100,
  "matchesReport": "yes/no/partially/unrelated",
  "visualDescription": "Brief description of what's in the images",
  "detectedHazards": ["hazard1", "hazard2"],
  "weatherMatch": "matches/contradicts/unknown",
  "reason": "Explanation including weather data comparison if available",
  "redFlags": ["flag1", "flag2"] or []
}

**IMPORTANT:** 
- Be VERY strict: Cross-reference images with actual weather data
- If weather data contradicts visual evidence, SIGNIFICANTLY reduce credibility
- If images show signatures, selfies, or unrelated content, mark as LOW credibility
- Consider humidity, rainfall, and cloud cover when assessing flood/rain reports`;

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
      return {
        credible: analysis.credible,
        confidence: analysis.confidence,
        matchesReport: analysis.matchesReport,
        visualDescription: analysis.visualDescription,
        detectedHazards: analysis.detectedHazards || [],
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
 * @param {Object} analysis - Analysis result from analyzeReportImages
 * @returns {Object} Badge info with color, text, and icon
 */
export const getCredibilityBadge = (analysis) => {
  if (!analysis) {
    return {
      color: 'bg-gray-500',
      text: 'Not Verified',
      icon: '⚠️',
      confidence: 0
    };
  }

  const confidence = analysis.confidence;

  if (confidence >= 80) {
    return {
      color: 'bg-green-500',
      text: `✓ Highly Credible`,
      icon: '✓',
      confidence: confidence,
      detail: analysis.reason
    };
  } else if (confidence >= 60) {
    return {
      color: 'bg-yellow-500',
      text: `⚠ Likely Credible`,
      icon: '⚠',
      confidence: confidence,
      detail: analysis.reason
    };
  } else if (confidence >= 40) {
    return {
      color: 'bg-orange-500',
      text: `⚠ Questionable`,
      icon: '⚠',
      confidence: confidence,
      detail: analysis.reason
    };
  } else {
    return {
      color: 'bg-red-500',
      text: `✗ Low Credibility`,
      icon: '✗',
      confidence: confidence,
      detail: analysis.reason
    };
  }
};
