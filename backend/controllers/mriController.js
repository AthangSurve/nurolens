const supabase = require('../config/supabase');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');
const { getPythonPath } = require('../utils/pythonPath');

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/mri/upload
// @desc    Upload MRI scan file(s) and trigger analysis (mocked AI)
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
exports.uploadMRI = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No MRI file selected. Please upload at least one scan.',
      });
    }

    const userId = req.user.id;
    const uploadedScans = [];
    const errorsList = [];

    for (const file of req.files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const allowedExtensions = ['.dcm', '.nii', '.nrrd', '.png', '.jpg', '.jpeg'];

      if (!allowedExtensions.includes(ext)) {
        return res.status(400).json({
          success: false,
          message: `File format not supported: ${ext}. Allowed: DICOM, NIfTI, NRRD, PNG.`,
        });
      }

      // --- Save to Local Storage ---
      const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
      const uploadMriDir = path.join(__dirname, '..', 'uploads', 'mri');
      if (!fs.existsSync(uploadMriDir)) {
        fs.mkdirSync(uploadMriDir, { recursive: true });
      }
      const localFilePath = path.join(uploadMriDir, fileName);
      
      try {
        fs.writeFileSync(localFilePath, file.buffer);
      } catch (err) {
        console.error('[MRI Local Storage Error]', err);
        errorsList.push(`Local Storage Error for ${file.originalname}: ${err.message}`);
        continue; // Skip this file but continue with others
      }

      // Generate local URL
      const file_url = `${req.protocol}://${req.get('host')}/uploads/mri/${fileName}`;

      const { data: prescriptions, error: prescriptionError } = await supabase
        .from('mri_prescriptions')
        .select('id, status')
        .eq('patient_id', userId)
        .order('prescribed_at', { ascending: false })
        .limit(10);

      if (prescriptionError) {
        console.error('[MRI Prescription Lookup Error]', prescriptionError);
        errorsList.push(`Could not check MRI prescription for ${file.originalname}.`);
        continue;
      }
      const prescription = (prescriptions || []).find((item) => !item.status || item.status === 'pending');

      // --- Execute AI Inference Model ---
      let risk_level = 'Unknown';
      let hippocampal_vol = null;
      let atrophy_pct = null;
      let ai_insights = 'No prediction available.';

      try {
        const pythonScriptPath = path.join(__dirname, '..', 'ml_model', 'inference_mri.py');
        
        const pythonBin = getPythonPath();
        // Wrap execFile in a Promise
        const aiResult = await new Promise((resolve, reject) => {
          execFile(pythonBin, [pythonScriptPath, '--image', localFilePath], (error, stdout, stderr) => {
            if (error) {
              console.error('[Python Execution Error]', error, stderr);
              resolve({ error: error.message });
            } else {
              try {
                const result = JSON.parse(stdout);
                resolve(result);
              } catch (parseErr) {
                console.error('[Python Output Parse Error]', parseErr, stdout);
                resolve({ error: 'Invalid JSON from Python script' });
              }
            }
          });
        });

        if (!aiResult.error && aiResult.risk_level) {
          risk_level = aiResult.risk_level;
          hippocampal_vol = aiResult.hippocampal_vol || 0;
          atrophy_pct = aiResult.atrophy_pct || 0;
          ai_insights = `Diagnosis: ${aiResult.clinical_diagnosis || 'N/A'} | Confidence: ${(aiResult.confidence * 100).toFixed(1)}% | Estimated Atrophy: ${atrophy_pct}%`;
        } else {
           console.error('[AI Model Failure]', aiResult);
           ai_insights = `Analysis unavailable: ${aiResult.error || 'The model returned no prediction.'}`;
        }
      } catch (err) {
        console.error('[MRI AI Inference Error]', err);
        ai_insights = `Analysis unavailable: ${err.message}`;
      }

      // --- Determine format ---
      const formatMap = {
        '.dcm': 'DICOM',
        '.nii': 'NIfTI',
        '.nrrd': 'NRRD',
        '.png': 'PNG',
        '.jpg': 'JPEG',
        '.jpeg': 'JPEG',
      };

      // --- Save MRI record to DB ---
      const hasModelResult = ['Low', 'Moderate', 'High'].includes(risk_level);
      const finalRiskLevel = hasModelResult ? risk_level : null;
      const { data: scanRecord, error: dbError } = await supabase
        .from('mri_scans')
        .insert({
          user_id: userId,
          file_name: file.originalname,
          file_url,
          file_size_bytes: file.size,
          file_format: formatMap[ext] || 'Unknown',
          status: hasModelResult ? 'verified' : 'failed',
          review_status: 'pending',
          mri_prescription_id: prescription?.id || null,
          hippocampal_vol,
          atrophy_pct,
          risk_level: finalRiskLevel,
          analysis_notes: ai_insights,
          analyzed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (dbError) {
        console.error('[MRI DB Error]', dbError);
        errorsList.push(`DB Error for ${file.originalname}: ${dbError.message}`);
        continue;
      }

      if (prescription) {
        const { error: prescriptionUpdateError } = await supabase
          .from('mri_prescriptions')
          .update({ status: 'analyzed' })
          .eq('id', prescription.id);
        if (prescriptionUpdateError) {
          console.error('[MRI Prescription Update Error]', prescriptionUpdateError);
          errorsList.push(`Scan uploaded, but prescription status could not be updated for ${file.originalname}.`);
        }
      }

      uploadedScans.push({
        file_name: file.originalname,
        file_url,
        analysis_notes: ai_insights,
        file_size_bytes: file.size,
        hippocampal_vol,
        atrophy_pct,
        risk_level: finalRiskLevel,
        status: hasModelResult ? 'verified' : 'failed',
        review_status: 'pending',
        prescription_id: prescription?.id || null,
        scan_id: scanRecord.id,
      });
    }

    if (uploadedScans.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'All file uploads failed. Please try again.',
        errors: errorsList,
      });
    }

    res.status(201).json({
      success: true,
      message: `${uploadedScans.length} scan(s) uploaded and analyzed successfully.`,
      data: uploadedScans,
    });
  } catch (err) {
    console.error('[MRI Upload Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/mri/history
// @desc    Get all MRI scans submitted by the logged-in user
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
exports.getMRIHistory = async (req, res) => {
  try {
    const { data: scans, error } = await supabase
      .from('mri_scans')
      .select('id, file_name, file_url, analysis_notes, file_format, file_size_bytes, status, review_status, review_notes, reviewed_at, mri_prescription_id, hippocampal_vol, atrophy_pct, risk_level, submitted_at, analyzed_at')
      .eq('user_id', req.user.id)
      .order('submitted_at', { ascending: false })
      .limit(20);

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch MRI history.' });
    }

    res.status(200).json({ success: true, data: scans });
  } catch (err) {
    console.error('[MRI History Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
