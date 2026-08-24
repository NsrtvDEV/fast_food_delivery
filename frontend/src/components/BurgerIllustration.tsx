export function BurgerIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="bunTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFC15E" />
          <stop offset="100%" stopColor="#F5A623" />
        </linearGradient>
        <linearGradient id="bunBottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8901A" />
          <stop offset="100%" stopColor="#C97710" />
        </linearGradient>
        <linearGradient id="patty" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7A4A2B" />
          <stop offset="100%" stopColor="#5C3620" />
        </linearGradient>
        <linearGradient id="cheese" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFD54F" />
          <stop offset="100%" stopColor="#FFC107" />
        </linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#5C3620" floodOpacity="0.25" />
        </filter>
      </defs>

      <g filter="url(#soft)">
        {/* bottom bun */}
        <path d="M55 330 Q55 300 90 300 L310 300 Q345 300 345 330 L345 340 Q345 355 330 355 L70 355 Q55 355 55 340 Z" fill="url(#bunBottom)" />

        {/* lettuce */}
        <path d="M45 300 Q60 275 90 292 Q110 270 140 290 Q165 268 195 288 Q225 266 255 288 Q285 270 310 292 Q340 275 355 300 Q345 312 320 305 Q290 316 260 304 Q230 318 200 304 Q170 318 140 304 Q110 316 80 304 Q55 314 45 300 Z" fill="#8BC34A" />

        {/* patty */}
        <rect x="60" y="262" width="280" height="34" rx="17" fill="url(#patty)" />

        {/* cheese drip */}
        <path d="M50 258 L350 258 L350 268 Q320 286 300 268 Q280 290 258 268 Q236 288 214 268 Q192 290 170 268 Q148 288 126 268 Q104 290 82 268 Q60 286 50 268 Z" fill="url(#cheese)" />

        {/* tomato */}
        <g>
          <ellipse cx="120" cy="248" rx="26" ry="9" fill="#E53935" />
          <ellipse cx="200" cy="250" rx="26" ry="9" fill="#E53935" />
          <ellipse cx="280" cy="248" rx="26" ry="9" fill="#E53935" />
        </g>

        {/* top bun */}
        <path
          d="M60 240 Q60 130 200 120 Q340 130 340 240 Z"
          fill="url(#bunTop)"
        />
        {/* sesame seeds */}
        <g fill="#FFF7E0">
          <ellipse cx="150" cy="170" rx="6" ry="3" transform="rotate(-20 150 170)" />
          <ellipse cx="200" cy="150" rx="6" ry="3" transform="rotate(10 200 150)" />
          <ellipse cx="250" cy="172" rx="6" ry="3" transform="rotate(-10 250 172)" />
          <ellipse cx="180" cy="200" rx="6" ry="3" transform="rotate(15 180 200)" />
          <ellipse cx="230" cy="205" rx="6" ry="3" transform="rotate(-25 230 205)" />
          <ellipse cx="130" cy="210" rx="6" ry="3" transform="rotate(5 130 210)" />
        </g>
      </g>
    </svg>
  )
}
