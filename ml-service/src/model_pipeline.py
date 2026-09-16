from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline


@dataclass
class ModelResult:
    classification: str
    confidence: float
    trust_score: int
    trust_level: str
    model_name: str | None
    model_accuracy: float | None
    model_f1: float | None
    model_available: bool
    class_probabilities: dict[str, float]


class ReviewModelPipeline:
    """Train, persist, and serve review classification models."""

    def __init__(self, service_root: Path | None = None) -> None:
        self.service_root = service_root or Path(__file__).resolve().parents[1]
        self.data_path = self.service_root / "data" / "training_reviews.csv"
        self.artifacts_dir = self.service_root / "artifacts"
        self.model_path = self.artifacts_dir / "review_model.joblib"
        self.metadata_path = self.artifacts_dir / "review_model_metadata.json"
        self.labels = ["genuine", "suspicious", "fake"]
        self.pipeline: Pipeline | None = None
        self.metadata: dict[str, Any] = {}

        self._ensure_artifacts_dir()
        self._load_or_train()

    def _ensure_artifacts_dir(self) -> None:
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)

    def _load_or_train(self) -> None:
        if self.model_path.exists() and self.metadata_path.exists():
            self.pipeline = joblib.load(self.model_path)
            with self.metadata_path.open("r", encoding="utf-8") as metadata_file:
                self.metadata = json.load(metadata_file)
            return

        if self.data_path.exists():
            self.train_from_csv(self.data_path)

    def _build_model_candidates(self) -> dict[str, Pipeline]:
        def build_tfidf() -> TfidfVectorizer:
            return TfidfVectorizer(
                lowercase=True,
                stop_words="english",
                ngram_range=(1, 2),
                max_features=4000,
            )

        return {
            "random_forest": Pipeline(
                [
                    ("tfidf", build_tfidf()),
                    (
                        "classifier",
                        RandomForestClassifier(
                            n_estimators=250,
                            random_state=42,
                            class_weight="balanced_subsample",
                        ),
                    ),
                ]
            ),
            "naive_bayes": Pipeline(
                [
                    ("tfidf", build_tfidf()),
                    ("classifier", MultinomialNB(alpha=0.5)),
                ]
            ),
        }

    def train_from_csv(self, csv_path: Path) -> dict[str, Any]:
        dataset = pd.read_csv(csv_path)
        required_columns = {"text", "label"}

        if not required_columns.issubset(dataset.columns):
            raise ValueError("Training data must contain 'text' and 'label' columns")

        dataset = dataset.dropna(subset=["text", "label"])
        dataset["text"] = dataset["text"].astype(str)
        dataset["label"] = dataset["label"].astype(str).str.lower().str.strip()
        dataset = dataset[dataset["label"].isin(self.labels)]

        if len(dataset) < 6:
            raise ValueError("Training data needs at least 6 labeled examples")

        results: dict[str, dict[str, Any]] = {}
        best_name = None
        best_pipeline = None
        best_score = -1.0

        min_class_size = int(dataset["label"].value_counts().min())
        n_splits = max(2, min(5, min_class_size))
        cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)

        for name, pipeline in self._build_model_candidates().items():
            accuracy_scores = cross_val_score(pipeline, dataset["text"], dataset["label"], cv=cv, scoring="accuracy")
            f1_scores = cross_val_score(
                pipeline,
                dataset["text"],
                dataset["label"],
                cv=cv,
                scoring="f1_weighted",
            )

            accuracy = float(accuracy_scores.mean())
            f1 = float(f1_scores.mean())

            results[name] = {
                "accuracy": round(float(accuracy), 4),
                "f1": round(float(f1), 4),
                "report": {},
            }

            ranking_score = (accuracy * 0.7) + (f1 * 0.3)
            if ranking_score > best_score:
                best_score = ranking_score
                best_name = name
                best_pipeline = pipeline

        if best_pipeline is None or best_name is None:
            raise RuntimeError("Unable to train a review classification model")

        best_pipeline.fit(dataset["text"], dataset["label"])

        self.pipeline = best_pipeline
        self.metadata = {
            "best_model": best_name,
            "results": results,
            "labels": self.labels,
            "trained_samples": int(len(dataset)),
            "training_source": str(csv_path),
        }

        joblib.dump(self.pipeline, self.model_path)
        with self.metadata_path.open("w", encoding="utf-8") as metadata_file:
            json.dump(self.metadata, metadata_file, indent=2)

        return self.metadata

    def is_ready(self) -> bool:
        return self.pipeline is not None

    def get_metadata(self) -> dict[str, Any]:
        return self.metadata

    def predict(self, text: str) -> ModelResult:
        if not self.pipeline:
            return ModelResult(
                classification="suspicious",
                confidence=0.0,
                trust_score=50,
                trust_level="Medium",
                model_name=None,
                model_accuracy=None,
                model_f1=None,
                model_available=False,
                class_probabilities={label: 0.0 for label in self.labels},
            )

        probabilities = self.pipeline.predict_proba([text])[0]
        classes = [str(label) for label in self.pipeline.classes_]
        class_probabilities = {str(cls): float(prob) for cls, prob in zip(classes, probabilities)}

        predicted_index = int(probabilities.argmax())
        classification = str(classes[predicted_index])
        confidence = float(probabilities[predicted_index])
        trust_score = self._map_prediction_to_trust_score(classification, confidence)
        trust_level = self._trust_level_from_score(trust_score)

        model_name = self.metadata.get("best_model")
        model_metrics = self.metadata.get("results", {}).get(model_name or "", {})

        return ModelResult(
            classification=classification,
            confidence=round(confidence, 4),
            trust_score=trust_score,
            trust_level=trust_level,
            model_name=model_name,
            model_accuracy=model_metrics.get("accuracy"),
            model_f1=model_metrics.get("f1"),
            model_available=True,
            class_probabilities=class_probabilities,
        )

    def _map_prediction_to_trust_score(self, label: str, confidence: float) -> int:
        if label == "genuine":
            base_score = 72
            adjusted = base_score + (confidence * 28)
        elif label == "suspicious":
            base_score = 45
            adjusted = base_score + (confidence * 20)
        else:
            base_score = 18
            adjusted = base_score + (confidence * 12)

        return max(0, min(100, int(round(adjusted))))

    def _trust_level_from_score(self, trust_score: int) -> str:
        if trust_score >= 75:
            return "High"
        if trust_score >= 45:
            return "Medium"
        return "Low"