# ReviewLens — Fake Online Review Analyzer

Open `index.html` in a browser to run the MVP. No build step is required.

## Run the trained model API

From this project folder, start the local prediction service:

```powershell
& "C:\Users\Anjali\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" api_server.py
```

Then refresh `index.html`. Manual review analysis calls `http://127.0.0.1:8765/api/analyze-review`; if the API is offline, the browser uses its local fallback.

## What is included

- Manual review analysis using explainable NLP-style signals: sentiment, exaggerated language, review detail, capitalization, calls to action, and punctuation intensity.
- Trust score from 0–100 with three outcomes: likely genuine, suspicious, or likely fake.
- Product URL analysis dashboard with review-level breakdown. It uses sample reviews in this browser-only prototype.

## Important reliability note

This is a screening tool, not a ground-truth detector. A production version should train and validate a calibrated model on a labeled, domain-specific dataset, show confidence intervals, avoid claiming intent, and keep a human-review path.

The URL flow must be moved to a backend connector/API. Browser JavaScript cannot reliably fetch reviews from arbitrary marketplaces because of CORS, authentication, robots rules, and site-specific markup. The backend should normalize reviews, timestamps, ratings, reviewer metadata (where permitted), and product identifiers before calling the scoring service.

## Recommended production architecture

`Frontend → API → review connector → feature pipeline → ML/NLP model → calibrated score + evidence`

Recommended model stages are a language model/text classifier, duplicate/near-duplicate detection, burst/timing analysis, reviewer/product graph features, and calibration against a held-out test set. Measure precision/recall by marketplace and language, with a false-positive budget.
