/**
 * Text-based Spam Detection Service using Hugging Face
 * Detects spam reports based on text content analysis
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const HF_API_KEY = import.meta.env.VITE_HUGGING_FACE_API_KEY;

/**
 * Detect spam patterns in report text (Rule-based)
 * @param {Object} reportData - Report data with title and description
 * @returns {Object} - Spam detection result with confidence score
 */
export const detectSpamInText = (reportData) => {
  const { title = '', description = '', hazardType } = reportData;
  const fullText = `${title} ${description}`.toLowerCase();

  let spamScore = 0;
  const reasons = [];

  // 1. Check for repetitive characters (e.g., "asdadada", "asdasdasd")
  // STRICTER: Lower threshold and higher penalty
  const repetitivePattern = /(.)\1{2,}|(.{2,})\2{2,}/g;
  const repetitiveMatches = fullText.match(repetitivePattern);
  if (repetitiveMatches && repetitiveMatches.length > 0) {
    spamScore += 50; // Increased from 40
    reasons.push('Repetitive character patterns detected');
  }

  // 2. Check for keyboard mashing (random keys)
  const keyboardMashing = /^[qwertasdfzxcv]{4,}$|^[uiophjklbnm]{4,}$|asdasd|sdasd|qweqwe|asdas/i;
  if (keyboardMashing.test(fullText.replace(/\s/g, ''))) {
    spamScore += 45; // Increased from 35
    reasons.push('Random keyboard mashing detected');
  }

  // 3. Check for very short descriptions (less than 10 characters)
  if (description.trim().length < 10) {
    spamScore += 25; // Increased from 20
    reasons.push('Description too short (less than 10 characters)');
  }

  // 4. Check for missing meaningful words (mostly consonants or gibberish)
  const vowelRatio = (fullText.match(/[aeiou]/g) || []).length / fullText.length;
  if (vowelRatio < 0.2 && fullText.length > 5) { // Increased threshold from 0.15 to 0.2
    spamScore += 30; // Increased from 25
    reasons.push('Gibberish text - very few vowels');
  }

  // 5. Check for all caps spam
  const capsRatio = (fullText.match(/[A-Z]/g) || []).length / fullText.replace(/\s/g, '').length;
  if (capsRatio > 0.7 && fullText.length > 10) {
    spamScore += 20; // Increased from 15
    reasons.push('Excessive use of capital letters');
  }

  // 6. Check for single word descriptions
  const wordCount = description.trim().split(/\s+/).length;
  if (wordCount < 3) {
    spamScore += 20; // Increased from 15
    reasons.push('Too few words in description');
  }

  // 7. Check for complete lack of spaces (e.g., "asdasdasdasd")
  if (description.length > 10 && !description.includes(' ')) { // Lowered threshold from 15 to 10
    spamScore += 30; // Increased from 20
    reasons.push('No spaces in description');
  }

  // 8. Check for common spam phrases
  const spamPhrases = ['test', 'testing', 'asdf', 'qwerty', 'zzz', 'xxx', 'aaa', 'bbb'];
  const hasSpamPhrase = spamPhrases.some(phrase => fullText.includes(phrase));
  if (hasSpamPhrase && description.length < 30) { // Increased threshold from 20 to 30
    spamScore += 20; // Increased from 15
    reasons.push('Common spam/test phrase detected');
  }

  // 9. NEW: Check for same character/pattern more than 50% of text
  const uniqueChars = new Set(fullText.replace(/\s/g, '').toLowerCase()).size;
  if (uniqueChars < 5 && fullText.length > 10) {
    spamScore += 35;
    reasons.push('Very limited character variety - likely spam');
  }

  // Calculate confidence (inverse of spam score)
  // High spam score = low confidence
  const confidence = Math.max(0, Math.min(100, 100 - spamScore));

  return {
    isSpam: spamScore >= 50, // Lowered from 60 to be stricter
    confidence: confidence,
    spamScore: spamScore,
    reasons: reasons,
    detectionMethod: 'text_analysis'
  };
};

/**
 * Analyze report text using Hugging Face NLI model
 * @param {Object} reportData - Report data
 * @returns {Promise<Object>} - AI analysis result with protocol scores
 */
export const analyzeReportTextWithProtocol = async (reportData) => {
  try {
    const { title, description, hazardType, location } = reportData;

    // First run rule-based detection
    const ruleBasedResult = detectSpamInText(reportData);

    // If rule-based detection already flags as spam, return early
    if (ruleBasedResult.isSpam) {
      return {
        confidence: ruleBasedResult.confidence,
        reason: `Rule-based spam detection: ${ruleBasedResult.reasons.join(', ')}`,
        isSpam: true,
        protocolScores: {
          coherence: ruleBasedResult.confidence,
          content: ruleBasedResult.confidence,
          hazardMatch: ruleBasedResult.confidence,
          legitimacy: ruleBasedResult.confidence
        },
        redFlags: ruleBasedResult.reasons,
        failedProtocols: ['Text Analysis'],
        detectionMethod: 'rule_based'
      };
    }

    // Use Hugging Face for deeper semantic analysis
    const fullText = `${title} ${description}`;

    // Define hypothesis for natural language inference
    const hypotheses = {
      coherence: 'This text is coherent and well-structured',
      legitimacy: 'This describes a real disaster or emergency situation',
      spam: 'This is spam or test content',
      hazardMatch: `This describes ${hazardType} hazard conditions`
    };

    // Call Hugging Face NLI model for each hypothesis
    const results = await Promise.all([
      classifyText(fullText, hypotheses.coherence),
      classifyText(fullText, hypotheses.legitimacy),
      classifyText(fullText, hypotheses.spam),
      classifyText(fullText, hypotheses.hazardMatch)
    ]);

    const [coherenceResult, legitimacyResult, spamResult, hazardMatchResult] = results;

    // Convert entailment scores to protocol scores (0-100)
    const coherenceScore = Math.round(coherenceResult.entailment * 100);
    const legitimacyScore = Math.round(legitimacyResult.entailment * 100);
    const spamScore = Math.round(spamResult.entailment * 100);
    const hazardMatchScore = Math.round(hazardMatchResult.entailment * 100);

    // Calculate overall confidence
    // Lower spam score is better, higher other scores are better
    const overallConfidence = Math.round(
      (coherenceScore + legitimacyScore + (100 - spamScore) + hazardMatchScore) / 4
    );

    // Determine if spam - STRICTER thresholds
    const isSpam = spamScore > 50 || overallConfidence < 40; // Lowered spam threshold from 60 to 50

    const redFlags = [];
    if (coherenceScore < 40) redFlags.push('Incoherent text structure');
    if (legitimacyScore < 40) redFlags.push('Does not appear to describe real emergency');
    if (spamScore > 50) redFlags.push('High spam indicators'); // Lowered from 60 to 50
    if (hazardMatchScore < 30) redFlags.push('Does not match reported hazard type');

    const failedProtocols = [];
    if (coherenceScore < 40) failedProtocols.push('Protocol 1: Coherence');
    if (legitimacyScore < 40) failedProtocols.push('Protocol 2: Legitimacy');
    if (hazardMatchScore < 40) failedProtocols.push('Protocol 3: Hazard Match');

    console.log('✅ Hugging Face NLI Analysis Complete:', {
      coherenceScore,
      legitimacyScore,
      spamScore,
      hazardMatchScore,
      overallConfidence,
      isSpam
    });

    return {
      confidence: overallConfidence,
      reason: `HF NLI analysis: ${overallConfidence}% confidence. ${redFlags.length > 0 ? redFlags.join(', ') : 'All checks passed'}`,
      isSpam: isSpam,
      protocolScores: {
        coherence: coherenceScore,
        content: legitimacyScore,
        hazardMatch: hazardMatchScore,
        legitimacy: legitimacyScore
      },
      redFlags: redFlags,
      failedProtocols: failedProtocols,
      detectionMethod: 'huggingface_nli'
    };

  } catch (error) {
    console.error('❌ Error in Hugging Face NLI analysis:', error);

    // Fallback to rule-based
    const fallbackResult = detectSpamInText(reportData);
    return {
      confidence: fallbackResult.confidence,
      reason: `Analysis error, using rule-based: ${error.message}`,
      isSpam: fallbackResult.isSpam,
      protocolScores: {
        coherence: fallbackResult.confidence,
        content: fallbackResult.confidence,
        hazardMatch: 50,
        legitimacy: fallbackResult.confidence
      },
      redFlags: fallbackResult.reasons,
      detectionMethod: 'fallback_rule_based'
    };
  }
};

/**
 * Classify text using Hugging Face NLI model
 * @param {string} text - Text to classify
 * @param {string} hypothesis - Hypothesis to test
 * @returns {Promise<Object>} - Classification scores
 */
async function classifyText(text, hypothesis) {
  try {
    // Use backend proxy to avoid CORS issues
    const response = await fetch(`${BACKEND_URL}/api/huggingface/text-sentiment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: `${text} [SEP] ${hypothesis}`
      })
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();

    // Parse NLI results
    const scores = {};
    if (Array.isArray(data) && data.length > 0) {
      data[0].forEach(item => {
        scores[item.label.toLowerCase()] = item.score;
      });
    }

    return {
      entailment: scores.entailment || 0,
      contradiction: scores.contradiction || 0,
      neutral: scores.neutral || 0
    };

  } catch (error) {
    console.error('Error in HF text classification:', error);
    return {
      entailment: 0.5,
      contradiction: 0.25,
      neutral: 0.25
    };
  }
}

// Alias for backward compatibility
export const analyzeReportText = analyzeReportTextWithProtocol;
