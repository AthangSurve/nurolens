"""
CogniFusion Demographic-Adjusted Cognitive Score Model
=====================================================
Uses the NACC dataset to build two machine learning models:
  1. Dementia Risk Classifier  (XGBoost / Random Forest)
     Input:  age, sex, education, moca_score, cdr_sum
     Output: probability of dementia (0-100%)

  2. Normative Score Adjuster (Regression)
     Input:  age, sex, education
     Output: expected MoCA / MMSE for healthy individuals
             → used to compute z-score and percentile

Also computes:
  - Demographic-adjusted risk tier (Low / Moderate / High)
  - Feature importance for interpretability

Outputs (saved to backend/ml_model/):
  - cognitive_risk_model.pkl   (classifier)
  - moca_norm_model.pkl        (normative regression)
  - mmse_norm_model.pkl        (normative regression)
  - label_encoders.pkl         (preprocessing)
  - model_metadata.json        (feature names, thresholds, accuracy)

Run from the project root:
  python train_model.py
"""

import pandas as pd
import numpy as np
import json
import os
import pickle
import warnings
warnings.filterwarnings('ignore')

from pathlib import Path
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import (
    classification_report, roc_auc_score, accuracy_score,
    mean_absolute_error, r2_score
)
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except ImportError:
    HAS_XGB = False
    print("⚠  XGBoost not installed. Using RandomForest as fallback.")

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR  = Path(__file__).parent
DATA_PATH   = SCRIPT_DIR / "test data.csv"
MODEL_DIR   = SCRIPT_DIR / "backend" / "ml_model"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# ── Load Data ─────────────────────────────────────────────────────────────────
print("\n📂 Loading NACC dataset...")
df = pd.read_csv(DATA_PATH)
print(f"   Raw shape: {df.shape}")
print(f"   Columns:   {list(df.columns)}")

# Column mapping from NACC to readable names
COL_MAP = {
    'NACCAGE':  'age',
    'SEX':      'sex',
    'EDUC':     'education',
    'NACCMMSE': 'mmse',
    'NACCMOCA': 'moca',
    'CDRSUM':   'cdr_sum',
    'CDRGLOB':  'cdr_global',
    'DEMENTED':  'demented',
    'NACCNE4S': 'apoe4',
}
df = df.rename(columns={k: v for k, v in COL_MAP.items() if k in df.columns})

# ── Feature Engineering ───────────────────────────────────────────────────────
print("\n🔧 Feature engineering...")

# Age groups (clinical bands)
df['age_group'] = pd.cut(
    df['age'],
    bins=[0, 60, 65, 70, 75, 80, 85, 200],
    labels=['<60', '60-64', '65-69', '70-74', '75-79', '80-84', '85+']
)

# Education groups (Crum et al. normative bands)
def education_band(e):
    if pd.isna(e): return 'unknown'
    e = float(e)
    if e <= 8:  return 'low'        # ≤8 years
    if e <= 12: return 'medium'     # 9-12 years (high school)
    return 'high'                   # >12 years (some college+)

df['edu_band'] = df['education'].apply(education_band)

# Encode sex (NACC: 1=Male, 2=Female → 0=Male, 1=Female)
df['sex_encoded'] = (df['sex'] == 2).astype(int)

# Numerical features after engineering
FEATURES_CLASSIFIER = ['age', 'sex_encoded', 'education', 'moca', 'cdr_sum']
FEATURES_NORM_MOCA  = ['age', 'sex_encoded', 'education']
FEATURES_NORM_MMSE  = ['age', 'sex_encoded', 'education']

# ── Dataset Statistics ────────────────────────────────────────────────────────
print("\n📊 Dataset statistics:")
print(f"   Demented: {df['demented'].value_counts().to_dict()}")
print(f"   Age range: {df['age'].min():.0f} – {df['age'].max():.0f} years")
print(f"   Education range: {df['education'].min():.0f} – {df['education'].max():.0f} years")
print(f"   MoCA range: {df['moca'].min():.0f} – {df['moca'].max():.0f}")
moca_missing = df['moca'].isna().sum()
mmse_missing = df['mmse'].isna().sum()
print(f"   MoCA missing: {moca_missing} ({100*moca_missing/len(df):.1f}%)")
print(f"   MMSE missing: {mmse_missing} ({100*mmse_missing/len(df):.1f}%)")

# ══════════════════════════════════════════════════════════════════════════════
# MODEL 1: Dementia Risk Classifier
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*65)
print("MODEL 1: Dementia Risk Classifier")
print("="*65)

# Prepare classifier dataset
clf_df = df[FEATURES_CLASSIFIER + ['demented']].copy()
clf_df = clf_df.dropna(subset=['demented'])
print(f"   Classifier dataset: {len(clf_df)} samples")

X_clf = clf_df[FEATURES_CLASSIFIER]
y_clf = clf_df['demented'].astype(int)

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X_clf, y_clf, test_size=0.2, stratify=y_clf, random_state=42
)

# Pipeline with imputation + model
if HAS_XGB:
    base_model = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric='logloss',
        random_state=42,
        n_jobs=-1,
    )
    model_name = 'XGBoost'
else:
    base_model = RandomForestClassifier(
        n_estimators=300,
        max_depth=8,
        min_samples_split=10,
        random_state=42,
        n_jobs=-1,
        class_weight='balanced',
    )
    model_name = 'RandomForest'

clf_pipeline = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('model',   base_model),
])

print(f"\n   Training {model_name}...")
clf_pipeline.fit(X_train, y_train)

# Evaluate
y_pred  = clf_pipeline.predict(X_test)
y_proba = clf_pipeline.predict_proba(X_test)[:, 1]

acc    = accuracy_score(y_test, y_pred)
auc    = roc_auc_score(y_test, y_proba)
cv_auc = cross_val_score(clf_pipeline, X_clf, y_clf, cv=StratifiedKFold(5), scoring='roc_auc', n_jobs=-1).mean()

print(f"\n   Accuracy:       {acc:.4f}")
print(f"   ROC-AUC (test): {auc:.4f}")
print(f"   ROC-AUC (5-CV): {cv_auc:.4f}")
print(f"\n{classification_report(y_test, y_pred, target_names=['Not Demented', 'Demented'])}")

# Feature importance
fi = clf_pipeline.named_steps['model'].feature_importances_
feat_imp = dict(zip(FEATURES_CLASSIFIER, fi.tolist()))
print("   Feature importances:", {k: f"{v:.3f}" for k, v in feat_imp.items()})

# Save classifier
clf_path = MODEL_DIR / "cognitive_risk_model.pkl"
with open(clf_path, 'wb') as f:
    pickle.dump(clf_pipeline, f)
print(f"\n   ✅ Classifier saved → {clf_path}")

# ══════════════════════════════════════════════════════════════════════════════
# MODEL 2a: MoCA Normative Regression (for healthy subjects only)
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*65)
print("MODEL 2a: MoCA Normative Regression (cognitively normal only)")
print("="*65)

# Only use cognitively normal individuals (DEMENTED=0, CDR=0)
normal_mask = (df['demented'] == 0) & (df.get('cdr_sum', pd.Series([0]*len(df))).fillna(0) == 0)
norm_df_moca = df[normal_mask][FEATURES_NORM_MOCA + ['moca']].dropna()
print(f"   Normal subjects with MoCA: {len(norm_df_moca)}")

X_norm_moca = norm_df_moca[FEATURES_NORM_MOCA]
y_norm_moca = norm_df_moca['moca']

X_tr, X_te, y_tr, y_te = train_test_split(X_norm_moca, y_norm_moca, test_size=0.2, random_state=42)

moca_pipeline = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('model',   GradientBoostingRegressor(n_estimators=200, max_depth=4, learning_rate=0.05, random_state=42)),
])
moca_pipeline.fit(X_tr, y_tr)

y_pred_moca = moca_pipeline.predict(X_te)
mae_moca = mean_absolute_error(y_te, y_pred_moca)
r2_moca  = r2_score(y_te, y_pred_moca)
print(f"   MAE: {mae_moca:.3f} points | R²: {r2_moca:.4f}")

# Also compute residual std per demo group (needed for z-score normalization)
all_pred   = moca_pipeline.predict(X_norm_moca)
residuals  = y_norm_moca.values - all_pred
moca_std   = float(np.std(residuals))
print(f"   Residual std (for z-score): {moca_std:.3f}")

moca_path = MODEL_DIR / "moca_norm_model.pkl"
with open(moca_path, 'wb') as f:
    pickle.dump({'pipeline': moca_pipeline, 'residual_std': moca_std}, f)
print(f"   ✅ MoCA norm model saved → {moca_path}")

# ══════════════════════════════════════════════════════════════════════════════
# MODEL 2b: MMSE Normative Regression
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*65)
print("MODEL 2b: MMSE Normative Regression (cognitively normal only)")
print("="*65)

norm_df_mmse = df[normal_mask][FEATURES_NORM_MMSE + ['mmse']].dropna()
print(f"   Normal subjects with MMSE: {len(norm_df_mmse)}")

if len(norm_df_mmse) > 50:
    X_norm_mmse = norm_df_mmse[FEATURES_NORM_MMSE]
    y_norm_mmse = norm_df_mmse['mmse']

    X_tr2, X_te2, y_tr2, y_te2 = train_test_split(X_norm_mmse, y_norm_mmse, test_size=0.2, random_state=42)

    mmse_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('model',   GradientBoostingRegressor(n_estimators=200, max_depth=4, learning_rate=0.05, random_state=42)),
    ])
    mmse_pipeline.fit(X_tr2, y_tr2)
    y_pred_mmse = mmse_pipeline.predict(X_te2)
    mae_mmse = mean_absolute_error(y_te2, y_pred_mmse)
    r2_mmse  = r2_score(y_te2, y_pred_mmse)
    print(f"   MAE: {mae_mmse:.3f} points | R²: {r2_mmse:.4f}")

    all_pred_mmse = mmse_pipeline.predict(X_norm_mmse)
    residuals_mmse = y_norm_mmse.values - all_pred_mmse
    mmse_std = float(np.std(residuals_mmse))

    mmse_path = MODEL_DIR / "mmse_norm_model.pkl"
    with open(mmse_path, 'wb') as f:
        pickle.dump({'pipeline': mmse_pipeline, 'residual_std': mmse_std}, f)
    print(f"   ✅ MMSE norm model saved → {mmse_path}")
else:
    print("   ⚠  Not enough MMSE data for norming model. Skipping.")
    mmse_pipeline = None
    mmse_std = 3.0

# ══════════════════════════════════════════════════════════════════════════════
# Compute Normative Lookup Table (for fallback / quick lookup)
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*65)
print("Building normative lookup table...")
print("="*65)

age_bands  = [(0, 60), (60, 65), (65, 70), (70, 75), (75, 80), (80, 85), (85, 120)]
edu_bands  = [(0, 8), (9, 12), (13, 30)]
sex_vals   = [0, 1]  # 0=Male, 1=Female

lookup = {}
for (age_lo, age_hi) in age_bands:
    age_mid = (age_lo + age_hi) / 2
    for (edu_lo, edu_hi) in edu_bands:
        edu_mid = (edu_lo + edu_hi) / 2
        for sex in sex_vals:
            key = f"{age_lo}-{age_hi}_{edu_lo}-{edu_hi}_{sex}"
            feat = [[age_mid, sex, edu_mid]]
            try:
                moca_exp = float(moca_pipeline.predict(feat)[0])
            except:
                moca_exp = 26.0
            lookup[key] = {'expected_moca': round(moca_exp, 2)}

lookup_path = MODEL_DIR / "normative_lookup.json"
with open(lookup_path, 'w') as f:
    json.dump(lookup, f, indent=2)
print(f"   ✅ Lookup table saved → {lookup_path}")

# ══════════════════════════════════════════════════════════════════════════════
# Save metadata
# ══════════════════════════════════════════════════════════════════════════════
metadata = {
    "model_version":        "1.0.0",
    "trained_on":           str(pd.Timestamp.now()),
    "dataset":              "NACC (National Alzheimer Coordinating Center)",
    "total_samples":        len(df),
    "classifier": {
        "model_type":       model_name,
        "features":         FEATURES_CLASSIFIER,
        "accuracy":         round(float(acc), 4),
        "roc_auc_test":     round(float(auc), 4),
        "roc_auc_cv_mean":  round(float(cv_auc), 4),
        "feature_importance": {k: round(v, 4) for k, v in feat_imp.items()},
    },
    "moca_norm": {
        "model_type":       "GradientBoostingRegressor",
        "features":         FEATURES_NORM_MOCA,
        "normal_subjects":  len(norm_df_moca),
        "mae":              round(float(mae_moca), 3),
        "r2":               round(float(r2_moca), 4),
        "residual_std":     round(moca_std, 3),
        "interpretation":   "Predicts expected MoCA for cognitively normal individual with given age/sex/education",
    },
    "risk_thresholds": {
        "dementia_prob_low":      0.25,
        "dementia_prob_moderate": 0.55,
        "description":            "P < 0.25 = Low, 0.25–0.55 = Moderate, > 0.55 = High",
    },
    "education_band_mapping": {
        "low":    "0–8 years",
        "medium": "9–12 years (high school)",
        "high":   "13+ years (college/university)",
    },
    "sex_encoding": {"0": "Male", "1": "Female"},
}

meta_path = MODEL_DIR / "model_metadata.json"
with open(meta_path, 'w') as f:
    json.dump(metadata, f, indent=2)
print(f"\n   ✅ Metadata saved → {meta_path}")

# ══════════════════════════════════════════════════════════════════════════════
# Quick sanity checks
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*65)
print("🧪 SANITY CHECKS")
print("="*65)

test_cases = [
    {"desc": "75M, 16yr edu, MoCA=26, CDR=0 → Expected: Low risk",    "feats": [75, 0, 16, 26, 0]},
    {"desc": "78F, 12yr edu, MoCA=14, CDR=4 → Expected: High risk",   "feats": [78, 1, 12, 14, 4]},
    {"desc": "65M, 20yr edu, MoCA=28, CDR=0 → Expected: Low risk",    "feats": [65, 0, 20, 28, 0]},
    {"desc": "82F,  8yr edu, MoCA=18, CDR=2 → Expected: High risk",   "feats": [82, 1, 8,  18, 2]},
]

for tc in test_cases:
    prob = clf_pipeline.predict_proba([tc["feats"]])[0][1]
    risk = "Low" if prob < 0.25 else "Moderate" if prob < 0.55 else "High"

    # Normative score
    feat_norm = [[tc["feats"][0], tc["feats"][1], tc["feats"][2]]]
    expected_moca = moca_pipeline.predict(feat_norm)[0]
    actual_moca   = tc["feats"][3]
    z_score = (actual_moca - expected_moca) / moca_std

    print(f"\n   {tc['desc']}")
    print(f"   → Risk: {risk} ({prob:.1%}) | Expected MoCA: {expected_moca:.1f} | Z: {z_score:.2f}")

print("\n\n✅ Training complete!")
print(f"   Models saved to: {MODEL_DIR.resolve()}")
print("""
Next step:
  1. Run the backend inference script: backend/ml_model/inference.js
  2. Call POST /api/ml/predict with {{ age, sex, education, moca_score, cdr_sum }}
""")
