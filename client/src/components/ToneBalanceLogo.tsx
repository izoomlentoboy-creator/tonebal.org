// ToneBalance Logo - Фиолетовая гортань со звуковыми волнами
export function ToneBalanceLogo({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Звуковые волны слева */}
      <path
        d="M18 35 Q10 50 18 65"
        stroke="url(#logoGrad)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M25 28 Q14 50 25 72"
        stroke="url(#logoGrad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />

      {/* Гортань - верхняя часть (надгортанник) */}
      <path
        d="M40 22 Q50 18 60 22 Q58 26 50 28 Q42 26 40 22"
        fill="url(#logoGrad)"
        filter="url(#glow)"
      />

      {/* Гортань - щитовидный хрящ */}
      <path
        d="M38 30 Q50 26 62 30 L65 42 Q50 48 35 42 Z"
        fill="url(#logoGrad)"
        filter="url(#glow)"
      />

      {/* Гортань - средняя часть */}
      <path
        d="M36 44 Q50 50 64 44 L66 58 Q50 66 34 58 Z"
        fill="url(#logoGrad)"
        filter="url(#glow)"
      />

      {/* Гортань - голосовые связки (V-форма) */}
      <path
        d="M42 56 L50 68 L58 56"
        stroke="url(#logoGrad)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#glow)"
      />

      {/* Гортань - нижняя часть (трахея) */}
      <ellipse cx="50" cy="76" rx="8" ry="3" fill="url(#logoGrad)" opacity="0.9" />
      <ellipse cx="50" cy="82" rx="6" ry="2.5" fill="url(#logoGrad)" opacity="0.8" />
      <ellipse cx="50" cy="87" rx="5" ry="2" fill="url(#logoGrad)" opacity="0.7" />

      {/* Звуковая волна справа (эквалайзер) */}
      <rect x="75" y="42" width="3" height="16" rx="1.5" fill="url(#logoGrad)" opacity="0.9" />
      <rect x="80" y="36" width="3" height="28" rx="1.5" fill="url(#logoGrad)" opacity="0.8" />
      <rect x="85" y="44" width="3" height="12" rx="1.5" fill="url(#logoGrad)" opacity="0.7" />
      <circle cx="91" cy="50" r="2" fill="url(#logoGrad)" opacity="0.6" />
    </svg>
  );
}

// Иконка для маленьких размеров (favicon-style)
export function ToneBalanceIcon({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      {/* Упрощённая гортань */}
      <path
        d="M35 25 Q50 20 65 25 L68 45 Q50 55 32 45 Z"
        fill="url(#iconGrad)"
      />
      <path
        d="M40 50 L50 70 L60 50"
        stroke="url(#iconGrad)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <ellipse cx="50" cy="80" rx="10" ry="4" fill="url(#iconGrad)" opacity="0.8" />

      {/* Волны */}
      <path d="M15 40 Q8 50 15 60" stroke="url(#iconGrad)" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M85 40 Q92 50 85 60" stroke="url(#iconGrad)" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.6" />
    </svg>
  );
}

export default ToneBalanceLogo;
