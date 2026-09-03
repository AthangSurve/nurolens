/**
 * CogniFusion — Demographic Norm‐Adjusted Scoring Engine
 *
 * Implements education- and age-based corrections for MMSE and MoCA scores,
 * based on published normative data studies:
 *
 *  MMSE:  Crum et al. (1993), JAMA - norms by age/education
 *  MoCA:  Rossetti et al. (2011), J Int Neuropsychol Soc - education‐adjusted norms
 *
 * Approach:
 *   1. Convert education level → estimated years of education
 *   2. Apply education correction (MoCA standard: +1 point if ≤12 years school)
 *   3. Apply age‐band lookup to find the normative mean and SD
 *   4. Calculate z‐score vs. normative population
 *   5. Map z‐score to percentile and determine adjusted risk level
 */

// ─── Education Level → Estimated Years ───────────────────────────────────────
const EDUCATION_YEARS = {
  'No Formal Education': 0,
  'Primary School':      6,
  'High School':         12,
  'Some College':        14,
  'Bachelors Degree':    16,
  'Masters Degree':      18,
  'Doctoral Degree':     21,
};

/**
 * Convert education label to years of formal education.
 * @param {string} educationLabel
 * @returns {number} years of education
 */
const getEducationYears = (educationLabel) => {
  return EDUCATION_YEARS[educationLabel] ?? 12; // default to high school if unknown
};

// ─── Normative Tables ─────────────────────────────────────────────────────────

/**
 * MMSE normative means and SDs by age band and education level.
 * Source: Crum et al. (1993), JAMA 269(18):2386-2391
 * Format: { ageBand: { educationGroup: { mean, sd } } }
 *
 * Education groups:
 *   'low'    = 0–8 years
 *   'medium' = 9–12 years
 *   'high'   = 13+ years
 */
const MMSE_NORMS = {
  '18-24': { low: { mean: 26.0, sd: 3.2 }, medium: { mean: 27.0, sd: 2.8 }, high: { mean: 28.5, sd: 1.8 } },
  '25-29': { low: { mean: 25.8, sd: 3.4 }, medium: { mean: 27.2, sd: 2.6 }, high: { mean: 29.0, sd: 1.6 } },
  '30-34': { low: { mean: 25.6, sd: 3.5 }, medium: { mean: 27.0, sd: 2.7 }, high: { mean: 28.8, sd: 1.7 } },
  '35-39': { low: { mean: 25.4, sd: 3.6 }, medium: { mean: 26.9, sd: 2.8 }, high: { mean: 28.7, sd: 1.8 } },
  '40-44': { low: { mean: 25.2, sd: 3.7 }, medium: { mean: 26.8, sd: 2.9 }, high: { mean: 28.6, sd: 1.9 } },
  '45-49': { low: { mean: 25.0, sd: 3.8 }, medium: { mean: 26.6, sd: 3.0 }, high: { mean: 28.4, sd: 2.0 } },
  '50-54': { low: { mean: 24.6, sd: 4.0 }, medium: { mean: 26.3, sd: 3.1 }, high: { mean: 28.0, sd: 2.2 } },
  '55-59': { low: { mean: 24.0, sd: 4.2 }, medium: { mean: 25.9, sd: 3.3 }, high: { mean: 27.7, sd: 2.4 } },
  '60-64': { low: { mean: 23.2, sd: 4.5 }, medium: { mean: 25.3, sd: 3.5 }, high: { mean: 27.2, sd: 2.6 } },
  '65-69': { low: { mean: 22.5, sd: 4.8 }, medium: { mean: 24.8, sd: 3.7 }, high: { mean: 26.8, sd: 2.8 } },
  '70-74': { low: { mean: 21.8, sd: 5.0 }, medium: { mean: 24.1, sd: 4.0 }, high: { mean: 26.2, sd: 3.0 } },
  '75-79': { low: { mean: 20.5, sd: 5.5 }, medium: { mean: 23.0, sd: 4.5 }, high: { mean: 25.0, sd: 3.5 } },
  '80+':   { low: { mean: 18.0, sd: 6.0 }, medium: { mean: 21.0, sd: 5.0 }, high: { mean: 23.5, sd: 4.0 } },
};

/**
 * MoCA normative means and SDs by age band and education level.
 * Source: Rossetti et al. (2011) + Nasreddine et al. validated norms
 * MoCA officially adds +1 point for ≤12 years of education (built into standard scoring)
 */
const MOCA_NORMS = {
  '18-24': { low: { mean: 22.0, sd: 3.4 }, medium: { mean: 25.0, sd: 2.8 }, high: { mean: 27.5, sd: 2.0 } },
  '25-29': { low: { mean: 22.5, sd: 3.2 }, medium: { mean: 25.5, sd: 2.6 }, high: { mean: 27.8, sd: 1.9 } },
  '30-34': { low: { mean: 22.3, sd: 3.3 }, medium: { mean: 25.2, sd: 2.7 }, high: { mean: 27.6, sd: 2.0 } },
  '35-39': { low: { mean: 22.0, sd: 3.5 }, medium: { mean: 24.9, sd: 2.8 }, high: { mean: 27.3, sd: 2.1 } },
  '40-44': { low: { mean: 21.7, sd: 3.6 }, medium: { mean: 24.6, sd: 2.9 }, high: { mean: 27.0, sd: 2.2 } },
  '45-49': { low: { mean: 21.3, sd: 3.8 }, medium: { mean: 24.3, sd: 3.0 }, high: { mean: 26.7, sd: 2.3 } },
  '50-54': { low: { mean: 20.8, sd: 4.0 }, medium: { mean: 23.8, sd: 3.2 }, high: { mean: 26.2, sd: 2.5 } },
  '55-59': { low: { mean: 20.0, sd: 4.2 }, medium: { mean: 23.2, sd: 3.4 }, high: { mean: 25.6, sd: 2.7 } },
  '60-64': { low: { mean: 19.0, sd: 4.5 }, medium: { mean: 22.3, sd: 3.7 }, high: { mean: 24.8, sd: 3.0 } },
  '65-69': { low: { mean: 17.8, sd: 4.8 }, medium: { mean: 21.2, sd: 4.0 }, high: { mean: 23.8, sd: 3.2 } },
  '70-74': { low: { mean: 16.5, sd: 5.2 }, medium: { mean: 20.0, sd: 4.3 }, high: { mean: 22.7, sd: 3.5 } },
  '75-79': { low: { mean: 14.5, sd: 5.8 }, medium: { mean: 18.5, sd: 4.8 }, high: { mean: 21.0, sd: 4.0 } },
  '80+':   { low: { mean: 12.0, sd: 6.2 }, medium: { mean: 16.5, sd: 5.5 }, high: { mean: 19.0, sd: 4.5 } },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Get the age band string from a numeric age.
 */
const getAgeBand = (age) => {
  if (age < 25) return '18-24';
  if (age < 30) return '25-29';
  if (age < 35) return '30-34';
  if (age < 40) return '35-39';
  if (age < 45) return '40-44';
  if (age < 50) return '45-49';
  if (age < 55) return '50-54';
  if (age < 60) return '55-59';
  if (age < 65) return '60-64';
  if (age < 70) return '65-69';
  if (age < 75) return '70-74';
  if (age < 80) return '75-79';
  return '80+';
};

/**
 * Map education years to low/medium/high group.
 */
const getEducationGroup = (eduYears) => {
  if (eduYears <= 8) return 'low';
  if (eduYears <= 12) return 'medium';
  return 'high';
};

/**
 * Approximate z‐score → percentile using error function approximation.
 * @param {number} z - z-score
 * @returns {number} percentile (0–100)
 */
const zToPercentile = (z) => {
  // Abramowitz & Stegun approximation of the normal CDF
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))));
  if (z > 0) return Math.round((1 - prob) * 100);
  return Math.round(prob * 100);
};

/**
 * Determine risk level based on adjusted z-score percentile.
 * Below 5th percentile  → High Risk (>1.65 SD below mean)
 * 5th–16th percentile   → Moderate Risk (1–1.65 SD below mean)
 * Above 16th percentile → Low Risk
 */
const riskFromPercentile = (percentile) => {
  if (percentile < 5)  return 'High';
  if (percentile < 16) return 'Moderate';
  return 'Low';
};

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Calculate demographically adjusted score and risk level.
 *
 * @param {object} params
 * @param {number}  params.rawScore           - Raw test score
 * @param {number}  params.maxScore           - Maximum possible score (30)
 * @param {string}  params.testType           - 'MMSE' | 'MoCA'
 * @param {number}  params.age                - Patient age in years
 * @param {string}  params.gender             - 'Male' | 'Female' | 'Other'
 * @param {string}  params.educationLevel     - Education label from EDUCATION_YEARS keys
 * @returns {object} { adjustedScore, educationYears, ageAtTest, normPercentile, adjustedRisk, normMean, normSd, zScore, educationCorrected }
 */
const calculateAdjustedScore = ({ rawScore, maxScore = 30, testType, age, gender, educationLevel }) => {
  const eduYears   = getEducationYears(educationLevel);
  const ageBand    = getAgeBand(age);
  const eduGroup   = getEducationGroup(eduYears);

  const norms      = testType === 'MMSE' ? MMSE_NORMS : MOCA_NORMS;
  const normEntry  = norms[ageBand]?.[eduGroup] ?? norms['60-64']['medium'];

  // MoCA standard: add 1 point for ≤12 years education (Nasreddine correction)
  let correctedScore = rawScore;
  let educationCorrected = false;
  if (testType === 'MoCA' && eduYears <= 12 && rawScore < maxScore) {
    correctedScore = Math.min(rawScore + 1, maxScore);
    educationCorrected = true;
  }

  // Calculate z-score relative to normative population
  const zScore = (correctedScore - normEntry.mean) / normEntry.sd;

  // Map z-score to percentile
  const normPercentile = zToPercentile(zScore);

  // Determine adjusted risk
  const adjustedRisk = riskFromPercentile(normPercentile);

  return {
    adjustedScore:       correctedScore,
    educationYears:      eduYears,
    ageAtTest:           age,
    genderAtTest:        gender,
    normMean:            normEntry.mean,
    normSd:              normEntry.sd,
    zScore:              parseFloat(zScore.toFixed(2)),
    normPercentile,
    adjustedRisk,
    educationCorrected,
    ageBand,
    educationGroup:      eduGroup,
  };
};

/**
 * Generate a human‐readable interpretation of the adjusted result.
 * @param {object} result - Output from calculateAdjustedScore
 * @param {string} testType
 * @returns {string}
 */
const generateInterpretation = (result, testType) => {
  const { normPercentile, adjustedRisk, ageBand, educationGroup, educationCorrected, zScore } = result;

  const direction = zScore >= 0 ? 'above' : 'below';
  const sdAbs     = Math.abs(zScore).toFixed(1);
  const eduLabel  = educationGroup === 'low' ? 'lower education' : educationGroup === 'medium' ? 'moderate education' : 'higher education';

  let interpretation = `Compared to others in the ${ageBand} age group with ${eduLabel}, ` +
    `this score falls at the ${normPercentile}th percentile (${sdAbs} SD ${direction} the normative mean). `;

  if (adjustedRisk === 'Low') {
    interpretation += 'Performance is within or above the expected range for this demographic group.';
  } else if (adjustedRisk === 'Moderate') {
    interpretation += 'Performance is mildly below expected norms — follow-up monitoring is recommended.';
  } else {
    interpretation += 'Performance falls significantly below expected norms for this demographic group. Clinical review is strongly recommended.';
  }

  if (educationCorrected) {
    interpretation += ` (${testType} education correction of +1 point applied per standard protocol.)`;
  }

  return interpretation;
};

module.exports = {
  calculateAdjustedScore,
  generateInterpretation,
  getEducationYears,
  EDUCATION_YEARS,
};
