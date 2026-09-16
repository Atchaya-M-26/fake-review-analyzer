"""Dependency-light baseline trainer for ReviewLens.
Uses hashed word/bigram features and NumPy logistic regression."""
from pathlib import Path
from collections import Counter
import hashlib
import json
import re
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
TRAIN = Path(r"C:\Users\Anjali\Downloads\archive (1)\new_data_train.csv")
TEST = Path(r"C:\Users\Anjali\Downloads\archive (1)\new_data_test.csv")
OUT = ROOT / "ml" / "artifacts"
OUT.mkdir(parents=True, exist_ok=True)
DIM = 4096
TOKEN_RE = re.compile(r"[a-z0-9']+")

def load(path):
    frame = pd.read_csv(path, sep="\t")
    frame = frame.loc[:, ~frame.columns.astype(str).str.match(r"^Unnamed|^H\d+$")]
    return frame["reviewContent"].fillna("").astype(str).tolist(), frame["flagged"].astype(int).to_numpy()

def index(token):
    return int.from_bytes(hashlib.md5(token.encode("utf-8")).digest()[:4], "little") % DIM

def featurize(texts):
    matrix = np.zeros((len(texts), DIM), dtype=np.float32)
    for row, text in enumerate(texts):
        tokens = TOKEN_RE.findall(text.lower())
        features = tokens + [f"{a}_{b}" for a, b in zip(tokens, tokens[1:])]
        counts = Counter(index(x) for x in features)
        for col, count in counts.items(): matrix[row, col] = 1.0 + np.log(count)
        norm = np.linalg.norm(matrix[row])
        if norm: matrix[row] /= norm
    return matrix

train_text, y_train = load(TRAIN); test_text, y_test = load(TEST)
X_train, X_test = featurize(train_text), featurize(test_text)
w = np.zeros(DIM, dtype=np.float32); bias = 0.0; lr = 0.25
for _ in range(80):
    order = np.random.default_rng(7).permutation(len(y_train))
    for start in range(0, len(order), 256):
        ids = order[start:start + 256]; xb = X_train[ids]; yb = y_train[ids]
        p = 1 / (1 + np.exp(-np.clip(xb @ w + bias, -30, 30)))
        error = p - yb
        w -= lr * ((xb.T @ error) / len(ids) + 0.0001 * w)
        bias -= lr * float(error.mean())
    lr *= 0.97

prob = 1 / (1 + np.exp(-np.clip(X_test @ w + bias, -30, 30)))
pred = (prob >= 0.5).astype(int)
tp = int(((pred == 1) & (y_test == 1)).sum()); tn = int(((pred == 0) & (y_test == 0)).sum())
fp = int(((pred == 1) & (y_test == 0)).sum()); fn = int(((pred == 0) & (y_test == 1)).sum())
precision = tp / max(1, tp + fp); recall = tp / max(1, tp + fn); f1 = 2 * precision * recall / max(1e-9, precision + recall)
metrics = {"dataset":"new_data_train.csv / new_data_test.csv","task":"binary flagged-risk classification","train_rows":len(y_train),"test_rows":len(y_test),"features":DIM,"accuracy":round(float((pred==y_test).mean()),4),"precision_flagged":round(precision,4),"recall_flagged":round(recall,4),"f1_flagged":round(f1,4),"confusion_matrix_labels_0_1":[[tn,fp],[fn,tp]],"note":"Dependency-light binary baseline trained on Yelp-style data; not validated for Amazon product reviews."}
np.savez_compressed(OUT / "review_risk_model.npz", weights=w, bias=np.array([bias]), dimensions=np.array([DIM]))
(OUT / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
(OUT / "model_card.md").write_text("""# ReviewLens baseline model

This model uses hashed word and bigram features with NumPy logistic regression.
`0` is treated as genuine/non-flagged and `1` as flagged/risk. Identity fields
are excluded. An uncertain probability band may be displayed as suspicious,
but suspicious is not a separately labeled class in the source data.
""", encoding="utf-8")
print(json.dumps(metrics, indent=2))
