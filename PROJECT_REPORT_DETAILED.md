# CogniFusion Detailed Project Report

Date: 2026-04-20

This report is based on static inspection of the source code, database schema files, and notebook artifacts in the workspace. It is intended to document the system as implemented, including the model pipelines and the current integration gaps.

## 1. Executive Summary

CogniFusion is a multi-modal cognitive health screening platform. It combines:

- A React/Vite patient and doctor interface
- An Express backend with Supabase-backed persistence
- Cognitive scoring models for MMSE and MoCA
- Speech biomarker inference using Wav2Vec2-based features
- MRI image classification using pretrained CNNs
- A doctor portal for review, notes, and MRI prescription workflows

The product is clearly positioned as a screening and monitoring system rather than a final diagnostic engine. The strongest, most mature model component is the tabular cognitive risk model trained on NACC data. The MRI model shows very strong notebook metrics but should still be treated as requiring external validation. The speech model pipeline is well-engineered but its notebook-level performance is comparatively weak.

## 2. High-Level Architecture

The workspace is organized as a two-tier application:

- `frontend/` contains the React user interface built with Vite.
- `backend/` contains the Express API, Supabase integration, uploads handling, and Python model inference.

The backend is responsible for authentication, protected resource access, report generation, storage of analysis results, and model invocation. The frontend is responsible for the patient and doctor workflows, data visualization, and collecting inputs for tests and uploads.

### Main runtime entry points

- Backend server: `backend/server.js`
- Frontend app shell: `frontend/src/App.jsx`
- Frontend auth context: `frontend/src/context/AuthContext.jsx`
- Frontend API client: `frontend/src/services/api.js`

## 3. Frontend Application

The frontend is a single-page application with protected routes, a shared auth context, a top navigation bar, and a sidebar for authenticated screens.

### Routing structure

Public routes:

- `/` landing page
- `/login`
- `/signup`

Patient routes:

- `/dashboard`
- `/tests`
- `/tests/mmse`
- `/tests/moca`
- `/tests/clock`
- `/tests/trail`
- `/speech-test`
- `/mri-upload`
- `/reports`
- `/consult-doctor`
- `/profile`

Doctor route:

- `/doctor-portal`

The route guard is implemented in `frontend/src/components/ProtectedRoute.jsx`, which blocks access until auth state is rehydrated and then redirects anonymous users to `/login`.

### Frontend UI flow

The interface is built around a patient journey:

1. Land on the marketing page.
2. Sign up or log in.
3. Complete demographic profile setup.
4. Visit the dashboard and choose assessments.
5. Submit MMSE, MoCA, speech, and MRI data.
6. Review reports and trends.
7. Optionally book a doctor.

Doctor users are routed into the doctor portal, where they can view patient records, add notes, and prescribe MRI follow-ups.

### Key pages

- `frontend/src/pages/LandingPage.jsx` presents the product narrative and directs users into signup.
- `frontend/src/pages/Login.jsx` and `frontend/src/pages/Signup.jsx` handle authentication and demographic profile capture.
- `frontend/src/pages/Dashboard.jsx` aggregates the user’s latest clinical picture and recent activity.
- `frontend/src/pages/ClinicalTests.jsx` is a launcher page for the individual assessments.
- `frontend/src/pages/MMSETest.jsx` and `frontend/src/pages/MoCATest.jsx` implement the question-by-question cognitive tests.
- `frontend/src/pages/SpeechTest.jsx` supports either browser recording or file upload.
- `frontend/src/pages/MRIUpload.jsx` handles MRI file selection and analysis submission.
- `frontend/src/pages/Reports.jsx` assembles score cards, the combined clinical summary, and report history.
- `frontend/src/pages/ConsultDoctor.jsx` lists doctors and books consultations.
- `frontend/src/pages/ProfileEdit.jsx` edits the demographic fields used in risk adjustment.
- `frontend/src/pages/DoctorPortal.jsx` is the doctor-facing review workspace.

### Shared UI components

The shared components include:

- `frontend/src/components/Navbar.jsx`
- `frontend/src/components/Sidebar.jsx`
- `frontend/src/components/QuestionCard.jsx`
- `frontend/src/components/ProtectedRoute.jsx`
- Several reusable visual helpers such as `DashboardCard.jsx`, `DoctorCard.jsx`, `ProgressBar.jsx`, and `ClinicalVisuals.jsx`

## 4. Frontend Data Flow

The frontend uses a shared Axios client in `frontend/src/context/AuthContext.jsx` and `frontend/src/services/api.js`.

### Auth handling

- JWT tokens are stored in local storage under `cf_token`.
- The current user object is stored under `cf_user`.
- Axios automatically attaches the JWT in the `Authorization: Bearer <token>` header.
- Any `401` response clears local storage and redirects the user to `/login`.

### Frontend service map

- Auth: login, signup, `me`, profile update
- Dashboard: combined dashboard summary
- Tests: submit MMSE, submit MoCA, fetch history, fetch latest scores
- Speech: upload audio, fetch speech history
- MRI: upload scans, fetch MRI history
- Reports: summary, report listing, report detail by ID
- Doctors: list doctors, book consultation, list consultations, cancel consultation
- Doctor portal: patient list, patient detail, MRI prescription, doctor notes
- ML: cognitive risk prediction endpoint

## 5. Backend Application

The backend is an Express API with Supabase-backed persistence, rate limiting, static upload serving, and local Python inference calls.

### Core middleware and security

The server in `backend/server.js` configures:

- `helmet` for headers hardening
- `cors` with a whitelist that defaults to `http://localhost:5173`
- `express.json` and `express.urlencoded` with a 10 MB limit
- `morgan` for request logging outside test mode
- A global rate limiter of 200 requests per 15 minutes on `/api`
- A stricter auth limiter of 20 requests per 15 minutes on login and signup
- Static file exposure for `/uploads`

### Route surface

- `/api/auth` -> signup, login, current user, profile update
- `/api/tests` -> MMSE/MoCA submission and history
- `/api/speech` -> audio upload and history
- `/api/mri` -> MRI upload and history
- `/api/reports` -> summaries and report retrieval
- `/api/doctors` -> doctor listing and consultation booking
- `/api/dashboard` -> combined dashboard summary
- `/api/doctor-portal` -> doctor-only patient review and actions
- `/api/ml` -> cognitive risk prediction

### Authentication model

Authentication uses JWTs signed with `JWT_SECRET`. The `protect` middleware in `backend/middleware/auth.js`:

- Requires a Bearer token
- Verifies the JWT
- Reloads the latest user record from Supabase
- Attaches the user to `req.user`

The `protectDoctor` middleware adds role-based enforcement for doctor-only routes.

### Backend file upload model

The upload middleware in `backend/middleware/upload.js` validates:

- MRI files by MIME type and extension
- Audio files by MIME type and extension
- Maximum MRI and audio file sizes from environment variables

Important implementation note: the controllers currently save uploads to local disk under `backend/uploads/`, not to Supabase Storage. This differs from some comments in the middleware file and is worth noting as a deployment/design decision.

## 6. Database and Data Model

The Supabase schema is defined in the SQL files under `backend/supabase/`.

### Main tables

| Table | Purpose | Key fields |
| --- | --- | --- |
| `users` | patient and doctor accounts | `id`, `full_name`, `email`, `password_hash`, `date_of_birth`, `gender`, `patient_id`, `role`, `educational_qualification` |
| `test_results` | MMSE, MoCA, and ML prediction results | `user_id`, `test_type`, `score`, `max_score`, `risk_level`, `answers`, `section_scores`, `adjusted_score`, `education_years`, `age_at_test`, `gender_at_test`, `norm_percentile`, `adjusted_risk` |
| `speech_analyses` | speech biomarker outputs | `audio_url`, `duration_secs`, `stability_pct`, `jitter_f0`, `neural_latency`, `risk_level`, `analysis_notes` |
| `mri_scans` | MRI metadata and inference outputs | `file_name`, `file_url`, `file_size_bytes`, `file_format`, `status`, `hippocampal_vol`, `atrophy_pct`, `risk_level`, `analysis_notes` |
| `doctors` | specialist profiles for consultation booking | `full_name`, `specialty`, `rating`, `location`, `experience`, `availability`, `bio`, `is_active` |
| `consultations` | patient-booked doctor sessions | `user_id`, `doctor_id`, `scheduled_at`, `duration_mins`, `status`, `notes`, `meeting_url` |
| `reports` | generated clinical report records | `report_id`, `title`, `report_type`, `test_result_id`, `mri_scan_id`, `speech_id`, `risk_level`, `summary` |
| `mri_prescriptions` | doctor-ordered MRI follow-ups | `doctor_id`, `patient_id`, `report_id`, `notes`, `status` |
| `doctor_notes` | narrative notes added by doctors | `doctor_id`, `patient_id`, `report_id`, `note` |

### Row-level security

RLS is enabled on the core tables. The backend uses the Supabase service role key, so it bypasses RLS. The `doctors` table is explicitly configured for public read access.

### Schema evolution

The update files add clinical metadata that the application uses for demographic scoring and doctor workflows:

- `educational_qualification`
- `occupation`
- `handedness`
- `role`
- demographic adjustment columns on `test_results`
- `mri_prescriptions`
- `doctor_notes`

## 7. Cognitive Model Pipeline

The main tabular cognitive model is defined in `train_model.py` and summarized in `backend/ml_model/model_metadata.json`.

### Dataset

- Source: NACC (National Alzheimer Coordinating Center)
- Total samples: 55,268

### Model inputs

The classifier uses:

- Age
- Sex
- Education
- MoCA score
- CDR sum

The normative MoCA regression uses:

- Age
- Sex
- Education

### Training approach

The script is designed to:

1. Rename NACC columns to readable names.
2. Create age and education bands.
3. Encode sex as binary.
4. Train a dementia-risk classifier.
5. Train normative regression for MoCA.
6. Build a lookup table for age/education/sex combinations.
7. Save metadata and model artifacts.

The script attempts XGBoost if available and falls back to RandomForest. The saved metadata in the repository shows that the current trained classifier is RandomForest.

### Reported classifier performance

From `backend/ml_model/model_metadata.json`:

- Test accuracy: 0.9096
- Test ROC-AUC: 0.9739
- 5-fold cross-validated ROC-AUC: 0.9750

Feature importance:

- `cdr_sum`: 0.8838
- `moca`: 0.0909
- `education`: 0.0141
- `age`: 0.0082
- `sex_encoded`: 0.0030

Interpretation:

- This is a strong ranking model.
- CDR sum is the dominant signal.
- MoCA adds meaningful separation.
- Demographics contribute to adjustment, but not nearly as much as clinical severity.

### Normative MoCA regression

From `backend/ml_model/model_metadata.json`:

- Normal subjects used: 9,403
- MAE: 2.07 points
- R2: 0.1601
- Residual standard deviation: 2.586

The normative model is used to compute z-scores and percentiles for a patient relative to a demographic peer group.

### Risk thresholds

The model uses the following probability thresholds:

- Low: below 0.25
- Moderate: 0.25 to 0.55
- High: above 0.55

### Normative lookup table

`backend/ml_model/normative_lookup.json` contains expected MoCA values across age bands, education bands, and sex categories. It is used as a fallback and quick lookup structure for interpretation.

### Runtime inference

`backend/ml_model/inference_cognitive.py` expects:

- age
- sex
- education years
- MoCA score
- optional CDR sum

The script returns:

- risk level
- risk probability
- expected MoCA
- adjusted z-score
- percentile
- natural-language interpretation

## 8. Speech Model Pipeline

The speech pipeline is documented by two notebook artifacts:

- `backend/Speech_model/speech_model.ipynb`
- `backend/Speech_model/train_model.ipynb`

The second notebook is the cleaner training notebook used to produce the exported artifacts.

### Dataset evidence from the notebook

From `backend/Speech_model/speech_model.ipynb`:

- Total samples: 353
- Unique speakers: 177
- Train samples: 284
- Test samples: 69

The split is speaker-stratified, which is an important safeguard against speaker leakage.

### Feature pipeline

The training notebook describes the following pipeline:

- Wav2Vec2 embeddings: 768 features
- Pause statistics: 3 features
- RMS energy: 1 feature
- Total: 772 features

These features are then processed by:

- StandardScaler
- PCA with 100 components
- LogisticRegression with balanced class weights

Hyperparameters in the notebook:

- LogisticRegression `max_iter=4000`
- LogisticRegression `class_weight=balanced`
- LogisticRegression `C=0.5`

### Reported speech model performance

The saved notebook output shows:

- Test accuracy: 0.55 on 69 test samples
- Class 0: precision 0.68, recall 0.57, F1 0.62, support 44
- Class 1: precision 0.41, recall 0.52, F1 0.46, support 25
- Weighted average: precision 0.58, recall 0.55, F1 0.56

### Interpretation

The speech pipeline is structurally sound and uses a modern acoustic representation, but the notebook metrics are still weak for high-stakes use. It is best viewed as a prototype signal rather than a clinically reliable standalone classifier.

### Runtime inference

`backend/Speech_model/inference.py` and `backend/controllers/speechController.js` implement the deployed pipeline:

- Convert incoming audio to 16 kHz mono WAV when needed
- Extract Wav2Vec2 + pause + energy features
- Apply scaler and PCA
- Run the classifier
- Return a risk level and stability percentage

The runtime path also uses `ffmpeg-static` to handle conversion and falls back to a baseline result if model inference fails.

## 9. MRI Model Pipeline

The MRI model is documented in `backend/densenet121-og.ipynb` and deployed through `backend/ml_model/inference_mri.py`.

### Dataset evidence from the notebook

Notebook output shows the following class distribution:

- MildDemented: 8,960 images
- ModerateDemented: 6,464 images
- NonDemented: 9,600 images
- VeryMildDemented: 8,960 images

Total: 33,984 images

### Train / validation / test split

The notebook uses a stratified 70 / 15 / 15 split:

- Train: 23,788 images (70.0%)
- Validation: 5,098 images (15.0%)
- Test: 5,098 images (15.0%)

### Preprocessing and training setup

The notebook uses:

- Input size: 224 x 224
- Pretrained ResNet50 and DenseNet121 backbones
- Basic augmentation with random horizontal flip
- ImageNet normalization
- No regularization in the baseline runs

Parameter counts from the notebook:

- ResNet50: 23,516,228 trainable parameters
- DenseNet121: 6,957,956 trainable parameters

### Reported baseline metrics

ResNet50 baseline:

- Best validation accuracy: 99.14% at epoch 15
- Test accuracy: 99.39%
- Balanced accuracy: 0.9944

DenseNet121 baseline:

- Best validation accuracy: 99.61% at epoch 13
- Test accuracy: 99.47%
- Balanced accuracy: 0.9951

Per-class test accuracy and AUC for DenseNet121 were also reported at essentially ceiling levels:

- MildDemented: 99.93% accuracy, AUC 1.0000
- ModerateDemented: 100.00% accuracy, AUC 1.0000
- NonDemented: 99.10% accuracy, AUC 0.9999
- VeryMildDemented: 99.03% accuracy, AUC 0.9999

### Interpretation

The MRI notebook reports extremely strong numbers. That makes the model promising, but also means it should be validated against an independent real-world dataset before being treated as clinically trustworthy.

### Runtime inference

`backend/ml_model/inference_mri.py` loads `best_baseline_densenet121.pth`, preprocesses MRI images, runs inference, and outputs:

- risk level
- clinical diagnosis
- confidence
- estimated atrophy percentage
- estimated hippocampal volume

## 10. End-to-End Data Flow

### Patient flow

1. The patient signs up and enters demographics.
2. The JWT token is stored in the browser.
3. The dashboard requests summary data from `/api/dashboard`.
4. MMSE and MoCA tests submit to `/api/tests/mmse` and `/api/tests/moca`.
5. Speech samples submit to `/api/speech/upload`.
6. MRI files submit to `/api/mri/upload`.
7. The backend creates report records for each modality.
8. The reports page reads the combined summary from `/api/reports/summary`.
9. The patient can book consultations from `/api/doctors`.

### Doctor flow

1. A doctor logs in or signs up with a doctor role.
2. The backend enforces role checks with `protectDoctor`.
3. The doctor portal loads patient data from `/api/doctor-portal/patients`.
4. A doctor can inspect a specific patient record.
5. The doctor can add notes or prescribe MRI follow-ups.

### Aggregation logic

The dashboard and reports pages both fuse the available modalities into an overall risk signal. The weighting used in the backend is:

- Clinical tests: 40%
- Speech: 30%
- MRI: 30%

## 11. Runtime Configuration

The backend expects these environment variables, based on `backend/.env.example` and the README:

- `PORT`
- `NODE_ENV`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLIENT_URL`
- `MAX_MRI_FILE_SIZE`
- `MAX_AUDIO_FILE_SIZE`

Speech model requirements in `backend/Speech_model/requirements.txt`:

- `torch`
- `transformers`
- `librosa`
- `scikit-learn`
- `joblib`
- `numpy`
- `soundfile`

Frontend runtime stack:

- React 19
- Vite 7
- React Router 7
- Axios
- Lucide icons

Backend runtime stack:

- Express
- Supabase client
- bcryptjs
- jsonwebtoken
- multer
- ffmpeg-static
- helmet
- cors
- morgan
- express-rate-limit

## 12. Strengths

- The product has a complete patient-to-doctor workflow.
- Auth and protected routes are implemented consistently.
- Supabase provides a clean persistence layer and report history.
- The tabular cognitive model is well supported by data and metrics.
- The MRI and speech pipelines are integrated into the app rather than being isolated notebooks.

## 13. Risks and Gaps

1. `frontend/src/context/AuthContext.jsx` exports `updateUser`, but `frontend/src/pages/ProfileEdit.jsx` attempts to destructure `setUser`. That means profile changes do not reliably update the in-memory user state.
2. `frontend/src/pages/ClockDrawingTest.jsx` posts a manual score to the MMSE endpoint, but the backend MMSE handler expects full `answers` and `questions`. The page therefore falls back to local-only scoring instead of a persisted backend result.
3. The speech model notebook shows only 0.55 test accuracy, which is weak for a standalone medical signal.
4. The MRI notebook performance is extremely high and should be externally validated before clinical trust is implied.
5. Some comments and user-facing copy suggest Supabase Storage or clinical-grade claims, while the code path actually uses local file storage and notebook-derived prototype models.
6. The Trail Making Test and Clock Drawing Test are currently frontend-only screening experiences and do not flow into the backend reports pipeline.

## 14. Recommendations

1. Fix the auth context mismatch by exposing the same update function the profile editor uses.
2. Either rework the Clock Drawing flow to submit backend-compatible payloads or explicitly keep it as a local-only task.
3. Re-train and re-evaluate the speech model on a larger and more balanced dataset.
4. Validate the MRI model on independent external data before relying on its reported metrics.
5. Align comments, upload handling, and runtime behavior so the codebase reflects the real storage strategy.
6. Track model version, training source, and report provenance in generated clinical records.

## 15. Key Files Reviewed

- `README.md`
- `PROJECT_REPORT_NON_TECHNICAL.md`
- `backend/server.js`
- `backend/controllers/*.js`
- `backend/routes/*.js`
- `backend/middleware/*.js`
- `backend/config/supabase.js`
- `backend/utils/demographicScoring.js`
- `backend/supabase/schema.sql`
- `backend/supabase/schema_update.sql`
- `backend/supabase/schema_update_v2.sql`
- `backend/ml_model/inference_cognitive.py`
- `backend/ml_model/inference_mri.py`
- `backend/ml_model/model_metadata.json`
- `backend/ml_model/normative_lookup.json`
- `backend/densenet121-og.ipynb`
- `backend/Speech_model/train_model.ipynb`
- `backend/Speech_model/speech_model.ipynb`
- `backend/Speech_model/inference.py`
- `backend/Speech_model/inspect_models.py`
- `train_model.py`
- `frontend/src/App.jsx`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/services/api.js`
- `frontend/src/pages/*.jsx`

## 16. Final Assessment

CogniFusion is a credible end-to-end screening platform with real product depth. Its architecture is coherent, its clinical data model is sensible, and the tabular cognitive model is the most evidence-backed component in the repository. The speech and MRI pieces are integrated well enough to support a multimodal experience, but they still need validation hardening and consistency cleanup before the system should be positioned as clinically robust.
