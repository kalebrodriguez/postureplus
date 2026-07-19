import './PostureHeroVisual.css'

/** Full-bleed posture silhouette used as the landing hero visual plane. */
export function PostureHeroVisual() {
  return (
    <div className="hero-visual">
      <div className="hero-visual__glow" />
      <svg
        className="hero-visual__figure"
        viewBox="0 0 480 720"
        role="img"
        aria-label="Upright human silhouette with spine alignment guide"
      >
        <defs>
          <linearGradient id="figureFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a2233" />
            <stop offset="55%" stopColor="#12151f" />
            <stop offset="100%" stopColor="#0a0c12" />
          </linearGradient>
          <linearGradient id="spineGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8eb6ff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#4f8ef7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.55" />
          </linearGradient>
          <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Body mass */}
        <path
          className="hero-visual__body"
          fill="url(#figureFill)"
          d="M240 78c28 0 50 22 50 50v34c0 10-3 20-9 28l18 52c8 24 6 50-4 72l-8 16c28 18 46 49 46 84v168c0 22-18 40-40 40h-26v68c0 18-14 32-32 32h-10c-18 0-32-14-32-32v-68h-26c-22 0-40-18-40-40V414c0-35 18-66 46-84l-8-16c-10-22-12-48-4-72l18-52c-6-8-9-18-9-28v-34c0-28 22-50 50-50z"
        />

        {/* Head */}
        <circle className="hero-visual__head" cx="240" cy="52" r="36" fill="url(#figureFill)" />

        {/* Alignment spine */}
        <path
          className="hero-visual__spine"
          d="M240 88v430"
          stroke="url(#spineGlow)"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#softGlow)"
          fill="none"
        />

        {/* Landmark dots */}
        <g className="hero-visual__landmarks" fill="#dbe7ff">
          <circle cx="240" cy="120" r="3.5" />
          <circle cx="240" cy="190" r="3.5" />
          <circle cx="240" cy="270" r="3.5" />
          <circle cx="240" cy="360" r="3.5" />
          <circle cx="188" cy="210" r="3" opacity="0.7" />
          <circle cx="292" cy="210" r="3" opacity="0.7" />
        </g>
      </svg>
    </div>
  )
}
