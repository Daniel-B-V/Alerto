/**
 * Text-based Spam Detection Service
 * Detects spam reports based on text content analysis
 */

/**
 * Detect spam patterns in report text
 * @param {Object} reportData - Report data with title and description
 * @returns {Object} - Spam detection result with confidence score
 */
export const detectSpamInText = (reportData) => {
  const { title = '', description = '', hazardType } = reportData;
  const fullText = `${title} ${description}`.toLowerCase();

  let spamScore = 0;
  const reasons = [];

  // 1. Check for repetitive characters (e.g., "asdadada", "asdasdasd")
  const repetitivePattern = /(.)\1{3,}|(.{2,})\2{2,}/g;
  if (repetitivePattern.test(fullText)) {
    spamScore += 40;
    reasons.push('Repetitive character patterns detected');
  }

  // 2. Check for keyboard mashing (random keys)
  const keyboardMashing = /^[qwertasdfzxcv]{5,}$|^[uiophjklbnm]{5,}$/i;
  if (keyboardMashing.test(fullText.replace(/\s/g, ''))) {
    spamScore += 35;
    reasons.push('Random keyboard mashing detected');
  }

  // 3. Check for very short descriptions (less than 10 characters)
  if (description.trim().length < 10) {
    spamScore += 20;
    reasons.push('Description too short (less than 10 characters)');
  }

  // 4. Check for missing meaningful words (mostly consonants or gibberish)
  const vowelRatio = (fullText.match(/[aeiou]/g) || []).length / fullText.length;
  if (vowelRatio < 0.15 && fullText.length > 5) {
    spamScore += 25;
    reasons.push('Gibberish text - very few vowels');
  }

  // 5. Check for all caps spam
  const capsRatio = (fullText.match(/[A-Z]/g) || []).length / fullText.replace(/\s/g, '').length;
  if (capsRatio > 0.7 && fullText.length > 10) {
    spamScore += 15;
    reasons.push('Excessive use of capital letters');
  }

  // 6. Check for single word descriptions
  const wordCount = description.trim().split(/\s+/).length;
  if (wordCount < 3) {
    spamScore += 15;
    reasons.push('Too few words in description');
  }

  // 7. Check for complete lack of spaces (e.g., "asdasdasdasd")
  if (description.length > 15 && !description.includes(' ')) {
    spamScore += 20;
    reasons.push('No spaces in description');
  }

  // 8. Check for common spam phrases
  const spamPhrases = ['test', 'testing', 'asdf', 'qwerty', 'zzz', 'xxx'];
  const hasSpamPhrase = spamPhrases.some(phrase => fullText.includes(phrase));
  if (hasSpamPhrase && description.length < 20) {
    spamScore += 15;
    reasons.push('Common spam/test phrase detected');
  }

  // Calculate confidence (inverse of spam score)
  // High spam score = low confidence
  const confidence = Math.max(0, Math.min(100, 100 - spamScore));

  return {
    isSpam: spamScore >= 60,
    confidence: confidence,
    spamScore: spamScore,
    reasons: reasons,
    detectionMethod: 'text_analysis'
  };
};

/**
 * Analyze report text using Gemini AI with strict protocol
 * @param {Object} reportData - Report data
 * @returns {Promise<Object>} - AI analysis result with protocol scores
 */
export const analyzeReportTextWithProtocol = async (reportData) => {
  try {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

    const { title, description, hazardType, location } = reportData;

    const prompt = `You are an AI verifying disaster reports. Follow this STRICT PROTOCOL to detect spam/fake reports.

**REPORT TO VERIFY:**
- Hazard Type: ${hazardType || 'Unknown'}
- Title: "${title || 'No title'}"
- Description: "${description || 'No description'}"
- Location: ${location?.city || 'Unknown'}, ${location?.barangay || 'Unknown'}

**VERIFICATION PROTOCOL - Score each criterion (0-100):**

**PROTOCOL 1: TEXT COHERENCE (0-100)**
- Is the text written in proper language?
- Are there complete sentences?
- Is grammar/structure reasonable?
- FAIL if: Gibberish (asdasd, qwerty, random letters)
- FAIL if: Repetitive patterns (asdadada, asdasdasd)
- FAIL if: Keyboard mashing
Score: ___/100

**PROTOCOL 2: MEANINGFUL CONTENT (0-100)**
- Does it describe a specific incident/situation?
- Are there concrete details (what, where, when)?
- Is there actual disaster-related information?
- FAIL if: Test text ("test", "testing", "asdf")
- FAIL if: Single words or <10 characters
- FAIL if: No actual incident described
Score: ___/100

**PROTOCOL 3: HAZARD TYPE MATCH (0-100)**
- Does description relate to the reported hazard type?
- Are mentioned conditions consistent with hazard?
- Does it make logical sense?
- FAIL if: Description completely unrelated
- FAIL if: Contradictory information
Score: ___/100

**PROTOCOL 4: LEGITIMACY INDICATORS (0-100)**
- Mentions specific locations/landmarks?
- Describes visible effects/damage?
- Uses disaster-related vocabulary?
- Sounds like eyewitness account?
- FAIL if: Generic placeholder text
- FAIL if: Copy-paste spam patterns
Score: ___/100

**CRITICAL RED FLAGS - Automatic SPAM if ANY present:**
- [ ] Repetitive characters (aaa, asdasd, etc.)
- [ ] Random keyboard letters (qwerty, asdfgh)
- [ ] Test/placeholder text
- [ ] Less than 10 meaningful characters
- [ ] No actual incident information
- [ ] Gibberish or nonsense

**RESPOND IN THIS EXACT JSON FORMAT:**
{
  "protocol1_coherence": 0-100,
  "protocol2_content": 0-100,
  "protocol3_hazard_match": 0-100,
  "protocol4_legitimacy": 0-100,
  "critical_red_flags": ["flag1", "flag2"] or [],
  "overall_confidence": 0-100,
  "is_spam": true/false,
  "verification_summary": "One sentence explaining the decision",
  "failed_protocols": ["Protocol 1", "Protocol 2"] or []
}

**SCORING RULES:**
- Overall confidence = Average of 4 protocol scores
- If ANY critical red flag present: is_spam = true, confidence ≤ 20
- If 2+ protocols score < 40: is_spam = true
- If overall confidence < 40: is_spam = true

BE EXTREMELY STRICT. If there's ANY doubt about legitimacy, mark as spam.`;

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.2, // Lower temperature for more consistent protocol following
        topK: 10,
        topP: 0.8,
        maxOutputTokens: 1024,
      }
    };

    console.log('🔍 Running Gemini Protocol-Based Spam Detection...');

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('📋 Gemini Protocol Analysis:', analysisText.substring(0, 500));

    // Parse JSON response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);

      const result = {
        confidence: analysis.overall_confidence || 50,
        reason: `${analysis.verification_summary || 'Protocol analysis complete'}. Failed: ${analysis.failed_protocols?.join(', ') || 'None'}`,
        isSpam: analysis.is_spam || false,
        protocolScores: {
          coherence: analysis.protocol1_coherence,
          content: analysis.protocol2_content,
          hazardMatch: analysis.protocol3_hazard_match,
          legitimacy: analysis.protocol4_legitimacy
        },
        redFlags: analysis.critical_red_flags || [],
        failedProtocols: analysis.failed_protocols || [],
        detectionMethod: 'gemini_protocol'
      };

      console.log('✅ Protocol Detection Result:', result);
      return result;
    }

    // Fallback
    console.warn('⚠️ Could not parse Gemini response');
    return {
      confidence: 50,
      reason: 'Could not parse AI protocol analysis',
      isSpam: false,
      detectionMethod: 'protocol_parse_failed'
    };

  } catch (error) {
    console.error('❌ Error in Gemini protocol analysis:', error);
    return {
      confidence: 50,
      reason: `Analysis error: ${error.message}`,
      isSpam: false,
      detectionMethod: 'error'
    };
  }
};

// Alias for backward compatibility
export const analyzeReportText = analyzeReportTextWithProtocol;
