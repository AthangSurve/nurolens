# CogniFusion Project Report (Non-Technical Deep Dive)

## 1) What This Project Is

CogniFusion is a digital health platform built to screen for possible early cognitive decline (such as memory and thinking changes linked with dementia risk). It combines:

- Standard clinical-style questionnaires (MMSE and MoCA)
- Voice analysis
- MRI image analysis
- Doctor review tools

The system is designed as an early warning and monitoring platform, not a final diagnosis tool.

## 2) Why This Project Exists

Traditional cognitive screening can be:

- Time-consuming
- Dependent on one clinic visit
- Hard to track over time

CogniFusion aims to make screening:

- More accessible from home
- Multi-modal (tests + speech + MRI)
- Easier for doctors to review longitudinally

In simple terms: it helps patients and doctors detect warning signs earlier and monitor trends over time.

## 3) Who Uses It

There are two main user groups.

### A) Patient / User

A patient can:

- Create an account
- Take cognitive tests
- Upload speech samples and MRI files
- See reports and risk summaries
- Book doctor consultations

### B) Doctor

A doctor can:

- View a list of patients
- Review each patient's test history, reports, speech, and MRI data
- Add clinical notes
- Prescribe MRI follow-up

## 4) End-to-End User Journey (From Scratch)

### Step 1: Sign up and profile setup

The user enters personal details such as:

- Name and email
- Date of birth
- Gender
- Education level

Why this matters: age and education strongly influence expected cognitive test performance. The system uses these demographics to make fairer comparisons.

### Step 2: Login and dashboard

After login, the dashboard shows:

- Latest MMSE and MoCA scores
- Recent speech and MRI results
- Overall risk summary
- Recent activity timeline

### Step 3: Cognitive tests

The user can take MMSE and MoCA test flows in the app.

- Answers are scored automatically
- Raw scores are computed
- Demographic adjustment is applied
- Risk level is generated

### Step 4: Speech analysis

The user either:

- Records speech directly, or
- Uploads an audio file

The backend processes speech and returns speech-stability style risk signals.

### Step 5: MRI upload and analysis

The user uploads scan files (DICOM/NIfTI/NRRD/JPEG/PNG).
The backend runs MRI inference and stores:

- Predicted risk level
- Estimated atrophy-like indicators
- Auto-generated report text

### Step 6: Reports page

All generated reports (test, speech, MRI) are shown in one place.
Users can view summaries and download printable report versions.

### Step 7: Doctor consultation

Users can book doctors, and doctors can view patient records in a doctor portal.

## 5) How Risk Is Calculated (Plain Language)

The platform uses multiple layers of scoring.

### A) Raw test thresholds

MMSE and MoCA have raw score ranges. Lower scores generally indicate higher concern.

### B) Demographic adjustment

A raw score is compared against expected scores for similar age and education groups.
This gives:

- Adjusted score context
- Percentile vs peer group
- Adjusted risk label

### C) ML cognitive risk prediction

An additional machine learning model estimates risk probability from:

- Age
- Sex
- Education
- MoCA score
- CDR score

This gives a probability and risk tier:

- Low
- Moderate
- High

### D) Overall risk fusion (in app summary)

The app combines available modalities with weighted contributions:

- Clinical tests: 40%
- Speech: 30%
- MRI: 30%

This produces a single overall risk signal for dashboard/reporting.

## 6) AI and Notebook Context (What Was Trained and How)

## 6.1 Cognitive Risk Model (tabular clinical data)

Training script: root `train_model.py`

Dataset and scale:

- NACC dataset
- 55,268 total samples

Classifier metadata (saved model metadata):

- Model type: RandomForest (fallback when XGBoost is not used)
- Test accuracy: 0.9096
- Test ROC-AUC: 0.9739
- 5-fold CV ROC-AUC mean: 0.9750

Feature importance (highest to lowest):

- CDR sum: dominant influence
- MoCA: second strongest
- Education, age, and sex contribute less

Normative MoCA model:

- Built on cognitively normal subjects (9,403)
- MAE: 2.07 points
- Residual standard deviation: 2.586

Interpretation:

- This is the strongest and most clinically grounded model component in the project.
- It has solid discrimination performance (high AUC) for risk ranking.

## 6.2 Speech Model Notebooks

Main notebooks and exports:

- `backend/Speech_model/speech_model.ipynb`
- `backend/Speech_model/train_model.ipynb`

Pipeline used:

- Wav2Vec2 embeddings (768)
- Pause statistics (3)
- RMS energy (1)
- Total features per sample: 772
- StandardScaler -> PCA (100 components) -> LogisticRegression

Data evidence from notebook:

- Total samples: 353
- Unique speakers: 177
- Train samples: 284
- Test samples: 69
- Split is speaker-based (good practice to avoid same-speaker leakage)

Observed performance in saved notebook output:

- Accuracy: 0.55 on test set (69 samples)
- Class 0 (non-demented): precision 0.68, recall 0.57
- Class 1 (demented): precision 0.41, recall 0.52

Interpretation:

- This is currently a prototype-quality model.
- Accuracy is not strong enough for high-stakes clinical decisions.
- It can still be used as a weak signal in a multi-modal context, but should be retrained and validated on larger data before clinical reliance.

## 6.3 MRI Model Notebook

Notebook context:

- `backend/densenet121-og.ipynb`
- Baseline CNN training with ResNet50 and DenseNet121 on an augmented Alzheimer MRI dataset

Dataset evidence from notebook output:

- MildDemented: 8,960
- ModerateDemented: 6,464
- NonDemented: 9,600
- VeryMildDemented: 8,960
- Total used: 33,984 images
- Split: 70% train, 15% validation, 15% test

Reported results in notebook output:

- ResNet50 test accuracy: 99.39%
- DenseNet121 test accuracy: 99.47%
- Very high per-class AUC values (near 1.0)

Interpretation:

- These metrics are extremely high and promising, but they likely reflect the training dataset characteristics and augmentation setup.
- Such results still require external clinical validation on independent real-world hospital data before being treated as real diagnostic-grade evidence.

## 7) What Data the Platform Stores

The app stores several types of data:

- User profile and demographics
- Test answers and scores
- Speech analysis records
- MRI upload metadata and analysis output
- Reports history
- Doctor notes and prescriptions
- Consultation bookings

Storage and backend stack:

- Supabase (PostgreSQL + auth/data tables)
- Node/Express API server
- Python inference scripts called from backend

## 8) Security and Privacy Snapshot

Positive controls already present:

- JWT-based authentication
- Protected API routes
- Role checks for doctor-only endpoints
- Rate limiting for abuse protection
- Helmet and CORS protection on backend

Important practical note:

- The app currently behaves as a health screening tool, but stronger production hardening (audit logging, secrets handling policies, stricter role controls, more rigorous PHI governance) is still advisable before real clinical deployment at scale.

## 9) Current Strengths

1. End-to-end product is complete: onboarding -> tests -> multimodal analysis -> reports -> doctor workflow.
2. Good UX coverage for patient and doctor journeys.
3. Cognitive tabular model uses a large clinical dataset and shows strong AUC.
4. Architecture supports modular improvement: each modality can be upgraded independently.

## 10) Current Gaps and Risks (Business-Friendly View)

1. Speech model quality is currently limited (around 55% test accuracy in notebook output).
2. MRI notebook performance is very high but needs independent external validation before clinical trust.
3. Some app-level consistency and schema alignment issues exist and should be cleaned before production rollout.
4. This should not be positioned as a diagnostic decision engine yet; it is better positioned as an early risk screening and monitoring assistant.

## 11) Recommended Positioning Right Now

Best current positioning:

- "AI-assisted cognitive screening companion"
- "Decision support for clinicians"
- "Early risk flagging and trend monitoring"

Avoid claiming:

- Definitive diagnosis
- Standalone replacement for neurologist assessment

## 12) Suggested Next Phase Roadmap

### Phase 1: Clinical reliability hardening

- Retrain speech model on larger balanced data
- Add external validation for MRI model
- Add calibration checks and confidence intervals

### Phase 2: Product reliability and governance

- Resolve schema/API consistency issues
- Add stronger audit logs and role governance
- Add model version tracking in every generated report

### Phase 3: Clinical workflow maturity

- Doctor-facing longitudinal trend analytics
- Better explainability text for each risk output
- Structured follow-up protocol recommendations

## 13) Plain-English Conclusion

CogniFusion is already a strong multi-module digital health platform with real functionality across patient and doctor workflows. The cognitive scoring and demographic-adjusted logic are meaningful and grounded. The speech and MRI components show clear promise and good engineering integration, but they should still be treated as evolving AI modules requiring further validation before high-trust clinical decision use.

In summary:

- Product maturity: good
- Workflow completeness: high
- Clinical model maturity: mixed by modality
- Best current use: early screening + monitoring + clinician support
