const supabase = require('../config/supabase');
const { calculateAdjustedScore, generateInterpretation } = require('../utils/demographicScoring');

// ─── Helper: Determine raw risk level from score ──────────────────────────────
const getRiskLevel = (score, maxScore, testType) => {
  if (testType === 'MMSE') {
    if (score >= 24) return 'Low';
    if (score >= 18) return 'Moderate';
    return 'High';
  }
  if (testType === 'MoCA') {
    if (score >= 26) return 'Low';
    if (score >= 18) return 'Moderate';
    return 'High';
  }
  const pct = (score / maxScore) * 100;
  return pct >= 70 ? 'Low' : pct >= 40 ? 'Moderate' : 'High';
};

// ─── Helper: Break answers into per-section scores ───────────────────────────
const computeSectionScores = (answers, questions) => {
  const sectionMap = {};
  questions.forEach((q) => {
    if (!sectionMap[q.section]) {
      sectionMap[q.section] = { correct: 0, total: 0 };
    }
    sectionMap[q.section].total += q.score;
    if (answers[q.id] === q.correctAnswer) {
      sectionMap[q.section].correct += q.score;
    }
  });
  return sectionMap;
};

// ─── Helper: Build a report_id string ────────────────────────────────────────
const genReportId = () => {
  return `REP-${Math.floor(1000 + Math.random() * 9000)}`;
};

// ─── Helper: Fetch user profile for demographic scoring ───────────────────────
const fetchUserDemographics = async (userId) => {
  const { data: user } = await supabase
    .from('users')
    .select('date_of_birth, gender, educational_qualification')
    .eq('id', userId)
    .single();

  if (!user) return null;

  // Calculate age from date_of_birth
  let age = null;
  if (user.date_of_birth) {
    const dob  = new Date(user.date_of_birth);
    const today = new Date();
    age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  }

  return {
    age,
    gender: user.gender,
    educationLevel: user.educational_qualification,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/tests/mmse
// @desc    Submit MMSE test answers, calculate score, save to DB
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
exports.submitMMSE = async (req, res) => {
  try {
    const { answers, duration_secs, questions } = req.body;

    if (!answers || !questions) {
      return res.status(400).json({
        success: false,
        message: 'Answers and questions are required.',
      });
    }

    const MAX_SCORE = 30;

    // Calculate raw score
    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) score += q.score;
    });

    const risk_level    = getRiskLevel(score, MAX_SCORE, 'MMSE');
    const section_scores = computeSectionScores(answers, questions);

    // ── Demographic adjustment ────────────────────────────────────────────────
    const demographics = await fetchUserDemographics(req.user.id);
    let adjustmentData = {};

    if (demographics && demographics.age && demographics.educationLevel) {
      const adj = calculateAdjustedScore({
        rawScore:       score,
        maxScore:       MAX_SCORE,
        testType:       'MMSE',
        age:            demographics.age,
        gender:         demographics.gender,
        educationLevel: demographics.educationLevel,
      });

      adjustmentData = {
        adjusted_score:  adj.adjustedScore,
        education_years: adj.educationYears,
        age_at_test:     adj.ageAtTest,
        gender_at_test:  adj.genderAtTest,
        norm_percentile: adj.normPercentile,
        adjusted_risk:   adj.adjustedRisk,
      };
    }

    // Save result to Supabase
    const { data: result, error } = await supabase
      .from('test_results')
      .insert({
        user_id: req.user.id,
        test_type: 'MMSE',
        score,
        max_score: MAX_SCORE,
        risk_level,
        answers,
        section_scores,
        duration_secs: duration_secs || null,
        ...adjustmentData,
      })
      .select()
      .single();

    if (error) {
      console.error('[MMSE Submit DB Error]', error);
      return res.status(500).json({ success: false, message: 'Failed to save test result.' });
    }

    // Build rich interpretation for response
    let demographicSummary = null;
    if (demographics && demographics.age && demographics.educationLevel) {
      const adj = calculateAdjustedScore({
        rawScore:       score,
        maxScore:       MAX_SCORE,
        testType:       'MMSE',
        age:            demographics.age,
        gender:         demographics.gender,
        educationLevel: demographics.educationLevel,
      });
      demographicSummary = {
        ...adj,
        interpretation: generateInterpretation(adj, 'MMSE'),
      };
    }

    // Auto-generate a report entry
    const reportSummary = demographicSummary
      ? `MMSE Score: ${score}/${MAX_SCORE}. Adjusted Score: ${demographicSummary.adjustedScore}. ` +
        `Normative Percentile: ${demographicSummary.normPercentile}th. Risk: ${demographicSummary.adjustedRisk}.`
      : `MMSE Score: ${score}/${MAX_SCORE}. Risk Level: ${risk_level}.`;

    await supabase.from('reports').insert({
      user_id:        req.user.id,
      report_id:      genReportId(),
      title:          'MMSE Assessment Summary',
      report_type:    'Clinical Test',
      test_result_id: result.id,
      risk_level:     demographicSummary?.adjustedRisk || risk_level,
      summary:        reportSummary,
    });

    res.status(201).json({
      success: true,
      data: {
        score,
        max_score:          MAX_SCORE,
        risk_level,
        section_scores,
        result_id:          result.id,
        demographic_adjustment: demographicSummary,
      },
    });
  } catch (err) {
    console.error('[MMSE Submit Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/tests/moca
// @desc    Submit MoCA test answers, calculate score + ML risk, save to DB
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
exports.submitMoCA = async (req, res) => {
  try {
    const { answers, duration_secs, questions } = req.body;

    if (!answers || !questions) {
      return res.status(400).json({
        success: false,
        message: 'Answers and questions are required.',
      });
    }

    const MAX_SCORE = 30;

    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) score += q.score;
    });

    const risk_level     = getRiskLevel(score, MAX_SCORE, 'MoCA');
    const section_scores = computeSectionScores(answers, questions);

    // ── Demographic adjustment (rule-based) ──────────────────────────────────
    const demographics = await fetchUserDemographics(req.user.id);
    let adjustmentData = {};

    if (demographics && demographics.age && demographics.educationLevel) {
      const adj = calculateAdjustedScore({
        rawScore:       score,
        maxScore:       MAX_SCORE,
        testType:       'MoCA',
        age:            demographics.age,
        gender:         demographics.gender,
        educationLevel: demographics.educationLevel,
      });

      adjustmentData = {
        adjusted_score:  adj.adjustedScore,
        education_years: adj.educationYears,
        age_at_test:     adj.ageAtTest,
        gender_at_test:  adj.genderAtTest,
        norm_percentile: adj.normPercentile,
        adjusted_risk:   adj.adjustedRisk,
      };
    }

    // ── ML Model Inference ───────────────────────────────────────────────────
    let mlResult = null;
    try {
      const { runCognitiveInference, EDU_YEARS, GENDER_TO_SEX } = require('./mlController');
      if (demographics && demographics.age) {
        const eduYears  = EDU_YEARS[demographics.educationLevel] ?? 12;
        const sex       = GENDER_TO_SEX[demographics.gender] ?? 1;
        mlResult = await runCognitiveInference(
          demographics.age, sex, eduYears, score, 0
        );
      }
    } catch (mlErr) {
      console.warn('[ML Inference skipped]', mlErr.message);
    }

    // If ML succeeded, use its (more accurate) percentile to override rule-based
    if (mlResult && !mlResult.error) {
      adjustmentData.norm_percentile = mlResult.norm_percentile;
      adjustmentData.adjusted_risk   = mlResult.risk_level;
    }

    const { data: result, error } = await supabase
      .from('test_results')
      .insert({
        user_id: req.user.id,
        test_type: 'MoCA',
        score,
        max_score: MAX_SCORE,
        risk_level,
        answers,
        section_scores,
        duration_secs: duration_secs || null,
        ...adjustmentData,
      })
      .select()
      .single();

    if (error) {
      console.error('[MoCA Submit DB Error]', error);
      return res.status(500).json({ success: false, message: 'Failed to save test result.' });
    }

    // Build rich interpretation for response
    let demographicSummary = null;
    if (demographics && demographics.age && demographics.educationLevel) {
      const adj = calculateAdjustedScore({
        rawScore:       score,
        maxScore:       MAX_SCORE,
        testType:       'MoCA',
        age:            demographics.age,
        gender:         demographics.gender,
        educationLevel: demographics.educationLevel,
      });
      demographicSummary = {
        ...adj,
        interpretation: mlResult?.interpretation || generateInterpretation(adj, 'MoCA'),
        // ML overrides
        ...(mlResult && !mlResult.error ? {
          normPercentile:  mlResult.norm_percentile,
          adjustedRisk:    mlResult.risk_level,
          normMean:        mlResult.expected_moca,
          zScore:          mlResult.adjusted_zscore,
          ml_probability:  mlResult.risk_probability,
        } : {}),
      };
    }

    // Report summary includes ML confidence
    const mlStr = mlResult && !mlResult.error
      ? ` ML Risk Confidence: ${Math.round(mlResult.risk_probability * 100)}%.`
      : '';
    const reportSummary = demographicSummary
      ? `MoCA Score: ${score}/${MAX_SCORE}. Adjusted Score: ${demographicSummary.adjustedScore}. ` +
        `Normative Percentile: ${demographicSummary.normPercentile}th. Risk: ${demographicSummary.adjustedRisk}.${mlStr}`
      : `MoCA Score: ${score}/${MAX_SCORE}. Risk Level: ${risk_level}.${mlStr}`;

    await supabase.from('reports').insert({
      user_id:        req.user.id,
      report_id:      genReportId(),
      title:          'MoCA Assessment Summary',
      report_type:    'Clinical Test',
      test_result_id: result.id,
      risk_level:     demographicSummary?.adjustedRisk || risk_level,
      summary:        reportSummary,
    });

    res.status(201).json({
      success: true,
      data: {
        score,
        max_score:              MAX_SCORE,
        risk_level,
        section_scores,
        result_id:              result.id,
        demographic_adjustment: demographicSummary,
        ml_prediction:          mlResult && !mlResult.error ? {
          risk_level:       mlResult.risk_level,
          risk_probability: mlResult.risk_probability,
          expected_moca:    mlResult.expected_moca,
          adjusted_zscore:  mlResult.adjusted_zscore,
          norm_percentile:  mlResult.norm_percentile,
          interpretation:   mlResult.interpretation,
        } : null,
      },
    });
  } catch (err) {
    console.error('[MoCA Submit Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/tests/history
// @desc    Get all test results for the logged-in user
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
exports.getTestHistory = async (req, res) => {
  try {
    const { test_type, limit = 10, offset = 0 } = req.query;

    let query = supabase
      .from('test_results')
      .select('id, test_type, score, max_score, risk_level, adjusted_score, norm_percentile, adjusted_risk, section_scores, duration_secs, age_at_test, education_years, completed_at')
      .eq('user_id', req.user.id)
      .order('completed_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (test_type) query = query.eq('test_type', test_type.toUpperCase());

    const { data: results, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch test history.' });
    }

    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (err) {
    console.error('[Get Test History Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/tests/clock
// @desc    Submit Clock Drawing test results
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
exports.submitClock = async (req, res) => {
  try {
    const { score, max_score = 10, target_time, metrics, suggestions, duration_secs } = req.body;

    const finalScore = Number(score) || 0;
    const finalMax   = Number(max_score) || 10;
    const pct = (finalScore / finalMax) * 100;
    const risk_level = pct >= 80 ? 'Low' : pct >= 50 ? 'Moderate' : 'High';

    const { data: result, error } = await supabase
      .from('test_results')
      .insert({
        user_id:        req.user.id,
        test_type:      'CLOCK',
        score:          finalScore,
        max_score:      finalMax,
        risk_level,
        answers:        { target_time, metrics, suggestions },
        section_scores: metrics || {},
        duration_secs:  duration_secs || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[Clock Submit DB Error]', error);
      return res.status(500).json({ success: false, message: 'Failed to save clock drawing result.' });
    }

    const reportSummary = `Clock Drawing Test (${target_time || 'Dynamic'}). Score: ${finalScore}/${finalMax} (${Math.round(pct)}%). ` +
      `Risk Level: ${risk_level}. Visuospatial & Executive function: ${risk_level === 'Low' ? 'Intact' : risk_level === 'Moderate' ? 'Borderline' : 'Impaired'}.`;

    await supabase.from('reports').insert({
      user_id:        req.user.id,
      report_id:      genReportId(),
      title:          'Clock Drawing Assessment Summary',
      report_type:    'Clinical Test',
      test_result_id: result.id,
      risk_level,
      summary:        reportSummary,
    });

    res.status(201).json({
      success: true,
      data: {
        id: result.id,
        score: finalScore,
        max_score: finalMax,
        risk_level,
        metrics,
        target_time,
        suggestions,
      },
    });
  } catch (err) {
    console.error('[Clock Submit Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/tests/trail
// @desc    Submit Trail Making test results
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
exports.submitTrail = async (req, res) => {
  try {
    const { level, time_seconds, errors = 0, classification, suggestions, duration_secs } = req.body;

    const secs = Number(time_seconds) || Number(duration_secs) || 30;
    const errCount = Number(errors) || 0;

    let risk_level = 'Low';
    if (secs > 75 || errCount >= 3) {
      risk_level = 'High';
    } else if (secs > 50 || errCount >= 1) {
      risk_level = 'Moderate';
    }

    // Calculated score out of 100 based on speed and accuracy
    const rawScore = Math.max(10, Math.min(100, Math.round(100 - (secs * 0.6) - (errCount * 12))));

    const { data: result, error } = await supabase
      .from('test_results')
      .insert({
        user_id:        req.user.id,
        test_type:      'TRAIL',
        score:          rawScore,
        max_score:      100,
        risk_level,
        answers:        { level, time_seconds: secs, errors: errCount, classification, suggestions },
        section_scores: { completion_time: secs, errors: errCount },
        duration_secs:  secs,
      })
      .select()
      .single();

    if (error) {
      console.error('[Trail Submit DB Error]', error);
      return res.status(500).json({ success: false, message: 'Failed to save trail making result.' });
    }

    const reportSummary = `Trail Making Test (${level || 'Part A'}). Completion Time: ${secs}s. Errors: ${errCount}. ` +
      `Classification: ${classification || risk_level}. Executive Attention & Processing Speed: ${risk_level}.`;

    await supabase.from('reports').insert({
      user_id:        req.user.id,
      report_id:      genReportId(),
      title:          'Trail Making Executive Function Report',
      report_type:    'Clinical Test',
      test_result_id: result.id,
      risk_level,
      summary:        reportSummary,
    });

    res.status(201).json({
      success: true,
      data: {
        id: result.id,
        score: rawScore,
        max_score: 100,
        risk_level,
        time_seconds: secs,
        errors: errCount,
        classification,
      },
    });
  } catch (err) {
    console.error('[Trail Submit Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/tests/latest-scores
// @desc    Get the latest MMSE, MoCA, Clock, and Trail scores for the dashboard
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
exports.getLatestScores = async (req, res) => {
  try {
    const { data: results, error } = await supabase
      .from('test_results')
      .select('test_type, score, max_score, risk_level, adjusted_score, norm_percentile, adjusted_risk, answers, completed_at')
      .eq('user_id', req.user.id)
      .order('completed_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch scores.' });
    }

    const latestMMSE  = results.find((r) => r.test_type === 'MMSE') || null;
    const latestMoCA  = results.find((r) => r.test_type === 'MoCA') || null;
    const latestClock = results.find((r) => r.test_type === 'CLOCK') || null;
    const latestTrail = results.find((r) => r.test_type === 'TRAIL') || null;

    res.status(200).json({
      success: true,
      data: {
        MMSE: latestMMSE,
        MoCA: latestMoCA,
        Clock: latestClock,
        Trail: latestTrail,
      },
    });
  } catch (err) {
    console.error('[GetLatestScores Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
