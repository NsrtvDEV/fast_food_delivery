export function ParsleyAccent({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" fill="none" className={className}>
      <path
        d="M30 55C30 55 8 45 8 25C8 18 13 12 20 12C22 6 27 3 33 5C38 1 45 3 46 10C53 11 56 18 52 24C55 32 49 39 41 38C38 46 30 50 30 55Z"
        fill="#8BC34A"
      />
      <path d="M30 55C28 45 26 30 24 18" stroke="#689F38" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function ChiliAccent({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" fill="none" className={className}>
      <path
        d="M12 14C12 14 18 8 24 12"
        stroke="#689F38"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M16 16C10 24 8 40 20 50C30 58 46 52 50 40C54 28 46 16 34 14C27 13 20 10 16 16Z"
        fill="#E53935"
      />
      <path
        d="M18 18C14 26 14 38 22 46"
        stroke="#FF8A80"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  )
}
