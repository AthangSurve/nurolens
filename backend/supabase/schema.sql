-- ============================================================
-- CogniFusion - Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor to set up all tables
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================
-- TABLE: users
-- Stores registered patient accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name     TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  date_of_birth DATE,
  gender        TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  patient_id    TEXT UNIQUE,           -- e.g. CF-2026-0001
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: test_results
-- Stores MMSE and MoCA cognitive assessment results
-- ============================================================
CREATE TABLE IF NOT EXISTS test_results (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_type       TEXT NOT NULL CHECK (test_type IN ('MMSE', 'MoCA')),
  score           INTEGER NOT NULL,
  max_score       INTEGER NOT NULL,
  risk_level      TEXT NOT NULL CHECK (risk_level IN ('Low', 'Moderate', 'High')),
  answers         JSONB,               -- full answers object for audit
  section_scores  JSONB,               -- per-section breakdown
  duration_secs   INTEGER,             -- time taken in seconds
  completed_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: speech_analyses
-- Stores speech test submissions and results
-- ============================================================
CREATE TABLE IF NOT EXISTS speech_analyses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  audio_url       TEXT,                -- Supabase Storage path
  duration_secs   REAL,
  stability_pct   REAL,                -- 0-100 score
  jitter_f0       REAL,                -- vocal jitter
  neural_latency  REAL,                -- ms
  risk_level      TEXT CHECK (risk_level IN ('Low', 'Moderate', 'High')),
  analysis_notes  TEXT,
  submitted_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: mri_scans
-- Stores MRI file metadata and analysis results
-- ============================================================
CREATE TABLE IF NOT EXISTS mri_scans (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name         TEXT NOT NULL,
  file_url          TEXT,              -- Supabase Storage path
  file_size_bytes   BIGINT,
  file_format       TEXT,              -- DICOM, NIfTI, PNG, NRRD
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'verified', 'failed')),
  hippocampal_vol   REAL,              -- analysis results (mm³)
  atrophy_pct       REAL,
  risk_level        TEXT CHECK (risk_level IN ('Low', 'Moderate', 'High')),
  analysis_notes    TEXT,
  submitted_at      TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at       TIMESTAMPTZ
);

-- ============================================================
-- TABLE: doctors
-- Specialist profiles for consultation booking
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name    TEXT NOT NULL,
  specialty    TEXT NOT NULL,
  rating       NUMERIC(2,1),
  review_count INTEGER DEFAULT 0,
  location     TEXT,
  experience   TEXT,              -- e.g. "15 years"
  availability TEXT,              -- e.g. "Available Today" or "Tomorrow"
  image_url    TEXT,
  bio          TEXT,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: consultations
-- Stores patient-doctor consultation bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS consultations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id     UUID NOT NULL REFERENCES doctors(id) ON DELETE SET NULL,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  duration_mins INTEGER DEFAULT 30,
  status        TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  notes         TEXT,
  meeting_url   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: reports
-- Generated clinical reports
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id       TEXT UNIQUE,          -- e.g. REP-7721
  title           TEXT NOT NULL,
  report_type     TEXT CHECK (report_type IN ('Clinical Test', 'MRI Insight', 'Speech Analysis', 'Comprehensive')),
  test_result_id  UUID REFERENCES test_results(id) ON DELETE SET NULL,
  mri_scan_id     UUID REFERENCES mri_scans(id) ON DELETE SET NULL,
  speech_id       UUID REFERENCES speech_analyses(id) ON DELETE SET NULL,
  risk_level      TEXT CHECK (risk_level IN ('Low', 'Moderate', 'High')),
  summary         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEED: Insert default doctors
-- ============================================================
INSERT INTO doctors (full_name, specialty, rating, review_count, location, experience, availability, image_url, bio) VALUES
(
  'Dr. Sarah Wilson',
  'Cognitive Neurologist',
  4.9,
  128,
  'London, UK / Remote',
  '15 years',
  'Available Today',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200&h=200',
  'Specialist in early cognitive decline detection with a focus on multimodal AI-assisted diagnostics.'
),
(
  'Dr. Michael Chen',
  'Dementia Specialist',
  4.8,
  94,
  'San Francisco, US / Remote',
  '12 years',
  'Tomorrow',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200',
  'Expert in Alzheimer''s risk profiling and hippocampal volumetric analysis interpretation.'
),
(
  'Dr. Priya Sharma',
  'Neuropsychologist',
  4.7,
  76,
  'Mumbai, India / Remote',
  '10 years',
  'Available Today',
  'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200',
  'Pioneer in MMSE/MoCA digital administration and vocal biomarker research for cognitive screening.'
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Users can only access their own data
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE speech_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mri_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Doctors are public read
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors are publicly readable" ON doctors FOR SELECT USING (true);

-- Note: Backend uses the Service Role Key which bypasses RLS
-- These policies apply when using the Anon Key from the client side directly
