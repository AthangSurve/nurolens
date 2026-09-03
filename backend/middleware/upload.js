const multer = require('multer');

// Use memory storage → files go straight to Supabase Storage (no disk writes)
const storage = multer.memoryStorage();

// ─── MRI Upload Config ───────────────────────────────────────────────────────
const mriFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/dicom',
    'image/png',
    'image/jpeg',
    'application/octet-stream', // .nii, .nrrd often come as this
  ];
  // Also check extension
  const allowedExtensions = /\.(dcm|nii|nrrd|png|jpg|jpeg)$/i;
  if (allowedMimes.includes(file.mimetype) || allowedExtensions.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid MRI file type: ${file.mimetype}. Allowed: DICOM, NIfTI, NRRD, PNG.`), false);
  }
};

const MAX_MRI_MB = parseInt(process.env.MAX_MRI_FILE_SIZE || '50') * 1024 * 1024;

exports.mriUpload = multer({
  storage,
  fileFilter: mriFilter,
  limits: { fileSize: MAX_MRI_MB },
}).array('scans', 10); // up to 10 files at once

// ─── Speech Upload Config ─────────────────────────────────────────────────────
const speechFilter = (req, file, cb) => {
  const allowedMimes = ['audio/webm', 'audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'];
  if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid audio file type: ${file.mimetype}. Allowed: WebM, WAV, MP3, OGG.`), false);
  }
};

const MAX_AUDIO_MB = parseInt(process.env.MAX_AUDIO_FILE_SIZE || '20') * 1024 * 1024;

exports.speechUpload = multer({
  storage,
  fileFilter: speechFilter,
  limits: { fileSize: MAX_AUDIO_MB },
}).single('audio');

// ─── Multer Error Handler ─────────────────────────────────────────────────────
exports.handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'File is too large. Please check size limits.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, message: 'Too many files. Maximum 10 MRI scans allowed.' });
    }
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};
