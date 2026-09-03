# CogniFusion – Full Setup Guide

## Prerequisites (install these first)

| Tool    | Version      | Download            |
| ------- | ------------ | ------------------- |
| Node.js | 18 +         | https://nodejs.org  |
| Python  | 3.10 – 3.13 | https://python.org  |
| Git     | any          | https://git-scm.com |

---

## 1 – Clone the repo

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

---

## 2 – Backend setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
PORT=5000
JWT_SECRET=your_jwt_secret_here
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NODE_ENV=development
```

> Get `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from your Supabase project → Settings → API.

---

## 2.1 – Supabase Database Setup

Open your project in the [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor** and run the following scripts in order:

1. `backend/supabase/schema.sql` — Base tables, relations, and initial data.
2. `backend/supabase/schema_update.sql` — Demographic columns (`educational_qualification`, `occupation`, `handedness`, and test demographic adjustments).
3. `backend/supabase/schema_update_v2.sql` — Role column, doctor notes, and MRI prescriptions.

---

## 3 – Python & Machine Learning Models Setup

Install the required Python packages from the project root (or inside `backend/Speech_model/`):

```bash
pip install -r requirements.txt
```

### Models Overview:

1. **MRI DenseNet-121 Model** (`backend/ml_model/best_baseline_densenet121.pth`)
   - Deep learning PyTorch model for MRI structural atrophy and dementia risk assessment.
2. **Cognitive Risk & Normative Models** (`backend/ml_model/`)
   - `cognitive_risk_model.pkl` (XGBoost classifier)
   - `moca_norm_model.pkl` & `mmse_norm_model.pkl` (Demographic normative regressions)
   - Trained via `python train_model.py` using `test data.csv`.
3. **Speech Biomarker Model** (`backend/Speech_model/`)
   - `dementia_model.pkl`, `pca.pkl`, `scaler.pkl`
   - Uses Wav2Vec2 embeddings and acoustic features (pauses, RMS energy) for vocal biomarkers.

---

## 4 – Frontend setup

```bash
cd frontend
npm install
```

---

## 5 – Run the project

Open **two terminals**:

**Terminal 1 – Backend**

```bash
cd backend
node server.js
```

Runs on `http://localhost:5000`

**Terminal 2 – Frontend**

```bash
cd frontend
npm run dev
```

Runs on `http://localhost:5173`

Open your browser at **http://localhost:5173**.

---

## Folder structure (quick reference)

```
Encode/
├── backend/
│   ├── .env              ← you create this (not in Git)
│   ├── server.js
│   ├── Speech_model/
│   │   ├── inference.py
│   │   ├── requirements.txt
│   │   ├── train_model.ipynb   ← Colab notebook to retrain
│   │   ├── scaler.pkl          ← not in Git, copy manually
│   │   ├── pca.pkl             ← not in Git, copy manually
│   │   └── dementia_model.pkl  ← not in Git, copy manually
│   └── ...
└── frontend/
    └── src/
        └── ...
```

---

## Common issues

| Problem                           | Fix                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| `Cannot find module` on backend | Run`npm install` inside `backend/`                                                        |
| `SUPABASE_URL not set` error    | Check your`backend/.env` file exists                                                        |
| Speech test returns error         | Make sure`scaler.pkl`, `pca.pkl`, `dementia_model.pkl` are in `backend/Speech_model/` |
| Python packages missing           | Run`pip install -r backend/Speech_model/requirements.txt`                                   |
| Port 5000 already in use          | Change`PORT=5001` in `.env`                                                               |
