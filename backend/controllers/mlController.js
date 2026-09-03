const supabase = require("../config/supabase");
const { execFile } = require("child_process");
const path = require("path");
const { getPythonPath } = require("../utils/pythonPath");

const MODEL_DIR = path.join(__dirname, "../ml_model");
const INFERENCE = path.join(MODEL_DIR, "inference_cognitive.py");

// Education label → years mapping (matches ProfileEdit.jsx)
const EDU_YEARS = {
  "No Formal Education": 0,
  "Primary School": 6,
  "Middle School": 8,
  "High School": 12,
  "Some College": 14,
  "Bachelors Degree": 16,
  "Masters Degree": 18,
  "Doctoral Degree": 21,
};

const GENDER_TO_SEX = {
  Male: 1,
  Female: 2,
  Other: 1, // fallback
};

/**
 * Run the Python cognitive risk inference model.
 * Returns { risk_level, risk_probability, expected_moca, adjusted_zscore, norm_percentile, interpretation }
 */
const runCognitiveInference = (age, sex, educYears, mocaScore, cdrSum = 0) => {
  return new Promise((resolve, reject) => {
    const pythonPath = getPythonPath();
    const args = [
      INFERENCE,
      "--age",
      String(age),
      "--sex",
      String(sex),
      "--educ",
      String(educYears),
      "--moca",
      String(mocaScore),
      "--cdr",
      String(cdrSum),
    ];

    execFile(pythonPath, args, { timeout: 30000 }, (err, stdout, stderr) => {
      if (err) {
        console.error("[ML Inference Error]", err.message, stderr);
        // Graceful fallback — simple rule-based scoring
        return resolve(
          fallbackInference(age, sex, educYears, mocaScore, cdrSum),
        );
      }
      try {
        const result = JSON.parse(stdout.trim());
        return resolve(result);
      } catch (parseErr) {
        console.error("[ML Parse Error]", parseErr, stdout);
        return resolve(
          fallbackInference(age, sex, educYears, mocaScore, cdrSum),
        );
      }
    });
  });
};

/**
 * Rule-based fallback if Python model unavailable.
 * Uses the same normative tables as demographicScoring.js
 */
const fallbackInference = (age, sex, educYears, mocaScore, cdrSum) => {
  const expectedMoCA = getExpectedMoCA(age, educYears);
  const std = 3.5;
  const zScore = (mocaScore - expectedMoCA) / std;
  const percentile = zScoreToPercentile(zScore);

  let riskProb = 0.15;
  if (zScore < -1.5) riskProb += 0.3;
  if (zScore < -1.0) riskProb += 0.2;
  if (age > 80) riskProb += 0.1;
  if (cdrSum > 0) riskProb += 0.15;
  if (educYears < 9) riskProb += 0.05;
  riskProb = Math.min(riskProb, 0.95);

  const risk_level =
    riskProb < 0.25 ? "Low" : riskProb < 0.55 ? "Moderate" : "High";

  return {
    risk_level,
    risk_probability: parseFloat(riskProb.toFixed(3)),
    expected_moca: parseFloat(expectedMoCA.toFixed(2)),
    actual_moca: mocaScore,
    adjusted_zscore: parseFloat(zScore.toFixed(3)),
    norm_percentile: percentile,
    interpretation: `Fallback scoring (ML model unavailable). MoCA of ${mocaScore} versus expected ${expectedMoCA.toFixed(1)}. Z-score: ${zScore.toFixed(2)}.`,
    model_version: "fallback-1.0",
  };
};

const getExpectedMoCA = (age, educ) => {
  let base = 26.5;
  if (age > 80) base -= 1.5;
  else if (age > 75) base -= 1.0;
  else if (age > 70) base -= 0.5;
  if (educ <= 8) base -= 2.0;
  else if (educ < 12) base -= 1.0;
  return Math.max(base, 18);
};

const zScoreToPercentile = (z) => {
  // Approximation of normal CDF
  const t = 1 / (1 + 0.2315419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  const percentile = z > 0 ? (1 - p) * 100 : p * 100;
  return parseFloat(percentile.toFixed(1));
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/ml/predict
// @desc    Full demographic-adjusted cognitive risk prediction
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
exports.predictCognitiveRisk = async (req, res) => {
  try {
    const { moca_score, cdr_sum } = req.body;
    const user = req.user;

    // Pull demographic info from user account
    const dob = user.date_of_birth ? new Date(user.date_of_birth) : null;
    const age = dob
      ? Math.floor(
          (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
        )
      : null;
    const sex = GENDER_TO_SEX[user.gender] || 1;
    const educYears = EDU_YEARS[user.educational_qualification] ?? 12;

    if (!moca_score && moca_score !== 0) {
      return res
        .status(400)
        .json({ success: false, message: "moca_score is required." });
    }
    if (!age) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Date of birth must be set in your profile to use this feature.",
        });
    }

    const result = await runCognitiveInference(
      age,
      sex,
      educYears,
      parseFloat(moca_score),
      parseFloat(cdr_sum || 0),
    );

    // Persist result to test_results (if not already saved during MoCA test)
    const { data: saved } = await supabase
      .from("test_results")
      .insert({
        user_id: user.id,
        test_type: "ML_Predict",
        score: moca_score,
        max_score: 30,
        risk_level: result.risk_level,
        adjusted_score: parseFloat(result.adjusted_zscore?.toFixed(2)) || null,
        adjusted_risk: result.risk_level,
        norm_percentile: result.norm_percentile || null,
        age_at_test: age,
        education_years: educYears,
        details: JSON.stringify(result),
      })
      .select("id")
      .single();

    res.status(200).json({
      success: true,
      data: {
        ...result,
        user_demographics: {
          age,
          sex: user.gender,
          education_years: educYears,
        },
        result_id: saved?.id || null,
      },
    });
  } catch (err) {
    console.error("[ML Predict Error]", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Internal server error during ML inference.",
      });
  }
};

// Export helper for use in testController
exports.runCognitiveInference = runCognitiveInference;
exports.EDU_YEARS = EDU_YEARS;
exports.GENDER_TO_SEX = GENDER_TO_SEX;
