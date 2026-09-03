-- ============================================================
-- CogniFusion - Schema Update: Patient Demographics
-- Run this in Supabase SQL Editor to add demographic fields
-- ============================================================

-- Add educational_qualification to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS educational_qualification TEXT
    CHECK (educational_qualification IN (
      'No Formal Education',
      'Primary School',
      'High School',
      'Some College',
      'Bachelors Degree',
      'Masters Degree',
      'Doctoral Degree'
    ));

-- Add occupation field (optional, useful for cognitive norm models)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS occupation TEXT;

-- Add handedness (relevant for some neuropsychological norms)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS handedness TEXT
    CHECK (handedness IN ('Right', 'Left', 'Ambidextrous'));

-- Add adjusted_score and demographic_context columns to test_results
ALTER TABLE test_results
  ADD COLUMN IF NOT EXISTS adjusted_score    INTEGER,       -- Demographically adjusted score
  ADD COLUMN IF NOT EXISTS education_years   INTEGER,       -- Years of education at time of test
  ADD COLUMN IF NOT EXISTS age_at_test       INTEGER,       -- Patient age at time of test
  ADD COLUMN IF NOT EXISTS gender_at_test    TEXT,          -- Patient gender at time of test
  ADD COLUMN IF NOT EXISTS norm_percentile   REAL,          -- Percentile vs normative group
  ADD COLUMN IF NOT EXISTS adjusted_risk     TEXT CHECK (adjusted_risk IN ('Low', 'Moderate', 'High'));
