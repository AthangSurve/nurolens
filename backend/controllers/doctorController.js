const supabase = require('../config/supabase');
const { normalizeDoctorName } = require('../utils/doctorIdentity');

const isGoogleMeetUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      url.hostname === 'meet.google.com' &&
      /^\/[a-z]{3}-[a-z]{4}-[a-z]{3}\/?$/i.test(url.pathname);
  } catch {
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/doctors
// @desc    Get all active doctors
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
exports.getDoctors = async (req, res) => {
  try {
    const { specialty } = req.query;

    let query = supabase
      .from('doctors')
      .select('id, full_name, specialty, rating, review_count, location, experience, availability, image_url, bio')
      .eq('is_active', true)
      .order('rating', { ascending: false });

    if (specialty) {
      query = query.ilike('specialty', `%${specialty}%`);
    }

    const { data: doctors, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch doctors.' });
    }

    res.status(200).json({ success: true, count: doctors.length, data: doctors });
  } catch (err) {
    console.error('[Get Doctors Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/doctors/book
// @desc    Book a consultation with a doctor
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
exports.bookConsultation = async (req, res) => {
  try {
    const { doctor_id, scheduled_at, notes } = req.body;

    if (!doctor_id || !scheduled_at) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID and scheduled time are required.',
      });
    }

    // Verify doctor exists
    const { data: doctor, error: docError } = await supabase
      .from('doctors')
      .select('id, full_name, specialty')
      .eq('id', doctor_id)
      .eq('is_active', true)
      .single();

    if (docError || !doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // Check for conflicting appointment
    const { data: conflict } = await supabase
      .from('consultations')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('doctor_id', doctor_id)
      .eq('status', 'upcoming')
      .gte('scheduled_at', new Date(new Date(scheduled_at) - 30 * 60000).toISOString())
      .lte('scheduled_at', new Date(new Date(scheduled_at).getTime() + 30 * 60000).toISOString())
      .limit(1);

    if (conflict && conflict.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You already have a session booked near this time slot. Please choose a different time.',
      });
    }

    const { data: consultation, error } = await supabase
      .from('consultations')
      .insert({
        user_id: req.user.id,
        doctor_id,
        scheduled_at: new Date(scheduled_at).toISOString(),
        notes: notes || null,
        meeting_url: null,
        status: 'upcoming',
      })
      .select()
      .single();

    if (error) {
      console.error('[Book Consultation DB Error]', error);
      return res.status(500).json({ success: false, message: 'Failed to book consultation.' });
    }

    res.status(201).json({
      success: true,
      message: `Consultation with ${doctor.full_name} booked successfully.`,
      data: {
        consultation_id: consultation.id,
        doctor: doctor.full_name,
        specialty: doctor.specialty,
        scheduled_at: consultation.scheduled_at,
        meeting_url: consultation.meeting_url,
      },
    });
  } catch (err) {
    console.error('[Book Consultation Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/doctors/consultations
// @desc    Get all consultations for the logged-in user
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
exports.getConsultations = async (req, res) => {
  try {
    const { data: consultations, error } = await supabase
      .from('consultations')
      .select(`
        id, scheduled_at, duration_mins, status, notes, meeting_url, created_at,
        doctors (id, full_name, specialty, image_url, rating, location, experience)
      `)
      .eq('user_id', req.user.id)
      .order('scheduled_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch consultations.' });
    }

    const sanitized = (consultations || []).map((c) => {
      return { ...c, meeting_url: c.meeting_url && isGoogleMeetUrl(c.meeting_url) ? c.meeting_url : null };
    });

    res.status(200).json({ success: true, data: sanitized });
  } catch (err) {
    console.error('[Get Consultations Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/doctors/consultations/:id/meeting-url
// @desc    Update consultation Google Meet URL (synced between doctor & patient)
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
exports.updateMeetingUrl = async (req, res) => {
  try {
    const { id } = req.params;
    let { meeting_url } = req.body;

    if (!meeting_url || !meeting_url.trim()) {
      return res.status(400).json({ success: false, message: 'Meeting URL is required.' });
    }

    meeting_url = meeting_url.trim();
    if (!isGoogleMeetUrl(meeting_url)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid Google Meet link, such as https://meet.google.com/abc-defg-hij.',
      });
    }

    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .select('id, doctor_id')
      .eq('id', id)
      .single();

    if (consultationError || !consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found.' });
    }

    const { data: doctorProfile, error: doctorError } = await supabase
      .from('doctors')
      .select('id, user_id, full_name')
      .eq('id', consultation.doctor_id)
      .maybeSingle();

    if (doctorError) {
      console.error('[Meeting URL Doctor Lookup Error]', doctorError);
      return res.status(500).json({ success: false, message: 'Failed to verify the assigned doctor.' });
    }

    const sameName = doctorProfile &&
      normalizeDoctorName(doctorProfile.full_name) === normalizeDoctorName(req.user.full_name);
    if (!doctorProfile ||
      (doctorProfile.user_id !== req.user.id && consultation.doctor_id !== req.user.id && !sameName)) {
      return res.status(403).json({ success: false, message: 'Only the assigned doctor can change this meeting link.' });
    }

    const { data: updated, error } = await supabase
      .from('consultations')
      .update({ meeting_url })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Update Meeting URL DB Error]', error);
      return res.status(500).json({ success: false, message: 'Failed to update meeting URL.' });
    }

    res.status(200).json({
      success: true,
      message: 'Google Meet URL updated and synced successfully.',
      data: updated,
    });
  } catch (err) {
    console.error('[Update Meeting URL Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/doctors/consultations/:id/cancel
// @desc    Cancel an upcoming consultation
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
exports.cancelConsultation = async (req, res) => {
  try {
    const { data: consultation, error: fetchErr } = await supabase
      .from('consultations')
      .select('id, status, user_id')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found.' });
    }

    if (consultation.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this consultation.' });
    }

    if (consultation.status !== 'upcoming') {
      return res.status(400).json({ success: false, message: 'Only upcoming consultations can be cancelled.' });
    }

    const { error: updateErr } = await supabase
      .from('consultations')
      .update({ status: 'cancelled' })
      .eq('id', req.params.id);

    if (updateErr) {
      return res.status(500).json({ success: false, message: 'Failed to cancel consultation.' });
    }

    res.status(200).json({ success: true, message: 'Consultation cancelled successfully.' });
  } catch (err) {
    console.error('[Cancel Consultation Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/doctors/consultations/:id/complete
// @desc    Mark a consultation as completed after call
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
exports.completeConsultation = async (req, res) => {
  try {
    const { data: consultation, error: fetchErr } = await supabase
      .from('consultations')
      .select('id, status, user_id')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found.' });
    }

    if (consultation.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this consultation.' });
    }

    const { error: updateErr } = await supabase
      .from('consultations')
      .update({ status: 'completed' })
      .eq('id', req.params.id);

    if (updateErr) {
      return res.status(500).json({ success: false, message: 'Failed to complete consultation.' });
    }

    res.status(200).json({ success: true, message: 'Consultation marked as completed.' });
  } catch (err) {
    console.error('[Complete Consultation Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
