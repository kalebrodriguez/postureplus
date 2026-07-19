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

**Required once (cannot be automated):** GitHub blocks Actions from creating a
Pages site, so you must flip this switch yourself:

1. Open **Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Merge this repo to `main`, or open **Actions → Deploy to GitHub Pages → Run workflow**

After that, every push to `main` runs lint, tests, build, and deploys `dist/`.

Live URL: `https://kalebrodriguez.github.io/postureplus/`

The app is built with `base: /postureplus/` so assets resolve under that path.
