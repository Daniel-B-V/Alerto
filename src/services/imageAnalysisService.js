// Hugging Face Image Analysis Service using CLIP
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Analyze report images to verify they match the reported hazard using Hugging Face CLIP
 * @param {Array} imageUrls - Array of image URLs from the report
 * @param {Object} reportData - Report data including hazardType, description, title
 * @param {Object} weatherData - Optional real-time weather data for the location
 * @returns {Object} Analysis result with credibility score and findings
 */
export const analyzeReportImages = async (imageUrls, reportData, weatherData = null) => {
  try {

    if (!imageUrls || imageUrls.length === 0) {
    // Validate reportData parameter
    if (!reportData || typeof reportData !== 'object') {
      console.warn('⚠️ Image analysis: reportData is missing or invalid, using default values');
      reportData = { hazardType: 'other' };
    }

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

    // Call backend proxy for Hugging Face CLIP API (avoids CORS)
    console.log('🔍 Calling Hugging Face API via backend:', `${BACKEND_URL}/api/huggingface/image-classification`);

    const hfResponse = await fetch(`${BACKEND_URL}/api/huggingface/image-classification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: await blobToBase64(blob),
        candidateLabels: candidateLabels.split(', ')
      })
    });

    if (!hfResponse.ok) {
      const errorData = await hfResponse.json().catch(() => ({}));

      // Handle model loading (503)
      if (hfResponse.status === 503 && errorData.isLoading) {
        console.warn('⚠️ CLIP model is loading, returning neutral confidence');
        return {
          credible: true,
          confidence: 50,
          reason: 'Image analysis temporarily unavailable (model loading)',
          matchesReport: 'unknown',
          detectedHazards: []
        };
      }

      console.error('❌ Backend API error:', hfResponse.status, errorData);
      throw new Error(`Backend API error: ${hfResponse.status}`);
    }

    const hfData = await hfResponse.json();
    console.log('✅ Hugging Face API response received:', hfData);

    // Parse results
    const scores = hfData[0]?.scores || [];
    const labels = hfData[0]?.labels || [];

    // Find if reported hazard matches
    const hazardKeywords = expectedLabel.split(', ');
    const spamKeywords = spamLabels.split(', ');

    let maxHazardScore = 0;
    let maxSpamScore = 0;
    let detectedHazards = [];

    labels.forEach((label, index) => {
      const score = scores[index];

      if (hazardKeywords.some(keyword => label.toLowerCase().includes(keyword.toLowerCase()))) {
        if (score > maxHazardScore) {
          maxHazardScore = score;
        }
        if (score > 0.3) {
          detectedHazards.push(label);
        }
      } else if (spamKeywords.some(keyword => label.toLowerCase().includes(keyword.toLowerCase()))) {
        if (score > maxSpamScore) {
          maxSpamScore = score;
        }
      }
    });

    // Calculate confidence based on CLIP scores
    // High hazard score + low spam score = high confidence
    // Low hazard score + high spam score = low confidence
    let confidence = Math.round((maxHazardScore * 100));

    // Adjust confidence based on spam detection
    if (maxSpamScore > maxHazardScore) {
      confidence = Math.max(20, confidence - Math.round(maxSpamScore * 50));
    }

    // Weather cross-check
    let weatherMatch = 'unknown';
    if (weatherData) {
      const hasRain = (weatherData.rain_1h || 0) > 0;
      const isWet = weatherData.humidity > 80;
      const isFlooding = reportedHazard === 'flood';
      const isRain = reportedHazard === 'rain';

      if ((isFlooding || isRain) && !hasRain && !isWet) {
        weatherMatch = 'contradicts';
        confidence = Math.max(15, confidence - 30);
      } else if ((isFlooding || isRain) && (hasRain || isWet)) {
        weatherMatch = 'matches';
        confidence = Math.min(100, confidence + 10);
      }
    }

    const matchesReport = maxHazardScore > 0.5 ? 'yes' : (maxHazardScore > 0.3 ? 'partial' : 'no');
    const credible = confidence >= 40;

    console.log('🔍 Hugging Face CLIP Analysis Result:', {
      confidence,
      matchesReport,
      reportedHazard,
      maxHazardScore,
      maxSpamScore,
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
      reason: `CLIP analysis: ${Math.round(maxHazardScore * 100)}% match to ${reportedHazard}. ${weatherMatch !== 'unknown' ? `Weather ${weatherMatch}.` : ''}`,
      redFlags: maxSpamScore > maxHazardScore ? ['Image appears unrelated to disaster/hazard'] : []
    };

  } catch (error) {
    console.error('Error analyzing images with Hugging Face CLIP:', error);
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
