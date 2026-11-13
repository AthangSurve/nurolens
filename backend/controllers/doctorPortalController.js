const supabase = require('../config/supabase');
const { normalizeDoctorName } = require('../utils/doctorIdentity');

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
          has_pending_prescription: Boolean(
            prescriptions?.[0] && (!prescriptions[0].status || prescriptions[0].status === 'pending')
          ),
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
      .insert({
        doctor_id: req.user.id,
        patient_id,
        notes: notes || null,
        report_id: report_id || null,
        status: 'pending',
        prescribed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to create prescription.' });
    }

    res.status(201).json({ success: true, data: prescription, message: 'MRI scan prescribed successfully.' });
  } catch (err) {
    console.error('[Doctor Portal - prescribeMRI]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/doctor-portal/mri/:scanId/review
// @desc    Approve MRI model results or request follow-up
// @access  Doctor only; the prescribing doctor must review
// ─────────────────────────────────────────────────────────────────────────────
exports.reviewMRIScan = async (req, res) => {
  try {
    const { scanId } = req.params;
    const { review_status, review_notes } = req.body;

    if (!['approved', 'needs_follow_up'].includes(review_status)) {
      return res.status(400).json({ success: false, message: 'Choose approval or follow-up review status.' });
    }

    const { data: scan, error: scanError } = await supabase
      .from('mri_scans')
      .select('id, user_id, mri_prescription_id, file_name, risk_level, analysis_notes, status')
      .eq('id', scanId)
      .single();

    if (scanError || !scan) {
      return res.status(404).json({ success: false, message: 'MRI scan not found.' });
    }
    if (!scan.mri_prescription_id) {
      return res.status(400).json({ success: false, message: 'This scan is not linked to an MRI prescription.' });
    }
    if (review_status === 'approved' && (scan.status === 'failed' || !scan.risk_level)) {
      return res.status(400).json({ success: false, message: 'This scan has no model result to approve. Request a follow-up scan instead.' });
    }

    const { data: prescription, error: prescriptionError } = await supabase
      .from('mri_prescriptions')
      .select('id, doctor_id')
      .eq('id', scan.mri_prescription_id)
      .eq('patient_id', scan.user_id)
      .single();

    if (prescriptionError || !prescription) {
      return res.status(404).json({ success: false, message: 'Related MRI prescription not found.' });
    }
    if (prescription.doctor_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the prescribing doctor can review this scan.' });
    }

    const { data: reviewedScan, error: reviewError } = await supabase
      .from('mri_scans')
      .update({
        review_status,
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: review_notes?.trim() || null,
      })
      .eq('id', scanId)
      .select()
      .single();

    if (reviewError) {
      console.error('[MRI Review Update Error]', reviewError);
      return res.status(500).json({ success: false, message: 'Failed to save MRI review.' });
    }

    if (review_status === 'needs_follow_up') {
      const { error: prescriptionResetError } = await supabase
        .from('mri_prescriptions')
        .update({ status: 'pending' })
        .eq('id', prescription.id);
      if (prescriptionResetError) {
        console.error('[MRI Follow-up Prescription Error]', prescriptionResetError);
        return res.status(500).json({ success: false, message: 'Review saved, but the prescription could not be reopened for follow-up.' });
      }
    }

    if (review_status === 'approved') {
      const { data: existingReport, error: reportLookupError } = await supabase
        .from('reports')
        .select('id')
        .eq('mri_scan_id', scan.id)
        .limit(1)
        .maybeSingle();

      if (reportLookupError) {
        console.error('[MRI Review Report Lookup Error]', reportLookupError);
        return res.status(500).json({ success: false, message: 'MRI approved, but its report could not be checked.' });
      }

      if (!existingReport) {
        const { error: reportError } = await supabase.from('reports').insert({
          user_id: scan.user_id,
          report_id: `MRI-${scan.id}`,
          title: 'Physician-Reviewed MRI Report',
          report_type: 'MRI Insight',
          mri_scan_id: scan.id,
          risk_level: scan.risk_level,
          summary: `${scan.analysis_notes || 'MRI analysis completed.'}${review_notes?.trim() ? ` Physician review: ${review_notes.trim()}` : ''}`,
        });

        if (reportError) {
          console.error('[MRI Review Report Insert Error]', reportError);
          return res.status(500).json({ success: false, message: 'MRI was approved, but the report could not be created.' });
        }
      }
    }

    res.status(200).json({ success: true, data: reviewedScan, message: 'MRI review saved.' });
  } catch (err) {
    console.error('[Doctor Portal - reviewMRIScan]', err);
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
    const { data: allDocs, error: doctorsError } = await supabase.from('doctors').select('id, user_id, full_name');
    if (doctorsError) {
      console.error('[Doctor Portal - doctor lookup]', doctorsError);
      return res.status(500).json({ success: false, message: 'Failed to identify the doctor schedule.' });
    }
    const matchingDocs = (allDocs || []).filter(
      (d) => d.id === doctorUserId ||
        d.user_id === doctorUserId ||
        (d.full_name && req.user.full_name &&
          normalizeDoctorName(d.full_name) === normalizeDoctorName(req.user.full_name))
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
        const mUrl = c.meeting_url?.startsWith('https://meet.google.com/') ? c.meeting_url : null;
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
