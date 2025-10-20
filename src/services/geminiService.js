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
 * @param {Object} report - Single report with text and images
 * @returns {Object} Analysis results
 */
export const analyzeReportWithImages = async (report) => {
  try {
    const parts = [{
      text: `Analyze this weather-related report and determine:
1. Severity level (critical/high/medium/low)
2. Authenticity confidence (0-100%)
3. Brief assessment (2-3 sentences)

Report Details:
Location: ${report.location}
Description: ${report.description}
Type: ${report.type}

Respond in JSON:
{
  "severity": "level",
  "confidence": 85,
  "assessment": "your assessment",
  "isAuthentic": true/false
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

    return analysis;

  } catch (error) {
    console.error('Error analyzing report with images:', error);
    return {
      severity: 'medium',
      confidence: 50,
      assessment: 'Unable to analyze report',
      isAuthentic: true
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

export default {
  compileReports,
  analyzeReportWithImages,
  groupReportsByLocationAndTime,
  getSeverityColor
};
