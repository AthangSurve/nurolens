const supabase = require('../config/supabase');

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/dashboard
// @desc    Returns all dashboard data in one API call
//          (user info, latest scores, recent activity, risk level, trend data)
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    // --- Parallel fetches for performance ---
    const [
      { data: testResults },
      { data: speechResults },
      { data: mriResults },
      { data: upcomingConsultations },
    ] = await Promise.all([
      supabase
        .from('test_results')
        .select('id, test_type, score, max_score, risk_level, completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(10),

      supabase
        .from('speech_analyses')
        .select('id, stability_pct, risk_level, submitted_at')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(3),

      supabase
        .from('mri_scans')
        .select('id, file_name, status, risk_level, submitted_at')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(3),

      supabase
        .from('consultations')
        .select('id, scheduled_at, meeting_url, doctors(full_name, specialty, image_url)')
        .eq('user_id', userId)
        .eq('status', 'upcoming')
        .order('scheduled_at', { ascending: true })
        .limit(1),
    ]);

    // --- Derive latest test scores ---
    const latestMMSE = testResults?.find((r) => r.test_type === 'MMSE') || null;
    const latestMoCA = testResults?.find((r) => r.test_type === 'MoCA') || null;
    const latestSpeech = speechResults?.[0] || null;
    const latestMRI = mriResults?.[0] || null;

    // --- Build Recent Activity list (last 5 events across all categories) ---
    const recentActivity = [
      ...(testResults || []).map((r) => ({
        type: `${r.test_type} Assessment`,
        date: r.completed_at,
        score: `${r.score}/${r.max_score}`,
        status: r.risk_level === 'Low' ? 'Optimal' : r.risk_level === 'Moderate' ? 'Moderate' : 'Elevated',
        risk: r.risk_level,
      })),
      ...(speechResults || []).map((s) => ({
        type: 'Speech Analysis',
        date: s.submitted_at,
        score: `${s.stability_pct}%`,
        status: s.risk_level === 'Low' ? 'Stable' : s.risk_level,
        risk: s.risk_level,
      })),
      ...(mriResults || []).map((m) => ({
        type: 'MRI Analysis',
        date: m.submitted_at,
        score: m.status,
        status: m.risk_level === 'Low' ? 'Verified' : m.risk_level,
        risk: m.risk_level,
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    // --- Overall Risk ---
    const riskPriority = { High: 3, Moderate: 2, Low: 1 };
    const allRisks = [
      latestMMSE?.risk_level,
      latestMoCA?.risk_level,
      latestSpeech?.risk_level,
      latestMRI?.risk_level,
    ].filter(Boolean);

    const overallRisk = allRisks.length > 0
      ? allRisks.reduce((max, r) => riskPriority[r] > riskPriority[max] ? r : max, 'Low')
      : null;

    const overallRiskPercent = { Low: 12, Moderate: 45, High: 78 };

    // --- Trend data (last 7 MMSE+MoCA) for chart ---
    const trendData = (testResults || [])
      .slice(0, 7)
      .reverse()
      .map((r) => ({
        label: r.test_type,
        score: r.score,
        max: r.max_score,
        percent: Math.round((r.score / r.max_score) * 100),
        date: r.completed_at,
      }));

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
        overall_risk: overallRisk,
        overall_risk_percent: overallRisk ? overallRiskPercent[overallRisk] : 0,
        latest_scores: {
          MMSE: latestMMSE,
          MoCA: latestMoCA,
          speech: latestSpeech,
          mri: latestMRI,
        },
        recent_activity: recentActivity,
        upcoming_consultation: upcomingConsultations?.[0] ? {
          ...upcomingConsultations[0],
          meeting_url: (upcomingConsultations[0].meeting_url || '').replace('https://meet.cognifusion.app/session/', 'https://meet.jit.si/NeuroLens-Session-')
        } : null,
        tests_completed: (testResults?.length || 0) + (speechResults?.length || 0) + (mriResults?.length || 0),
      },
    });
  } catch (err) {
    console.error('[Dashboard Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
