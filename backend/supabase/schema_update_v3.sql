-- ============================================================
-- NeuroLens Schema Update v3
-- MRI prescription-to-scan association, doctor review, and doctor accounts
-- Run in Supabase SQL Editor after schema.sql and schema_update_v2.sql
-- ============================================================

ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL;

WITH normalized_doctors AS (
  SELECT
    id,
    regexp_replace(
      regexp_replace(lower(full_name), '^dr\.?\s*', ''),
      ',?\s*(md|phd|do|m\.d\.?|ph\.d\.?).*$',
      '',
      'i'
    ) AS normalized_name
  FROM doctors
  WHERE user_id IS NULL
),
normalized_users AS (
  SELECT
    id,
    regexp_replace(
      regexp_replace(lower(full_name), '^dr\.?\s*', ''),
      ',?\s*(md|phd|do|m\.d\.?|ph\.d\.?).*$',
      '',
      'i'
    ) AS normalized_name
  FROM users
  WHERE role = 'doctor'
),
matches AS (
  SELECT
    d.id AS doctor_id,
    u.id AS user_id,
    count(*) OVER (PARTITION BY d.id) AS doctor_match_count,
    count(*) OVER (PARTITION BY u.id) AS user_match_count
  FROM normalized_doctors d
  JOIN normalized_users u
    ON regexp_replace(d.normalized_name, '[^a-z]', '', 'g') =
       regexp_replace(u.normalized_name, '[^a-z]', '', 'g')
)
UPDATE doctors d
SET user_id = m.user_id
FROM matches m
WHERE d.id = m.doctor_id
  AND m.doctor_match_count = 1
  AND m.user_match_count = 1;

ALTER TABLE mri_scans
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'approved', 'needs_follow_up')),
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_notes TEXT,
  ADD COLUMN IF NOT EXISTS mri_prescription_id UUID REFERENCES mri_prescriptions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mri_scans_prescription ON mri_scans(mri_prescription_id);
