# Posture+

Real-time AI posture coach built with **React**, **TypeScript**, **Vite**, and **MediaPipe Pose**.

**Live site:** [https://kalebrodriguez.github.io/postureplus/](https://kalebrodriguez.github.io/postureplus/)

## Features

- Webcam pose tracking with live skeleton overlay
- Posture score across spine, shoulders, head, and neck
- Alerts when form slips, plus recommended stretches
- Runs fully in the browser — video never leaves your device

## Stack

| Layer | Tech |
| --- | --- |
| UI | React 19 + TypeScript |
| Bundler | Vite 8 |
| Pose ML | `@mediapipe/tasks-vision` |
| Hosting | GitHub Pages (Actions) |

## Project structure

```
src/
  components/     # Header, camera panel, side panel, toast
  hooks/          # Camera + session state
  lib/            # Posture math + MediaPipe engine
  styles/         # Global design tokens
  types/          # Shared TypeScript types
```

## Scripts

```bash
npm install
npm run dev       # local dev server (http://localhost:5173)
npm run build     # production build → dist/
npm run preview   # preview production build
npm test          # unit tests
npm run lint      # oxlint
```

Camera access needs a secure context (`localhost` or HTTPS).

## Deploy on GitHub Pages

Pushes to `main` run lint, tests, and build, then deploy `dist/`.

First-time setup:

1. **Settings → Pages**
2. Set **Source** to **GitHub Actions**
3. Merge to `main` (or run the workflow manually)

The app is built with `base: /postureplus/` so assets resolve correctly under the repo Pages URL.
