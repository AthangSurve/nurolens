"""
CogniFusion ML Inference Module
================================
Called by Node.js backend via child_process.execFile.

Usage:
  python inference_cognitive.py --age 75 --sex 1 --educ 16 --moca 22 --cdr 0.5

Returns JSON:
  {
    "risk_level":        "Moderate",
    "risk_probability":  0.41,
    "expected_moca":     25.3,
    "adjusted_zscore":   -1.23,
    "norm_percentile":   11.0,
    "interpretation":    "...",
    "features_used":     {...},
    "model_version":     "1.0.0"
  }
"""

import sys
import json
import pickle
import argparse
import warnings
warnings.filterwarnings('ignore')

from pathlib import Path
import numpy as np

MODEL_DIR = Path(__file__).parent

def load_model(name):
    path = MODEL_DIR / name
    if not path.exists():
        return None
    with open(path, 'rb') as f:
        return pickle.load(f)

def zscore_to_percentile(z):
    """Convert z-score to approximate percentile using normal distribution CDF"""
    from math import erf, sqrt
    return round(50.0 * (1 + erf(z / sqrt(2))), 1)

def run_inference(age, sex, education, moca_score, cdr_sum=0.0):
    # Load models
    clf_model  = load_model("cognitive_risk_model.pkl")
    moca_norm  = load_model("moca_norm_model.pkl")

    if clf_model is None or moca_norm is None:
        return {
            "error": "Models not trained yet. Run train_model.py first.",
            "risk_level": "Unknown",
        }

    # Encode sex: NACC 1=Male,2=Female → 0=Male,1=Female
    sex_encoded = 1 if sex == 2 else 0

    # ── Risk classification ───────────────────────────────────────────────────
    clf_features = [[age, sex_encoded, education, moca_score, cdr_sum]]
    try:
        risk_prob  = float(clf_model.predict_proba(clf_features)[0][1])
    except Exception as e:
        risk_prob = 0.3

    risk_level = (
        "Low"      if risk_prob < 0.25 else
        "Moderate" if risk_prob < 0.55 else
        "High"
    )

    # ── Normative MoCA computation ─────────────────────────────────────────────
    norm_features = [[age, sex_encoded, education]]
    norm_obj   = moca_norm  # dict with 'pipeline' and 'residual_std'
    norm_pipeline  = norm_obj['pipeline'] if isinstance(norm_obj, dict) else norm_obj
    residual_std   = norm_obj['residual_std'] if isinstance(norm_obj, dict) else 3.5

    try:
        expected_moca = float(norm_pipeline.predict(norm_features)[0])
    except:
        expected_moca = 25.0

    z_score    = (moca_score - expected_moca) / max(residual_std, 0.5)
    percentile = zscore_to_percentile(z_score)

    # ── Interpretation ────────────────────────────────────────────────────────
    sex_label   = "female" if sex == 2 else "male"
    edu_label   = f"{education:.0f} years of education"
    age_label   = f"{age:.0f}-year-old"

    if z_score >= 0:
        norm_text = f"Your MoCA score of {moca_score} is above the average ({expected_moca:.1f}) expected for a {age_label} {sex_label} with {edu_label}, placing you in the {percentile:.0f}th percentile. This is a positive sign."
    elif z_score >= -1.0:
        norm_text = f"Your MoCA score of {moca_score} is slightly below the expected average of {expected_moca:.1f} for your demographic group ({age_label} {sex_label}, {edu_label}). Monitoring is advised."
    elif z_score >= -1.5:
        norm_text = f"Your MoCA score of {moca_score} is moderately below the demographic expected value of {expected_moca:.1f}. Your score falls at the {percentile:.0f}th percentile for your age/sex/education group. Further evaluation is recommended."
    else:
        norm_text = f"Your MoCA score of {moca_score} is significantly below the expected {expected_moca:.1f} for your demographic group (z={z_score:.2f}, {percentile:.0f}th percentile). Clinical evaluation is strongly recommended."

    risk_text = {
        "Low":      "Low probability of cognitive impairment based on your demographics and test scores.",
        "Moderate": "Moderate probability noted. Age, education, and score pattern suggest closer monitoring is warranted.",
        "High":     "High probability of significant cognitive impairment. Immediate professional evaluation is strongly advised."
    }[risk_level]

    return {
        "risk_level":        risk_level,
        "risk_probability":  round(risk_prob, 4),
        "expected_moca":     round(expected_moca, 2),
        "actual_moca":       moca_score,
        "adjusted_zscore":   round(z_score, 3),
        "norm_percentile":   percentile,
        "interpretation":    norm_text + " " + risk_text,
        "features_used": {
            "age":        age,
            "sex":        sex_label,
            "education":  education,
            "moca_score": moca_score,
            "cdr_sum":    cdr_sum,
        },
        "model_version": "1.0.0"
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CogniFusion cognitive risk inference")
    parser.add_argument("--age",   type=float, required=True,  help="Patient age in years")
    parser.add_argument("--sex",   type=int,   required=True,  help="Sex: 1=Male, 2=Female")
    parser.add_argument("--educ",  type=float, required=True,  help="Years of education")
    parser.add_argument("--moca",  type=float, required=True,  help="MoCA score (0-30)")
    parser.add_argument("--cdr",   type=float, default=0.0,    help="CDR Sum of Boxes (default 0)")
    args = parser.parse_args()

    result = run_inference(
        age=args.age,
        sex=args.sex,
        education=args.educ,
        moca_score=args.moca,
        cdr_sum=args.cdr,
    )
    print(json.dumps(result))
