const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Gemini
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Text sentiment analysis endpoint (for spam detection)
router.post('/text-sentiment', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!HF_API_KEY) {
      console.error('Hugging Face API key not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Parse NLI format: "premise [SEP] hypothesis"
    const parts = text.split('[SEP]');
    const premise = parts[0]?.trim() || text;
    const hypothesis = parts[1]?.trim() || 'This is legitimate content';

    // Use zero-shot classification format for BART-large-mnli
    const response = await fetch('https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: premise,
        parameters: {
          candidate_labels: ['entailment', 'neutral', 'contradiction']
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', response.status, errorText);
      return res.status(response.status).json({ error: `Hugging Face API error: ${response.status}` });
    }

    const data = await response.json();

    // Hugging Face returns array directly: [{label, score}, ...]
    // Wrap in array for frontend compatibility
    res.json([data]);

  } catch (error) {
    console.error('Error in text sentiment analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

// Image classification endpoint (CLIP)
router.post('/image-classification', async (req, res) => {
  try {
    const { image, candidateLabels } = req.body;

    if (!image || !candidateLabels) {
      return res.status(400).json({ error: 'Image and candidate labels are required' });
    }

    if (!HF_API_KEY) {
      console.error('Hugging Face API key not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Use the new router endpoint (api-inference.huggingface.co is deprecated)
    const response = await fetch('https://router.huggingface.co/hf-inference/models/openai/clip-vit-large-patch14', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parameters: {
          candidate_labels: candidateLabels
        },
        inputs: image
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face CLIP API error:', response.status, errorText);

      // If model is loading, return a temporary response
      if (response.status === 503) {
        return res.status(503).json({
          error: 'Model is loading, please try again in a moment',
          isLoading: true
        });
      }

      return res.status(response.status).json({ error: `Hugging Face API error: ${response.status}` });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Error in image classification:', error);
    res.status(500).json({ error: error.message });
  }
});

// Hugging Face Inference API image classification endpoint (for hazard verification)
router.post('/image-analysis', async (req, res) => {
  try {
    const { image, candidateLabels, hazardType } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    if (!HF_API_KEY) {
      console.error('Hugging Face API key not configured');
      return res.status(500).json({ error: 'Hugging Face API key not configured' });
    }

    // Use Hugging Face Inference API with Vision Transformer model
    console.log('🔍 Calling Hugging Face Inference API for image classification...');

    // Call Hugging Face Inference API
    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/google/vit-base-patch16-224',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: image, // base64 string
          parameters: {
            function_to_apply: 'sigmoid',
            top_k: 10 // Get top 10 predictions
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face Inference API error:', response.status, errorText);
      throw new Error(`HF API error: ${response.status}`);
    }

    const hfResults = await response.json();
    console.log('✅ HF Inference API response:', hfResults);

    // HF returns array of {label, score} objects
    // Map these to disaster-related concepts with comprehensive keywords
    const disasterKeywords = {
      // Water-related (flooding)
      water: ['water', 'flood', 'flooding', 'submerged', 'inundation', 'lake', 'lakeside', 'lakeshore',
              'sea', 'seashore', 'coast', 'ocean', 'river', 'stream', 'pond', 'wetland', 'swamp'],
      // Debris/Landslide
      debris: ['debris', 'rubble', 'landslide', 'mudslide', 'avalanche', 'rockslide', 'fallen', 'collapsed'],
      // Damage/Destruction
      damage: ['damage', 'damaged', 'destruction', 'destroyed', 'broken', 'ruined', 'demolished', 'wreckage', 'ruins'],
      // Storm-related
      storm: ['storm', 'hurricane', 'typhoon', 'cyclone', 'tornado', 'tempest', 'gale'],
      // Fire/Smoke
      fire: ['fire', 'flame', 'burning', 'smoke', 'ash', 'wildfire', 'blaze', 'inferno'],
      // Rain/Weather
      rain: ['rain', 'rainfall', 'precipitation', 'downpour', 'deluge', 'monsoon'],
      // Wind damage
      wind: ['wind', 'blown', 'uprooted', 'toppled'],
      // General emergency indicators
      emergency: ['emergency', 'disaster', 'hazard', 'catastrophe', 'calamity', 'crisis']
    };

    // Analyze results for disaster-related content
    const hazardType_lower = (hazardType || '').toLowerCase();
    let maxHazardScore = 0;
    let detectedHazards = [];
    let matchesReport = false;

    hfResults.forEach(result => {
      const label = result.label.toLowerCase();
      const score = result.score;

      console.log(`🔍 Checking label: "${label}" (score: ${score})`);

      // Check if label relates to disasters
      for (const [key, keywords] of Object.entries(disasterKeywords)) {
        // Use word boundary matching to avoid false positives like "seashore" matching "ash"
        const keyMatch = new RegExp(`\\b${key}\\b`, 'i').test(label);
        const keywordMatch = keywords.some(kw => {
          // Use word boundary for whole word matching
          const kwLower = kw.toLowerCase();
          return new RegExp(`\\b${kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(label);
        });

        if (keyMatch || keywordMatch) {
          console.log(`  ✅ MATCH found! Category: ${key}, KeyMatch: ${keyMatch}, KeywordMatch: ${keywordMatch}`);

          if (score > maxHazardScore) {
            maxHazardScore = score;
          }
          detectedHazards.push({ label: result.label, score });

          // Check if it matches reported hazard
          if (hazardType_lower && (label.includes(hazardType_lower) || keywords.some(kw => hazardType_lower.includes(kw.toLowerCase())))) {
            matchesReport = true;
            console.log(`  ✅ Matches reported hazard: ${hazardType_lower}`);
          }
        }
      }
    });

    console.log(`\n📊 Final Results:`)
    console.log(`  - Max Hazard Score: ${maxHazardScore}`);
    console.log(`  - Detected Hazards: ${detectedHazards.length}`)
    console.log(`  - Matches Report: ${matchesReport}`);

    // Calculate confidence score (0-100)
    let confidence = Math.round(maxHazardScore * 100);
    const matchesReport_str = maxHazardScore > 0.5 ? 'yes' : (maxHazardScore > 0.3 ? 'partial' : 'no');

    console.log(`  - Confidence: ${confidence}%`);
    console.log(`  - Match Status: ${matchesReport_str}`);

    // Build analysis result
    const analysisResult = {
      scores: hfResults.map(r => r.score),
      labels: hfResults.map(r => r.label),
      topLabel: hfResults[0]?.label || 'unknown',
      topScore: hfResults[0]?.score || 0,
      matchesReportedHazard: matchesReport,
      detectedHazards: detectedHazards.map(h => h.label),
      maxHazardScore: maxHazardScore,
      confidence: confidence,
      matchesReport: matchesReport_str,
      analysis: `Detected: ${detectedHazards.length > 0 ? detectedHazards.map(h => h.label).join(', ') : 'No clear disaster indicators'}`
    };

    // Format response to match expected format from frontend
    res.json([{
      scores: analysisResult.scores || [analysisResult.topScore || 0.5],
      labels: analysisResult.labels || [analysisResult.topLabel || 'unknown'],
      analysis: analysisResult.analysis || 'Image analyzed',
      matchesReportedHazard: analysisResult.matchesReportedHazard || false,
      // NEW: Send pre-calculated confidence and analysis from backend
      confidence: analysisResult.confidence,
      maxHazardScore: analysisResult.maxHazardScore,
      detectedHazards: analysisResult.detectedHazards,
      matchesReport: analysisResult.matchesReport
    }]);

  } catch (error) {
    console.error('Error in Hugging Face image analysis:', error);
    // Return a neutral analysis instead of error to allow report submission
    res.json([{
      scores: [0.5],
      labels: ['unknown'],
      analysis: 'Image analysis temporarily unavailable',
      matchesReportedHazard: false
    }]);
  }
});

module.exports = router;
