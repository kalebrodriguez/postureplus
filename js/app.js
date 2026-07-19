const CIRC = 2 * Math.PI * 32;

const EXERCISES = {
  "Slouching": {
    name: "Chest Opener",
    desc: "Stand, clasp hands behind back, squeeze shoulder blades and lift chest. Hold 15s. Repeat 3×."
  },
  "Uneven shoulders": {
    name: "Shoulder Rolls",
    desc: "Roll both shoulders backward in slow circles 10×, then shrug to ears, hold 3s, release. Repeat 5×."
  },
  "Head drooping forward": {
    name: "Chin Tuck",
    desc: "Pull chin straight back (double chin). Hold 5s, release. Do 10 reps — great for screen workers."
  },
  "Head tilting": {
    name: "Neck Side Stretch",
    desc: "Tilt right ear toward right shoulder, hold 20s. Switch sides. Keep shoulders relaxed."
  }
};

const PARTS = {
  spine: { issue: "Slouching", ok: "Aligned", bad: "Slouching" },
  shoulders: { issue: "Uneven shoulders", ok: "Level", bad: "Uneven" },
  head: { issue: "Head drooping forward", ok: "Good position", bad: "Drooping forward" },
  neck: { issue: "Head tilting", ok: "Centered", bad: "Tilting" }
};

let sessionStart = Date.now();
let lastAlertAt = 0;
let alertTimeout = null;
let alertCount = 0;
let totalChecks = 0;
let goodChecks = 0;
let cameraStarted = false;

function analyzePosture(lm) {
  const issues = [];
  const nose = lm[0];
  const lEar = lm[7];
  const rEar = lm[8];
  const lS = lm[11];
  const rS = lm[12];
  const lH = lm[23];
  const rH = lm[24];

  const midS = { x: (lS.x + rS.x) / 2, y: (lS.y + rS.y) / 2 };
  const midH = { x: (lH.x + rH.x) / 2, y: (lH.y + rH.y) / 2 };
  const midE = { x: (lEar.x + rEar.x) / 2, y: (lEar.y + rEar.y) / 2 };

  const sw = Math.max(Math.abs(lS.x - rS.x), 0.001);
  const th = Math.max(Math.abs(midS.y - midH.y), 0.001);

  const spineAngle = Math.atan2(midS.x - midH.x, midH.y - midS.y) * 180 / Math.PI;
  if (Math.abs(spineAngle) > 12) issues.push("Slouching");
  if (Math.abs(lS.y - rS.y) / sw > 0.12) issues.push("Uneven shoulders");
  if (Math.abs(lEar.y - rEar.y) / sw > 0.12) issues.push("Head tilting");

  const neckDroop = (midE.y - midS.y) / th;
  if (neckDroop > -0.22) issues.push("Head drooping forward");

  const score = Math.max(0, 100 - issues.length * 22);
  const status = issues.length === 0 ? "Good" : issues.length === 1 ? "Fair" : "Poor";

  return { issues, score, status };
}

function scoreColor(s) {
  return s >= 78 ? "var(--green)" : s >= 50 ? "var(--amber)" : "var(--red)";
}

function updateUI(data, detected) {
  totalChecks++;
  const { score, status, issues } = data;

  const fill = document.getElementById("ring-fill");
  fill.style.strokeDashoffset = detected ? CIRC - (score / 100) * CIRC : CIRC;
  fill.style.stroke = detected ? scoreColor(score) : "var(--border2)";
  document.getElementById("ring-num").textContent = detected ? score : "—";

  const lbl = document.getElementById("score-label");
  const sub = document.getElementById("score-sub");

  if (!detected) {
    lbl.textContent = "Waiting";
    lbl.className = "score-label none";
    sub.textContent = "Position yourself in the camera frame.";
  } else {
    lbl.textContent = status;
    lbl.className = "score-label " + status.toLowerCase();
    sub.textContent =
      issues.length === 0
        ? "Great posture — keep it up!"
        : `${issues.length} issue${issues.length > 1 ? "s" : ""} detected.`;
  }

  const badge = document.getElementById("status-badge");
  const badgeText = document.getElementById("badge-text");

  if (!detected) {
    badge.className = "status-badge";
    badgeText.textContent = "No person";
  } else {
    badge.className = "status-badge " + status.toLowerCase();
    badgeText.textContent = status + " posture";
  }

  document.getElementById("cam-score").textContent = detected ? `Score ${score}/100` : "";

  if (detected && status === "Good") goodChecks++;
  const pct = totalChecks > 0 ? Math.round((goodChecks / totalChecks) * 100) : 0;
  document.getElementById("stat-good").textContent = detected ? pct + "%" : "—";
  document.getElementById("stat-alerts").textContent = alertCount;

  for (const [key, cfg] of Object.entries(PARTS)) {
    const hasIssue = issues.includes(cfg.issue);
    const row = document.getElementById("part-" + key);
    const stat = document.getElementById("status-" + key);
    row.className = "body-row " + (!detected ? "" : hasIssue ? "bad" : "ok");
    stat.textContent = !detected ? "—" : hasIssue ? cfg.bad : cfg.ok;
  }

  const goodState = document.getElementById("good-state");
  const fixSection = document.getElementById("fix-section");
  const fixList = document.getElementById("fix-list");

  if (!detected || issues.length === 0) {
    goodState.style.display = "flex";
    fixSection.classList.remove("visible");
    if (!detected) {
      document.querySelector(".good-title").textContent = "Looking good";
      document.querySelector(".good-sub").textContent = "No corrections needed right now.";
    }
  } else {
    goodState.style.display = "none";
    fixSection.classList.add("visible");
    fixList.innerHTML = issues
      .map((iss) => {
        const ex = EXERCISES[iss];
        if (!ex) return "";
        return `<div class="fix-card"><div class="fix-issue">${iss}</div><div class="fix-name">${ex.name}</div><div class="fix-desc">${ex.desc}</div></div>`;
      })
      .join("");
  }

  if (detected && issues.length > 0 && Date.now() - lastAlertAt > 9000) {
    lastAlertAt = Date.now();
    alertCount++;
    document.getElementById("stat-alerts").textContent = alertCount;
    const toast = document.getElementById("alert-toast");
    toast.textContent = `⚠  ${issues[0]} — try the exercise below`;
    toast.classList.add("show");
    clearTimeout(alertTimeout);
    alertTimeout = setTimeout(() => toast.classList.remove("show"), 5000);
  }
}

setInterval(() => {
  const e = Math.floor((Date.now() - sessionStart) / 1000);
  document.getElementById("stat-time").textContent =
    `${Math.floor(e / 60)}:${String(e % 60).padStart(2, "0")}`;
}, 1000);

function startCamera() {
  if (cameraStarted) return;

  if (!window.isSecureContext) {
    const errMsg = document.getElementById("error-msg");
    errMsg.style.display = "block";
    errMsg.textContent =
      "Camera requires HTTPS. Open this site via GitHub Pages or localhost.";
    return;
  }

  if (typeof Pose === "undefined" || typeof Camera === "undefined") {
    const errMsg = document.getElementById("error-msg");
    errMsg.style.display = "block";
    errMsg.textContent = "Pose library failed to load. Check your network and refresh.";
    return;
  }

  const btn = document.getElementById("start-btn");
  const errMsg = document.getElementById("error-msg");
  btn.textContent = "Starting...";
  btn.disabled = true;
  errMsg.style.display = "none";

  const videoEl = document.getElementById("input-video");
  const canvasEl = document.getElementById("output-canvas");
  const ctx = canvasEl.getContext("2d");

  const pose = new Pose({
    locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`
  });

  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  pose.onResults((results) => {
    canvasEl.width = videoEl.videoWidth || 640;
    canvasEl.height = videoEl.videoHeight || 480;
    ctx.save();
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    ctx.drawImage(results.image, 0, 0, canvasEl.width, canvasEl.height);

    if (results.poseLandmarks) {
      const analysis = analyzePosture(results.poseLandmarks);
      const good = analysis.status === "Good";
      const lineColor = good
        ? "rgba(34,197,94,0.75)"
        : analysis.status === "Fair"
          ? "rgba(245,158,11,0.75)"
          : "rgba(239,68,68,0.75)";
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: lineColor,
        lineWidth: 2.5
      });
      drawLandmarks(ctx, results.poseLandmarks, {
        color: "rgba(255,255,255,0.85)",
        lineWidth: 1,
        radius: 3
      });
      updateUI(analysis, true);
    } else {
      updateUI({ issues: [], score: 0, status: "None" }, false);
    }
    ctx.restore();
  });

  navigator.mediaDevices
    .getUserMedia({ video: { width: 1280, height: 720 } })
    .then((stream) => {
      videoEl.srcObject = stream;
      videoEl.play();
      cameraStarted = true;
      document.getElementById("start-screen").style.display = "none";
      document.getElementById("badge-text").textContent = "Live";
      const camera = new Camera(videoEl, {
        onFrame: async () => {
          await pose.send({ image: videoEl });
        },
        width: 1280,
        height: 720
      });
      camera.start();
    })
    .catch(() => {
      errMsg.style.display = "block";
      errMsg.textContent =
        "Camera access denied. Please allow camera in your browser settings.";
      btn.textContent = "Try Again";
      btn.disabled = false;
    });
}

document.getElementById("start-btn").addEventListener("click", startCamera);
document.getElementById("badge-text").textContent = "Ready";
