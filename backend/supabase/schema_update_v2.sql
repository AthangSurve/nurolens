-- ============================================================
-- CogniFusion Schema Update v2
-- Add: role to users, mri_prescriptions table, doctor_notes
-- Run in Supabase SQL Editor
-- ============================================================

-- Add role to users (patient / doctor)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'patient'
    CHECK (role IN ('patient', 'doctor'));

-- Prescriptions: doctor instructs patient to do MRI
CREATE TABLE IF NOT EXISTS mri_prescriptions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id     UUID REFERENCES reports(id) ON DELETE SET NULL,
  notes         TEXT,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'analyzed')),
  prescribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctor notes on patient reports
CREATE TABLE IF NOT EXISTS doctor_notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id   UUID REFERENCES reports(id) ON DELETE SET NULL,
  note        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE mri_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_notes ENABLE ROW LEVEL SECURITY;

-- Index for faster doctor portal queries
CREATE INDEX IF NOT EXISTS idx_test_results_user ON test_results(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id, created_at DESC);
