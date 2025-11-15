const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;

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

    // Use the direct Inference API endpoint instead of router
    const response = await fetch('https://api-inference.huggingface.co/models/openai/clip-vit-large-patch14', {
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

module.exports = router;
