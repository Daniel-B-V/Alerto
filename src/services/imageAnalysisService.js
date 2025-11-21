// Image Analysis Service using Cloudflare Workers AI
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Analyze report images to verify they match the reported hazard using Cloudflare Workers AI
 * @param {Array} imageUrls - Array of image URLs from the report
 * @param {Object} reportData - Report data including hazardType, description, title
 * @param {Object} weatherData - Optional real-time weather data for the location
 * @returns {Object} Analysis result with credibility score and findings
 */
export const analyzeReportImages = async (imageUrls, reportData, weatherData = null) => {
  try {
    // Validate reportData parameter
    if (!reportData || typeof reportData !== 'object') {
      console.warn('⚠️ Image analysis: reportData is missing or invalid, using default values');
      reportData = { hazardType: 'other' };
    }

    if (!imageUrls || imageUrls.length === 0) {
      return {
        credible: true,
        confidence: 50,
        reason: 'No images provided - cannot verify visually',
        matchesReport: 'unknown',
        detectedHazards: []
      };
    }

    // Fetch first image and convert to blob
    const imageUrl = imageUrls[0]; // Analyze first image
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Prepare candidate labels based on hazard types
    const hazardLabels = {
      'rain': 'heavy rain, wet roads, rainfall, storm',
      'flood': 'flooding, flood water, submerged roads, water damage',
      'landslide': 'landslide, mudslide, fallen rocks, debris',
      'strong_winds': 'fallen trees, wind damage, broken branches',
      'power_outage': 'fallen power lines, electrical damage, dark streets',
      'road_damage': 'damaged road, potholes, cracked pavement, road destruction',
      'other': 'disaster, emergency, hazard, damage'
    };

    const reportedHazard = reportData?.hazardType || 'other';
    const expectedLabel = hazardLabels[reportedHazard] || hazardLabels['other'];

    // Also check for common spam/unrelated images
    const spamLabels = 'clear sky, sunny day, normal conditions, unrelated object, random photo';

    // Prepare CLIP parameters
    const candidateLabels = `${expectedLabel}, ${spamLabels}`;

    // Call backend proxy for Hugging Face image analysis
    console.log('🔍 Calling Hugging Face Vision Transformer via backend:', `${BACKEND_URL}/api/huggingface/image-analysis`);

    const hfResponse = await fetch(`${BACKEND_URL}/api/huggingface/image-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: await blobToBase64(blob),
        candidateLabels: candidateLabels.split(', '),
        hazardType: reportedHazard
      })
    });

    if (!hfResponse.ok) {
      const errorData = await hfResponse.json().catch(() => ({}));

      // Handle model loading (503)
      if (hfResponse.status === 503 && errorData.isLoading) {
        console.warn('⚠️ Hugging Face model is loading, returning neutral confidence');
        return {
          credible: true,
          confidence: 50,
          reason: 'Image analysis temporarily unavailable (model loading)',
          matchesReport: 'unknown',
          detectedHazards: []
        };
      }

      console.error('❌ Hugging Face API error:', hfResponse.status, errorData);
      throw new Error(`Hugging Face API error: ${hfResponse.status}`);
    }

    const hfData = await hfResponse.json();
    console.log('✅ Hugging Face response received:', hfData);

    // Use backend's pre-calculated analysis
    const backendAnalysis = hfData[0];
    let confidence = backendAnalysis.confidence || 0;
    const maxHazardScore = backendAnalysis.maxHazardScore || 0;
    const detectedHazards = backendAnalysis.detectedHazards || [];
    let matchesReport = backendAnalysis.matchesReport || 'unknown';

    // Weather cross-check (optional enhancement)
    let weatherMatch = 'unknown';
    if (weatherData && weatherData.current) {
      console.log('🌤️ Weather cross-check starting:', {
        reportedHazard,
        weather: weatherData.current
      });

      // Extract weather parameters with correct property names and null safety
      const rainfall = (weatherData.current?.rainfall || 0);
      const humidity = (weatherData.current?.humidity || 0);
      const windSpeed = (weatherData.current?.windSpeed || 0);

      console.log('📊 Weather parameters:', { rainfall, humidity, windSpeed });

      const hazardType = reportedHazard;

      // Check weather conditions based on hazard type
      if (hazardType === 'flood' || hazardType === 'rain') {
        const hasRain = rainfall > 0;
        const isWet = humidity > 80;

        if (!hasRain && !isWet) {
          weatherMatch = 'contradicts';
          confidence = Math.max(15, confidence - 30);
          console.log('⚠️ Weather contradicts: No rain/humidity for flood/rain report');
        } else if (hasRain || isWet) {
          weatherMatch = 'matches';
          confidence = Math.min(100, confidence + 10);
          console.log('✅ Weather matches: Rain/humidity detected for flood/rain report');
        }
      } else if (hazardType === 'strong_winds') {
        if (windSpeed < 20) {
          weatherMatch = 'contradicts';
          confidence = Math.max(15, confidence - 25);
          console.log(`⚠️ Weather contradicts: Low wind speed (${windSpeed} km/h) for strong winds report`);
        } else if (windSpeed > 40) {
          weatherMatch = 'matches';
          confidence = Math.min(100, confidence + 15);
          console.log(`✅ Weather matches: High wind speed (${windSpeed} km/h) for strong winds report`);
        }
      } else if (hazardType === 'landslide') {
        const highRainfall = rainfall > 5;
        const highHumidity = humidity > 85;

        if (highRainfall || highHumidity) {
          weatherMatch = 'matches';
          confidence = Math.min(100, confidence + 10);
          console.log('✅ Weather matches: High rainfall/humidity for landslide report');
        }
      }

      console.log('🔍 Weather match result:', weatherMatch, 'Adjusted confidence:', confidence);
    } else {
      console.log('⚠️ No weather data available for cross-check');
    }

    const credible = confidence >= 40;

    console.log('🔍 Hugging Face ViT Analysis Result:', {
      confidence,
      matchesReport,
      reportedHazard,
      maxHazardScore,
      detectedHazards,
      weatherMatch
    });

    return {
      credible,
      confidence,
      matchesReport,
      visualDescription: `Image shows: ${detectedHazards.join(', ') || 'unclear'}`,
      detectedHazards,
      reportedHazard,
      weatherMatch,
      reason: `AI analysis: ${confidence}% match to ${reportedHazard}. ${weatherMatch !== 'unknown' ? `Weather ${weatherMatch}.` : ''}`,
      redFlags: confidence < 40 ? ['Image confidence below threshold'] : []
    };

  } catch (error) {
    console.error('Error analyzing images with Hugging Face:', error);
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
 * Convert blob to base64
 */
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

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
