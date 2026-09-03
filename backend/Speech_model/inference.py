"""
Feature pipeline (matches train_model.ipynb exactly):
  1. Load audio at 16kHz
  2. Wav2Vec2 (facebook/wav2vec2-base-960h) mean-pooled embeddings -> 768 features
  3. Pause statistics (mean, max, count)                           ->   3 features
  4. RMS energy mean                                               ->   1 feature
  Total: 772 features -> scaler -> PCA(100) -> LogisticRegression

NOTE: Run train_model.ipynb first to generate the three pkl files.
      After training, scaler/pca/model all expect 772->100->prediction.
"""

import sys
import os
import json
import warnings
import subprocess
import tempfile

import numpy as np
import librosa
import joblib

warnings.filterwarnings("ignore")


def convert_to_wav(audio_path: str) -> tuple[str, bool]:
    """
    If audio_path is not a PCM wav, use ffmpeg to convert it.
    Returns (path_to_use, was_converted). Caller must delete the temp file if was_converted=True.
    """
    ext = os.path.splitext(audio_path)[1].lower()
    if ext in (".wav",):
        return audio_path, False

    tmp_fd, tmp_path = tempfile.mkstemp(suffix=".wav")
    os.close(tmp_fd)

    # Prefer ffmpeg path injected by Node (ffmpeg-static), fall back to system ffmpeg
    ffmpeg_bin = os.environ.get("FFMPEG_PATH", "ffmpeg")

    try:
        subprocess.run(
            [ffmpeg_bin, "-y", "-i", audio_path,
             "-ar", "16000", "-ac", "1", "-sample_fmt", "s16", tmp_path],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return tmp_path, True
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        os.unlink(tmp_path)
        raise RuntimeError(
            f"ffmpeg conversion failed for {audio_path}. "
            "Please install ffmpeg (https://ffmpeg.org/download.html) and ensure it is on PATH."
        ) from e

# Wav2Vec2 loaded once at module level to avoid reloading per call
_processor    = None
_wav2vec_model = None


def _load_wav2vec():
    global _processor, _wav2vec_model
    if _processor is None:
        import torch
        from transformers import Wav2Vec2Processor, Wav2Vec2Model
        _processor     = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base-960h")
        _wav2vec_model = Wav2Vec2Model.from_pretrained("facebook/wav2vec2-base-960h")
        _wav2vec_model.eval()


def extract_features(audio_path):
    import torch
    _load_wav2vec()

    wav_path, converted = convert_to_wav(audio_path)
    try:
        audio, sr = librosa.load(wav_path, sr=16000)
    finally:
        if converted and os.path.exists(wav_path):
            os.unlink(wav_path)

    # 1. Wav2Vec2 embeddings  (768)
    inputs = _processor(audio, sampling_rate=16000, return_tensors="pt", padding=True)
    with torch.no_grad():
        outputs = _wav2vec_model(**inputs)
    wav2vec_features = outputs.last_hidden_state.mean(dim=1).squeeze().cpu().numpy()  # (768,)

    # 2. Pause features  (3)
    intervals = librosa.effects.split(audio, top_db=25)
    pauses, prev_end = [], 0
    for start, end in intervals:
        pause = start - prev_end
        if pause > 0:
            pauses.append(pause / sr)
        prev_end = end
    pause_features = [0.0, 0.0, 0.0] if not pauses else [
        float(np.mean(pauses)),
        float(np.max(pauses)),
        float(len(pauses))
    ]

    # 3. RMS energy  (1)
    energy = float(np.mean(librosa.feature.rms(y=audio)))

    return np.concatenate([wav2vec_features, pause_features, [energy]])  # (772,)


def predict(audio_path, model_dir):
    scaler_path = os.path.join(model_dir, "scaler.pkl")
    pca_path    = os.path.join(model_dir, "pca.pkl")
    model_path  = os.path.join(model_dir, "dementia_model.pkl")

    for p in [scaler_path, pca_path, model_path]:
        if not os.path.exists(p):
            print(f"Missing model file: {p}", file=sys.stderr)
            return None

    scaler = joblib.load(scaler_path)
    pca    = joblib.load(pca_path)
    model  = joblib.load(model_path)

    features        = extract_features(audio_path)           # (772,)
    features_scaled = scaler.transform(features.reshape(1, -1))  # (1, 772)
    features_pca    = pca.transform(features_scaled)             # (1, 100)

    prediction = model.predict(features_pca)

    if hasattr(model, "predict_proba"):
        proba      = model.predict_proba(features_pca)[0]
        confidence = float(np.max(proba))
    else:
        confidence = 0.5

    label = int(prediction[0])
    return {
        "prediction":    label,
        "probability":   round(confidence, 4),
        "stability_pct": round(confidence * 100, 1),
        "risk_level":    "High" if label == 1 else "Low",
    }


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python inference.py <audio_path> <model_dir>")
        sys.exit(1)

    audio_path = sys.argv[1]
    model_dir  = sys.argv[2]

    result = predict(audio_path, model_dir)

    if result:
        print(json.dumps(result))
    else:
        sys.exit(1)