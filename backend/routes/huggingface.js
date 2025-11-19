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

// Gemini-based image analysis endpoint (for hazard verification)
router.post('/gemini-image-analysis', async (req, res) => {
  try {
    const { image, candidateLabels, hazardType } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    if (!GEMINI_API_KEY || !genAI) {
      console.error('Gemini API key not configured');
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    // Initialize Gemini model with vision capability
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build prompt for hazard analysis
    const labels = candidateLabels || [];
    const hazardLabelsStr = labels.filter(l => !['clear sky', 'sunny day', 'normal conditions', 'unrelated object', 'random photo'].includes(l.toLowerCase())).join(', ');
    const spamLabelsStr = 'clear sky, sunny day, normal conditions, unrelated object, random photo';

    const prompt = `Analyze this image and determine what it shows.

You need to classify this image based on these possible categories:
- Hazard-related: ${hazardLabelsStr}
- Non-hazard/spam: ${spamLabelsStr}

The user reported this as: ${hazardType || 'unknown hazard'}

Respond in this exact JSON format:
{
  "scores": [array of confidence scores from 0-1 for each label],
  "labels": [array of matching labels in same order as scores],
  "topLabel": "the most likely classification",
  "topScore": 0.XX,
  "matchesReportedHazard": true/false,
  "analysis": "brief description of what's visible in the image"
}

Order results by confidence score descending.`;

    // Prepare image for Gemini
    const imagePart = {
      inlineData: {
        data: image,
        mimeType: 'image/jpeg'
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    let analysisResult;
    try {
      // Extract JSON from response (it might be wrapped in markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError, text);
      // Return a default response
      analysisResult = {
        scores: [0.5],
        labels: ['unknown'],
        topLabel: 'unknown',
        topScore: 0.5,
        matchesReportedHazard: false,
        analysis: text.substring(0, 200)
      };
    }

    // Format response to match expected format from CLIP
    res.json([{
      scores: analysisResult.scores || [analysisResult.topScore || 0.5],
      labels: analysisResult.labels || [analysisResult.topLabel || 'unknown'],
      analysis: analysisResult.analysis,
      matchesReportedHazard: analysisResult.matchesReportedHazard
    }]);

  } catch (error) {
    console.error('Error in Gemini image analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
