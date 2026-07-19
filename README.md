# Posture+

Personal posture-improvement system built with **React**, **TypeScript**, **Vite**, and **MediaPipe Pose**.

**Live site:** [https://kalebrodriguez.github.io/postureplus/](https://kalebrodriguez.github.io/postureplus/)

> Posture+ doesn’t just tell you that you’re slouching. It learns your posture, catches gradual fatigue, and coaches you toward lasting improvement.

## Features

- Personal calibration (habitual + best posture baseline)
- Sustained-posture detection with adjustable alert delay
- Specific corrective cues + overlay highlights
- Session summary (score, streaks, top issue, correction time)
- Local progress dashboard (weekly insights, streaks)
- Smart break / fatigue hints by session goal
- Guided exercise mini-sessions
- Privacy & FAQ page
- Private by design — video never leaves the device

## Routes

| Path | Page |
| --- | --- |
| `/` | Landing |
| `/coach` | Calibration + live coach |
| `/progress` | Local progress history |
| `/privacy` | Privacy principles & FAQ |

## Scripts

```bash
npm install
npm run dev
npm run build
npm test
npm run lint
```

## Deploy

Pushes to `main` publish `dist/` to `gh-pages`. Set Pages source to the `gh-pages` branch.
