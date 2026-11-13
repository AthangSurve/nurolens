const supabase = require('../config/supabase');

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/doctor-portal/patients
// @desc    Get all patients with their latest test scores
// @access  Doctor only
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllPatients = async (req, res) => {
  try {
    // Fetch all patient users
    const { data: patients, error } = await supabase
      .from('users')
      .select('id, full_name, email, patient_id, date_of_birth, gender, educational_qualification')
      .eq('role', 'patient')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to load patients.' });
    }

    // For each patient, get their latest test results and overall risk
    const patientsWithScores = await Promise.all(
      patients.map(async (patient) => {
        const { data: tests } = await supabase
          .from('test_results')
          .select('test_type, score, max_score, risk_level, adjusted_risk, norm_percentile, completed_at')
          .eq('user_id', patient.id)
          .order('completed_at', { ascending: false })
          .limit(10);

        const { data: latestSpeech } = await supabase
          .from('speech_analyses')
          .select('risk_level, submitted_at')
          .eq('user_id', patient.id)
          .order('submitted_at', { ascending: false })
          .limit(1);

        const { data: prescriptions } = await supabase
          .from('mri_prescriptions')
          .select('id, status, prescribed_at')
          .eq('patient_id', patient.id)
          .order('prescribed_at', { ascending: false })
          .limit(1);

        const latestMMSE = tests?.find((t) => t.test_type === 'MMSE');
        const latestMoCA = tests?.find((t) => t.test_type === 'MoCA');
        const latestSpeechEntry = latestSpeech?.[0];

        // Compute overall risk (weighted)
        const riskScore = { Low: 1, Moderate: 2, High: 3 };
        const scoreToRisk = (s) => (s <= 1.5 ? 'Low' : s <= 2.4 ? 'Moderate' : 'High');
        const clinical = [latestMMSE, latestMoCA]
          .filter(Boolean)
          .map((r) => riskScore[r.adjusted_risk || r.risk_level] || 1);
        const clinicalAvg = clinical.length ? clinical.reduce((a, b) => a + b) / clinical.length : null;
        const speechScore = latestSpeechEntry ? riskScore[latestSpeechEntry.risk_level] || 1 : null;

        let wSum = 0, wTotal = 0;
        if (clinicalAvg !== null) { wSum += clinicalAvg * 0.4; wTotal += 0.4; }
        if (speechScore !== null)  { wSum += speechScore  * 0.3; wTotal += 0.3; }
        const overallRisk = wTotal > 0 ? scoreToRisk(wSum / wTotal) : 'No Data';

        return {
          ...patient,
          latest_mmse: latestMMSE || null,
          latest_moca: latestMoCA || null,
          latest_speech_risk: latestSpeechEntry?.risk_level || null,
          overall_risk: overallRisk,
          tests_completed: (tests || []).length,
          has_pending_prescription: prescriptions?.[0]?.status === 'pending',
        };
      })
    );

    res.status(200).json({ success: true, count: patientsWithScores.length, data: patientsWithScores });
  } catch (err) {
    console.error('[Doctor Portal - getAllPatients]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/doctor-portal/patients/:patientId
// @desc    Get full report history for a specific patient
// @access  Doctor only
// ─────────────────────────────────────────────────────────────────────────────
exports.getPatientDetails = async (req, res) => {
  try {
    const { patientId } = req.params;

    const { data: patient, error: patError } = await supabase
      .from('users')
      .select('id, full_name, email, patient_id, date_of_birth, gender, educational_qualification')
      .eq('id', patientId)
      .eq('role', 'patient')
      .single();

    if (patError || !patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const { data: tests }    = await supabase.from('test_results').select('*').eq('user_id', patientId).order('completed_at', { ascending: false });
    const { data: speech }   = await supabase.from('speech_analyses').select('*').eq('user_id', patientId).order('submitted_at', { ascending: false }).limit(5);
    const { data: mriScans } = await supabase.from('mri_scans').select('*').eq('user_id', patientId).order('submitted_at', { ascending: false }).limit(5);
    const { data: reports }  = await supabase.from('reports').select('*').eq('user_id', patientId).order('created_at', { ascending: false });
    const { data: doctorNotes } = await supabase.from('doctor_notes').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
    const { data: prescriptions } = await supabase.from('mri_prescriptions').select('*').eq('patient_id', patientId).order('prescribed_at', { ascending: false });

    res.status(200).json({
      success: true,
      data: { patient, tests: tests || [], speech: speech || [], mri: mriScans || [], reports: reports || [], doctor_notes: doctorNotes || [], prescriptions: prescriptions || [] },
    });
  } catch (err) {
    console.error('[Doctor Portal - getPatientDetails]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/doctor-portal/prescriptions
// @desc    Prescribe an MRI scan for a patient
// @access  Doctor only
// ─────────────────────────────────────────────────────────────────────────────
exports.prescribeMRI = async (req, res) => {
  try {
    const { patient_id, notes, report_id } = req.body;

    if (!patient_id) {
      return res.status(400).json({ success: false, message: 'patient_id is required.' });
    }

    const { data: prescription, error } = await supabase
      .from('mri_prescriptions')
      .insert({ doctor_id: req.user.id, patient_id, notes: notes || null, report_id: report_id || null })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to create prescription.' });
    }

    // Create a notification report entry for the patient
    await supabase.from('reports').insert({
      user_id: patient_id,
      report_id: `PRESC-${Math.floor(1000 + Math.random() * 9000)}`,
      title: 'MRI Scan Prescribed',
      report_type: 'Doctor Prescription',
      risk_level: 'Moderate',
      summary: `Dr. ${req.user.full_name} has prescribed an MRI scan. Notes: ${notes || 'Please schedule your MRI scan as soon as possible.'}`,
    });

    res.status(201).json({ success: true, data: prescription, message: 'MRI scan prescribed successfully.' });
  } catch (err) {
    console.error('[Doctor Portal - prescribeMRI]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/doctor-portal/notes
// @desc    Add a doctor note to a patient's record
// @access  Doctor only
// ─────────────────────────────────────────────────────────────────────────────
exports.addDoctorNote = async (req, res) => {
  try {
    const { patient_id, report_id, note, improvements, diagnosis, recommendations } = req.body;
    if (!patient_id || !note) {
      return res.status(400).json({ success: false, message: 'patient_id and note are required.' });
    }
    const { data, error } = await supabase
      .from('doctor_notes')
      .insert({
        doctor_id: req.user.id,
        patient_id,
        report_id: report_id || null,
        note,
        improvements: improvements || recommendations || null,
        diagnosis: diagnosis || null,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to save note.' });
    }

    // Auto-create a clinical recommendation report entry for the patient
    await supabase.from('reports').insert({
      user_id: patient_id,
      report_id: `NOTE-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `Clinical Recommendations — Dr. ${req.user.full_name}`,
      report_type: 'Doctor Consultation Note',
      risk_level: 'Moderate',
      summary: `${note}${improvements ? ` | Targeted Improvements: ${improvements}` : ''}`,
    });

    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('[Doctor Portal - addDoctorNote]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/doctor-portal/consultations
// @desc    Get all consultations scheduled with the logged-in doctor
// @access  Doctor only
// ─────────────────────────────────────────────────────────────────────────────
exports.getDoctorConsultations = async (req, res) => {
  try {
    const doctorUserId = req.user.id;
    // Find all doctor records matching user id or name
    const { data: allDocs } = await supabase.from('doctors').select('id, user_id, full_name');
    const matchingDocs = (allDocs || []).filter(
      (d) => d.id === doctorUserId || d.user_id === doctorUserId || (d.full_name && req.user.full_name && d.full_name.toLowerCase().includes(req.user.full_name.toLowerCase()))
    );
    const doctorIds = new Set([doctorUserId, ...matchingDocs.map((d) => d.id), ...matchingDocs.map((d) => d.user_id).filter(Boolean)]);

    // Fetch consultations
    const { data: allConsultations, error } = await supabase
      .from('consultations')
      .select('id, doctor_id, user_id, scheduled_at, duration_mins, status, notes, meeting_url, created_at')
      .order('scheduled_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch consultations.' });
    }

    const filtered = (allConsultations || []).filter((c) => doctorIds.has(c.doctor_id));

    // Attach patient info
    const withPatients = await Promise.all(
      filtered.map(async (c) => {
        const { data: patient } = await supabase
          .from('users')
          .select('id, full_name, email, patient_id, date_of_birth, gender')
          .eq('id', c.user_id)
          .single();
        let mUrl = c.meeting_url;
        if (!mUrl || mUrl.includes('meet.jit.si') || mUrl.includes('meet.cognifusion.app')) {
          mUrl = process.env.DEFAULT_GOOGLE_MEET_URL || 'https://meet.google.com/neu-lens-doc';
        }
        return {
          ...c,
          meeting_url: mUrl,
          patient: patient || { full_name: 'Patient', patient_id: 'N/A' },
        };
      })
    );

    res.status(200).json({ success: true, data: withPatients });
  } catch (err) {
    console.error('[Doctor Portal - getDoctorConsultations]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/doctor-portal/me
// @desc    Get doctor's own profile
// @access  Doctor only
// ─────────────────────────────────────────────────────────────────────────────
exports.getDoctorProfile = async (req, res) => {
  const { data: notes } = await supabase.from('doctor_notes').select('id').eq('doctor_id', req.user.id);
  const { data: prescriptions } = await supabase.from('mri_prescriptions').select('id').eq('doctor_id', req.user.id);
  res.status(200).json({
    success: true,
    data: {
      ...req.user,
      total_notes: notes?.length || 0,
      total_prescriptions: prescriptions?.length || 0,
    },
  });
};
