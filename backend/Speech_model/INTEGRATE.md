# Integrating the Retrained Model

## After running `train_model.ipynb` in Google Colab

Colab will auto-download **3 files** to your browser:

- `scaler.pkl`
- `pca.pkl`
- `dementia_model.pkl`

### Step 1 – Replace the old files

Move all 3 downloaded files into:

```
backend/Speech_model/
```

Overwrite the existing ones.

### Step 2 – Verify inference.py is on the right pipeline

Open `backend/Speech_model/inference.py` and make sure the feature extraction block uses **Wav2Vec2**, not MFCC. The file should already be updated — look for this near the top:

```python
from transformers import Wav2Vec2Processor, Wav2Vec2Model
```

If you see `librosa.feature.mfcc` being used for the main features, the old workaround is still active — ping me and I'll switch it over.

### Step 3 – Restart the backend

```bash
cd backend
node server.js
```

That's it. No other code changes needed — `speechController.js` already calls `inference.py` with the audio file path and reads back the JSON result.

---

## Expected output from inference.py

```json
{
  "prediction": 1,
  "probability": 0.87,
  "stability_pct": 85.0,
  "risk_level": "High"
}
```

`prediction: 0` = Non-Demented, `prediction: 1` = Demented.

---

## Running on another PC

### Requirements

- Python 3.10 – 3.13
- Node.js 18+

### Step 1 – Install Python dependencies

```bash
cd backend/Speech_model
pip install -r requirements.txt
```

> **Note:** `torch` will download ~800 MB the first time. If the machine has no GPU that's fine — inference runs on CPU.

### Step 2 – Copy the model files

Make sure these 3 files are present in `backend/Speech_model/`:

```
scaler.pkl
pca.pkl
dementia_model.pkl
```

Copy them from your original machine or re-download from Colab.

### Step 3 – Install Node dependencies and start

```bash
cd backend
npm install
node server.js
```

### Step 4 – Set environment variables

Create a `.env` file in `backend/` (copy from the original machine). At minimum it needs your Supabase keys — the speech inference itself is fully local.

### Verify it works

```bash
# From backend/Speech_model/
python inference.py path/to/any_audio.wav
```

Should print a JSON result with `prediction`, `probability`, `stability_pct`, and `risk_level`.
