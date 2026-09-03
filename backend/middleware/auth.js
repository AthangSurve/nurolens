const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

/**
 * Middleware to protect routes.
 * Expects: Authorization: Bearer <token>
 * Attaches req.user = { id, email, full_name, patient_id }
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: err.name === 'TokenExpiredError'
          ? 'Session expired. Please log in again.'
          : 'Invalid token. Please log in again.',
      });
    }

    // Fetch fresh user data from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, patient_id, date_of_birth, gender, educational_qualification, role')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Middleware Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * Middleware that verifies the user is a registered doctor.
 * Use after protect: router.get('/route', protect, protectDoctor, handler)
 */
const protectDoctor = (req, res, next) => {
  if (req.user?.role !== 'doctor') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Doctor credentials required.',
    });
  }
  next();
};

module.exports = { protect, protectDoctor };
