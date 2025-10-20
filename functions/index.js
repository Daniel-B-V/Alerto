/**
 * Cloud Functions for Alerto Weather Alert Dashboard
 *
 * Features:
 * - AI-powered credibility checking for community reports
 * - Report compression and summarization
 * - Admin notifications for high-priority reports
 * - Automatic spam detection
 */

const {onDocumentCreated, onDocumentUpdated} = require("firebase-functions/v2/firestore");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Triggered when a new report is created
 * Performs AI credibility analysis and notifies admins if needed
 */
exports.processNewReport = onDocumentCreated("reports/{reportId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.info("No data associated with the event");
    return;
  }

  const reportData = snapshot.data();
  const reportId = event.params.reportId;

  logger.info(`Processing new report: ${reportId}`);

  try {
    // Perform AI credibility analysis
    const analysis = await analyzeReportCredibility(reportData);

    // Store AI analysis results
    await admin.firestore().collection("ai_analysis").doc(reportId).set({
      reportId: reportId,
      credibilityScore: analysis.credibilityScore,
      aiSummary: analysis.summary,
      flags: analysis.flags,
      recommendation: analysis.recommendation,
      analyzedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update report with AI analysis
    await admin.firestore().collection("reports").doc(reportId).update({
      credibilityScore: analysis.credibilityScore,
      aiSummary: analysis.summary,
      aiFlags: analysis.flags,
      status: analysis.recommendation === "approve" ? "verified" :
              analysis.recommendation === "reject" ? "rejected" : "pending",
    });

    // Notify admins if high credibility and high severity
    if (analysis.credibilityScore >= 0.7 &&
        (reportData.severity === "high" || reportData.severity === "critical")) {
      await notifyAdmins(reportId, reportData, analysis);
    }

    logger.info(`Report ${reportId} processed successfully. Score: ${analysis.credibilityScore}`);
  } catch (error) {
    logger.error(`Error processing report ${reportId}:`, error);
    // Don't throw - we don't want to block report creation
  }
});

/**
 * Analyze report credibility using AI
 * In production, this would call Claude API, OpenAI, or Google's Gemini
 */
async function analyzeReportCredibility(reportData) {
  // TODO: Integrate actual AI API (Claude, OpenAI, or Gemini)
  // For now, implementing a basic rule-based system

  const flags = [];
  let credibilityScore = 0.5; // Start with neutral score

  // Check for complete information
  if (reportData.title && reportData.description && reportData.location) {
    credibilityScore += 0.1;
  } else {
    flags.push("incomplete_information");
  }

  // Check for image attachments (more credible)
  if (reportData.images && reportData.images.length > 0) {
    credibilityScore += 0.15;
  } else {
    flags.push("no_visual_evidence");
  }

  // Check description length (too short might be spam)
  if (reportData.description) {
    const wordCount = reportData.description.split(/\s+/).length;
    if (wordCount < 10) {
      credibilityScore -= 0.2;
      flags.push("insufficient_details");
    } else if (wordCount > 20) {
      credibilityScore += 0.1;
    }
  }

  // Check for spam keywords
  const spamKeywords = ["click here", "buy now", "limited time", "act now"];
  const hasSpam = spamKeywords.some((keyword) =>
    reportData.description?.toLowerCase().includes(keyword) ||
    reportData.title?.toLowerCase().includes(keyword)
  );
  if (hasSpam) {
    credibilityScore -= 0.4;
    flags.push("potential_spam");
  }

  // Check for location specificity
  if (reportData.location?.barangay && reportData.location?.city) {
    credibilityScore += 0.15;
  } else {
    flags.push("vague_location");
  }

  // Normalize score to 0-1 range
  credibilityScore = Math.max(0, Math.min(1, credibilityScore));

  // Generate AI summary (simplified version)
  const summary = generateSummary(reportData);

  // Determine recommendation
  let recommendation = "pending";
  if (credibilityScore >= 0.75 && flags.length === 0) {
    recommendation = "approve";
  } else if (credibilityScore < 0.3 || flags.includes("potential_spam")) {
    recommendation = "reject";
  }

  return {
    credibilityScore: Number(credibilityScore.toFixed(2)),
    summary,
    flags,
    recommendation,
  };
}

/**
 * Generate a compressed summary of the report
 */
function generateSummary(reportData) {
  // In production, this would use AI to generate intelligent summaries
  const location = reportData.location ?
    `${reportData.location.barangay || ""}, ${reportData.location.city || ""}`.trim() :
    "Unknown location";

  return `${reportData.severity?.toUpperCase() || "UNKNOWN"} severity weather event reported in ${location}. ` +
         `${reportData.title || "No title"}. ` +
         `${reportData.description?.substring(0, 100) || "No description"}...`;
}

/**
 * Notify admin users about high-priority reports
 */
async function notifyAdmins(reportId, reportData, analysis) {
  try {
    // Get all admin users
    const adminsSnapshot = await admin.firestore()
        .collection("users")
        .where("role", "==", "admin")
        .get();

    if (adminsSnapshot.empty) {
      logger.warn("No admin users found to notify");
      return;
    }

    // Create notification for each admin
    const notifications = [];
    adminsSnapshot.forEach((doc) => {
      notifications.push(
          admin.firestore().collection("notifications").add({
            userId: doc.id,
            type: "new_high_priority_report",
            reportId: reportId,
            title: `New ${reportData.severity} Report`,
            message: analysis.summary,
            credibilityScore: analysis.credibilityScore,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          })
      );
    });

    await Promise.all(notifications);
    logger.info(`Notified ${adminsSnapshot.size} admins about report ${reportId}`);
  } catch (error) {
    logger.error("Error notifying admins:", error);
  }
}

/**
 * Callable function to manually trigger AI analysis on existing reports
 * Can be called from the frontend by admins
 */
exports.reanalyzeReport = onCall({cors: true}, async (request) => {
  // Check if user is admin
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const reportId = request.data.reportId;
  if (!reportId) {
    throw new HttpsError("invalid-argument", "reportId is required");
  }

  try {
    // Get report data
    const reportDoc = await admin.firestore().collection("reports").doc(reportId).get();
    if (!reportDoc.exists) {
      throw new HttpsError("not-found", "Report not found");
    }

    const reportData = reportDoc.data();

    // Perform analysis
    const analysis = await analyzeReportCredibility(reportData);

    // Update Firestore
    await admin.firestore().collection("ai_analysis").doc(reportId).set({
      reportId: reportId,
      credibilityScore: analysis.credibilityScore,
      aiSummary: analysis.summary,
      flags: analysis.flags,
      recommendation: analysis.recommendation,
      analyzedAt: admin.firestore.FieldValue.serverTimestamp(),
      triggeredBy: request.auth.uid,
    });

    return {
      success: true,
      analysis: analysis,
    };
  } catch (error) {
    logger.error(`Error reanalyzing report ${reportId}:`, error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Get AI analysis for a report
 */
exports.getReportAnalysis = onCall({cors: true}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const reportId = request.data.reportId;
  if (!reportId) {
    throw new HttpsError("invalid-argument", "reportId is required");
  }

  try {
    const analysisDoc = await admin.firestore()
        .collection("ai_analysis")
        .doc(reportId)
        .get();

    if (!analysisDoc.exists) {
      return {
        success: false,
        message: "No analysis found for this report",
      };
    }

    return {
      success: true,
      analysis: analysisDoc.data(),
    };
  } catch (error) {
    logger.error(`Error getting analysis for report ${reportId}:`, error);
    throw new HttpsError("internal", error.message);
  }
});
