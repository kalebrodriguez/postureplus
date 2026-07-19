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
| Hosting | GitHub Pages (`gh-pages` branch) |

## Project structure

```
src/
  pages/          # Landing + coach routes
  components/     # UI (nav, camera, panels, landing visual)
  hooks/          # Camera + session state
  lib/            # Posture math + MediaPipe engine
  styles/         # Global design tokens
  types/          # Shared TypeScript types
```

## Routes

| Path | Page |
| --- | --- |
| `/` | Marketing landing |
| `/coach` | Live posture coach |

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

Pushes to `main` build the app and publish `dist/` to the `gh-pages` branch.

**Pages settings (one-time):**

1. Open https://github.com/kalebrodriguez/postureplus/settings/pages
2. **Build and deployment → Source:** Deploy from a branch
3. **Branch:** `gh-pages` / `/ (root)` → Save

Do **not** point Pages at `main` or a feature branch — those contain Vite source, not a production build (that caused the blank page).
