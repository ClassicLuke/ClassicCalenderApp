# ToneMatch Prototype

ToneMatch is a privacy-first, cross-platform prototype that estimates skin tone depth + undertone from a single selfie and recommends coordinated clothing colors, makeup families, and trending looks. This MVP is a static web app that runs entirely on-device in the browser and is structured to mirror the React Native module layout for easy porting.

## Core Principles
- **Privacy-first:** image processing happens on-device. No uploads without explicit consent.
- **No identity inference:** no race, age, or attractiveness predictions.
- **Transparency:** show confidence and allow manual adjustments.
- **Lighting robustness:** quality checks and retake guidance.

## MVP Features
- Selfie intake with guidance + quality checks (lighting, blur, face size).
- Skin tone depth (0–100) + undertone (cool/warm/neutral/olive) with confidence.
- Curated palettes (clothing + makeup) from local JSON.
- Trending looks with steps, swatches, and tags.
- Stencil overlay prototype with layer toggles and opacity slider.
- Manual override screen for undertone and depth.

## Project Structure
```
data/               # palettes.json + looks.json
models/             # types/interfaces (JSDoc)
services/           # camera, quality checks, tone analysis, palette + look engines
ui/                 # screen modules
scripts/            # app bootstrap
styles/             # app styles
index.html          # app shell
```

## Getting Started
Run a local static server and open the app:

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## Tests
Run the tone analysis unit tests:

```bash
node --test tests/tone-analyze.test.js
```

## Notes
- Face detection uses the browser `FaceDetector` API when available. If not supported, the app falls back to a centered sampling region and displays a warning.
- All data is local JSON for the MVP; no network calls are required beyond loading assets.

## TODO (v2 Ideas)
- Improved white balance correction and illuminant estimation.
- Model-based face segmentation to avoid hair/eyes/lips.
- Brand-level shade matching with explicit opt-in.
- User accounts with offline storage + sync.
- Save and share looks with consent-based media handling.
- Optional AR mesh integration for more precise stencil alignment.
