import joblib
import warnings
warnings.filterwarnings('ignore')

s = joblib.load('scaler.pkl')
p = joblib.load('pca.pkl')
m = joblib.load('dementia_model.pkl')

print("scaler expects:", s.n_features_in_)
print("pca in:", p.n_features_in_, " pca out:", p.n_components_, " pca components shape:", p.components_.shape)
print("model expects:", m.n_features_in_)
