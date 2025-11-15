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

    const response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-mnli', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', response.status, errorText);
      return res.status(response.status).json({ error: `Hugging Face API error: ${response.status}` });
    }

    const data = await response.json();
    res.json(data);

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
