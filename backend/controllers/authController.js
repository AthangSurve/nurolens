const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// ─── Helper: Generate JWT ────────────────────────────────────────────────────
const signToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ─── Helper: Generate Patient ID ─────────────────────────────────────────────
const generatePatientId = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CF-${year}-${rand}`;
};

// ─── Helper: Send token response ─────────────────────────────────────────────
const sendToken = (user, statusCode, res) => {
  const token = signToken(user.id, user.email);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      patient_id: user.patient_id,
      date_of_birth: user.date_of_birth,
      gender: user.gender,
      educational_qualification: user.educational_qualification,
      role: user.role || 'patient',
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.signup = async (req, res) => {
  try {
    const { full_name, email, password, date_of_birth, gender, educational_qualification, role, doctor_secret_code } = req.body;

    // --- Validate doctor registration ---
    const assignedRole = role === 'doctor' ? 'doctor' : 'patient';
    if (assignedRole === 'doctor') {
      const expectedCode = process.env.DOCTOR_SECRET_CODE || 'COGNI-DOCTOR-2026';
      if (doctor_secret_code !== expectedCode) {
        return res.status(403).json({
          success: false,
          message: 'Invalid doctor registration code.',
        });
      }
    }

    // --- Validation ---
    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // --- Check if email already exists ---
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // --- Hash password ---
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // --- Generate unique patient ID ---
    const patient_id = generatePatientId();

    // --- Insert user into Supabase ---
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        full_name: full_name.trim(),
        email: email.toLowerCase().trim(),
        password_hash,
        patient_id,
        date_of_birth: date_of_birth || null,
        gender: gender || null,
        educational_qualification: educational_qualification || null,
        role: assignedRole,
      })
      .select('id, full_name, email, patient_id, date_of_birth, gender, educational_qualification, role')
      .single();

    if (error) {
      console.error('[Signup DB Error]', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create account. Please try again.',
      });
    }

    sendToken(newUser, 201, res);
  } catch (err) {
    console.error('[Signup Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Login user and return JWT
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // --- Fetch user including password_hash ---
    const { data: user, error } = await supabase
      .from('users')
      .select('id, full_name, email, password_hash, patient_id, date_of_birth, gender, educational_qualification, role')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // --- Compare passwords ---
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    sendToken(user, 200, res);
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get current logged-in user info
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (err) {
    console.error('[GetMe Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/auth/update-profile
// @desc    Update user profile (name, dob, gender)
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, date_of_birth, gender, educational_qualification } = req.body;

    const updates = {};
    if (full_name) updates.full_name = full_name.trim();
    if (date_of_birth) updates.date_of_birth = date_of_birth;
    if (gender) updates.gender = gender;
    if (educational_qualification) updates.educational_qualification = educational_qualification;
    updates.updated_at = new Date().toISOString();

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, full_name, email, patient_id, date_of_birth, gender, educational_qualification, role')
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile.',
      });
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('[UpdateProfile Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
