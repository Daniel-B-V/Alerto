const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

// Cloudflare Workers AI image analysis endpoint
router.post('/analyze-image', async (req, res) => {
  try {
    const { image, candidateLabels, hazardType } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      console.error('Cloudflare credentials not configured');
      return res.status(500).json({ error: 'Cloudflare API not configured' });
    }

    // Build hazard detection prompt
    const labels = candidateLabels || [];
    const hazardLabelsStr = labels
      .filter(l => !['clear sky', 'sunny day', 'normal conditions', 'unrelated object', 'random photo'].includes(l.toLowerCase()))
      .join(', ');

    const prompt = `Analyze this image for disaster hazards and determine if it matches the reported incident.

Reported hazard type: ${hazardType || 'unknown'}
Expected to see: ${hazardLabelsStr}

Your task:
1. Identify what hazards are visible in the image (flooding, landslide, storm damage, power lines down, road damage, etc.)
2. Determine if the image matches the reported hazard type "${hazardType}"
3. Assess if this is a genuine disaster/emergency photo or spam/unrelated content
4. Rate the severity of any visible hazards

Respond in this EXACT JSON format (no markdown, just pure JSON):
{
  "matchesReport": true,
  "confidence": 85,
  "detectedHazards": ["flooding", "road damage"],
  "severity": "high",
  "isSpam": false,
  "description": "Image shows flooded streets with visible water damage"
}

Confidence scale: 0-100 (how certain the image matches the reported hazard)
Severity: "low", "medium", "high", or "critical"
isSpam: true if image is unrelated/inappropriate, false if genuine`;

    // Call Cloudflare Workers AI with Llama Vision model
    const requestBody = {
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      image: `data:image/jpeg;base64,${image}`,
      max_tokens: 512
    };

    console.log('🔍 Sending request to Cloudflare AI...');
    console.log('📝 Prompt length:', prompt.length);
    console.log('🖼️ Image length:', image.length);
    console.log('📋 Messages:', JSON.stringify(requestBody.messages));

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudflare AI error:', response.status, errorText);
      return res.status(response.status).json({
        error: `Cloudflare AI error: ${response.status}`
      });
    }

    const data = await response.json();
    console.log('✅ Cloudflare AI response received:', JSON.stringify(data).substring(0, 200));

    // Extract AI response text
    const aiText = data.result?.response || data.result?.content || data.result || '';

    // Parse JSON from AI response
    let analysis;
    try {
      // Try to find JSON in the response
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing Cloudflare AI response:', parseError);
      console.error('AI response text:', aiText);

      // Fallback: create analysis from text content
      const lowerText = (typeof aiText === 'string' ? aiText : '').toLowerCase();
      const matchesKeywords = hazardLabelsStr.toLowerCase().split(', ').some(kw =>
        lowerText.includes(kw)
      );

      analysis = {
        matchesReport: matchesKeywords,
        confidence: matchesKeywords ? 60 : 40,
        detectedHazards: matchesKeywords ? [hazardType] : ['unknown'],
        severity: 'medium',
        isSpam: false,
        description: typeof aiText === 'string' ? aiText.substring(0, 200) : 'Unable to analyze image'
      };
    }

    // Format response to match expected CLIP format for frontend compatibility
    res.json([{
      scores: [analysis.confidence / 100],
      labels: analysis.detectedHazards,
      matchesReport: analysis.matchesReport,
      severity: analysis.severity,
      isSpam: analysis.isSpam,
      analysis: analysis.description
    }]);

  } catch (error) {
    console.error('Error in Cloudflare AI image analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
