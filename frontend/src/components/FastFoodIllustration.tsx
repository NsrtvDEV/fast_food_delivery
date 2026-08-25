export function FastFoodIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 440 440"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id="ffGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="ffBunTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFCB6B" />
          <stop offset="55%" stopColor="#F7A83B" />
          <stop offset="100%" stopColor="#E28A1D" />
        </linearGradient>
        <linearGradient id="ffBunBottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0A73C" />
          <stop offset="100%" stopColor="#D07E17" />
        </linearGradient>
        <linearGradient id="ffLettuce" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9AD859" />
          <stop offset="100%" stopColor="#6FAE34" />
        </linearGradient>
        <linearGradient id="ffPatty" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8A5734" />
          <stop offset="100%" stopColor="#623D22" />
        </linearGradient>
        <linearGradient id="ffCup" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFEDD5" />
        </linearGradient>
        <linearGradient id="ffFryBox" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFF3E0" />
        </linearGradient>
        <linearGradient id="ffFry" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD873" />
          <stop offset="100%" stopColor="#F5B93F" />
        </linearGradient>
      </defs>

      <ellipse cx="220" cy="220" rx="210" ry="210" fill="url(#ffGlow)" />
      <ellipse cx="220" cy="378" rx="175" ry="20" fill="#5C3620" opacity="0.12" />

      {/* fries box, back-left */}
      <g transform="translate(52 150) rotate(-8)">
        <path d="M4 40 L64 40 L58 158 Q34 168 10 158 Z" fill="url(#ffFryBox)" stroke="#F2B75B" strokeWidth="3" />
        <path d="M4 40 L64 40 L60 60 L8 60 Z" fill="#F5A623" />
        <rect x="14" y="-6" width="8" height="58" rx="4" fill="url(#ffFry)" transform="rotate(-6 18 23)" />
        <rect x="26" y="-14" width="8" height="64" rx="4" fill="url(#ffFry)" transform="rotate(4 30 18)" />
        <rect x="38" y="-10" width="8" height="60" rx="4" fill="url(#ffFry)" transform="rotate(-3 42 20)" />
        <rect x="48" y="-2" width="8" height="54" rx="4" fill="url(#ffFry)" transform="rotate(9 52 25)" />
      </g>

      {/* drink cup, back-right */}
      <g transform="translate(300 118) rotate(6)">
        <path d="M6 26 L58 26 L50 176 Q32 186 14 176 Z" fill="url(#ffCup)" stroke="#F2B75B" strokeWidth="3" />
        <path d="M11 60 L53 60" stroke="#F5A623" strokeWidth="4" opacity="0.5" />
        <path d="M13 100 L51 100" stroke="#F5A623" strokeWidth="4" opacity="0.5" />
        <ellipse cx="32" cy="26" rx="26" ry="9" fill="#F5A623" />
        <ellipse cx="32" cy="22" rx="22" ry="8" fill="#FFC15E" />
        <rect x="26" y="-26" width="10" height="42" rx="5" fill="#F5A623" transform="rotate(18 31 -5)" />
      </g>

      {/* burger, front-center */}
      <g transform="translate(120 148)">
        <path
          d="M8 160 Q8 138 32 138 L168 138 Q192 138 192 160 L192 168 Q192 180 180 180 L20 180 Q8 180 8 168 Z"
          fill="url(#ffBunBottom)"
        />
        <path
          d="M-10 104
             C -18 112, -16 122, -6 124
             C -12 132, -4 140, 8 136
             L 14 148 L 26 134
             L 168 134 L 180 148
             L 186 136
             C 198 140, 206 132, 200 124
             C 210 122, 212 112, 204 104
             C 200 94, 188 92, 180 98
             L 14 98
             C 6 92, -6 94, -10 104 Z"
          fill="url(#ffLettuce)"
        />
        <rect x="10" y="112" width="180" height="30" rx="15" fill="url(#ffPatty)" />
        <path
          d="M2 92 L198 92 L198 100 Q178 118 160 100 Q142 120 124 100 Q106 120 88 100 Q70 120 52 100 Q34 120 16 100 Q0 116 2 100 Z"
          fill="#FFD54A"
        />
        <path d="M0 76 Q0 -10 100 -20 Q200 -10 200 76 Z" fill="url(#ffBunTop)" />
        <g fill="#FFF6DD">
          <ellipse cx="55" cy="24" rx="7" ry="3.4" transform="rotate(-18 55 24)" />
          <ellipse cx="90" cy="2" rx="7" ry="3.4" transform="rotate(8 90 2)" />
          <ellipse cx="128" cy="8" rx="7" ry="3.4" transform="rotate(-6 128 8)" />
          <ellipse cx="152" cy="32" rx="7" ry="3.4" transform="rotate(20 152 32)" />
          <ellipse cx="108" cy="38" rx="7" ry="3.4" transform="rotate(-12 108 38)" />
        </g>
      </g>
    </svg>
  )
}
