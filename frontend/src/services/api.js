import { api } from '../context/AuthContext';

// ─── Auth ────────────────────────────────────────────────────
export const authService = {
  login:         (credentials)  => api.post('/auth/login', credentials),
  signup:        (userData)     => api.post('/auth/signup', userData),
  getMe:         ()             => api.get('/auth/me'),
  updateProfile: (data)         => api.patch('/auth/update-profile', data),
};

// ─── Dashboard ───────────────────────────────────────────────
export const dashboardService = {
  getData: () => api.get('/dashboard'),
};

// ─── Tests ───────────────────────────────────────────────────
export const testService = {
  submitMMSE:      (payload) => api.post('/tests/mmse', payload),
  submitMoCA:      (payload) => api.post('/tests/moca', payload),
  submitClock:     (payload) => api.post('/tests/clock', payload),
  submitTrail:     (payload) => api.post('/tests/trail', payload),
  getHistory:      (params)  => api.get('/tests/history', { params }),
  getLatestScores: ()        => api.get('/tests/latest-scores'),
};

// ─── Speech ──────────────────────────────────────────────────
export const speechService = {
  upload: (formData) =>
    api.post('/speech/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getHistory: () => api.get('/speech/history'),
};

// ─── MRI ─────────────────────────────────────────────────────
export const mriService = {
  upload: (formData) =>
    api.post('/mri/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getHistory: () => api.get('/mri/history'),
};

// ─── Reports ─────────────────────────────────────────────────
export const reportService = {
  getSummary:   ()         => api.get('/reports/summary'),
  getAll:       (params)   => api.get('/reports', { params }),
  getById:      (id)       => api.get(`/reports/${id}`),
};

// ─── Doctors ─────────────────────────────────────────────────
export const doctorService = {
  getAll:               (params) => api.get('/doctors', { params }),
  book:                 (data)   => api.post('/doctors/book', data),
  getConsultations:     ()       => api.get('/doctors/consultations'),
  cancelConsultation:   (id)     => api.patch(`/doctors/consultations/${id}/cancel`),
  completeConsultation: (id)     => api.patch(`/doctors/consultations/${id}/complete`),
  updateMeetingUrl:     (id, meeting_url) => api.patch(`/doctors/consultations/${id}/meeting-url`, { meeting_url }),
};

// ─── Doctor Portal ───────────────────────────────────────────
export const doctorPortalService = {
  getMe:            ()               => api.get('/doctor-portal/me'),
  getPatients:      ()               => api.get('/doctor-portal/patients'),
  getPatient:       (id)             => api.get(`/doctor-portal/patients/${id}`),
  getConsultations: ()               => api.get('/doctor-portal/consultations'),
  prescribeMRI:     (data)           => api.post('/doctor-portal/prescriptions', data),
  reviewMRI:        (id, data)       => api.patch(`/doctor-portal/mri/${id}/review`, data),
  addNote:          (data)           => api.post('/doctor-portal/notes', data),
  updateMeetingUrl: (id, meeting_url) => api.patch(`/doctors/consultations/${id}/meeting-url`, { meeting_url }),
};

// ─── ML / Cognitive Risk Prediction ──────────────────────────
export const mlService = {
  // POST /api/ml/predict — returns demographically adjusted risk
  predict: (payload) => api.post('/ml/predict', payload),
  // { moca_score, cdr_sum? }
};

export default api;
