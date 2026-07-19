# Posture+

Real-time AI posture coach that uses your webcam and [MediaPipe Pose](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker) to score posture, flag issues, and suggest simple exercises.

**Live site:** [https://kalebrodriguez.github.io/postureplus/](https://kalebrodriguez.github.io/postureplus/)

## Features

- Webcam pose tracking with skeleton overlay
- Live posture score (spine, shoulders, head, neck)
- Alerts when form slips
- Recommended stretches for each detected issue

## Project structure

```
├── index.html          # App entry (served by GitHub Pages)
├── css/styles.css      # UI styles
├── js/app.js           # Posture analysis + camera logic
└── .github/workflows/  # Pages deploy workflow
```

## Run locally

Camera access needs a secure context (HTTPS or `localhost`).

```bash
# Python
python3 -m http.server 8080

# Node
npx --yes serve .
```

Then open [http://localhost:8080](http://localhost:8080), click **Enable Camera**, and allow webcam access.

## Deploy on GitHub Pages

This repo deploys automatically via GitHub Actions on every push to `main`.

To enable Pages the first time:

1. Open **Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Merge this project to `main` (or re-run the workflow)

The site will be available at `https://<username>.github.io/postureplus/`.

## Privacy

All pose analysis runs in your browser. Video never leaves your device.
