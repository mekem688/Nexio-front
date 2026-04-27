interface NexioLogoProps {
  size?: number;
  className?: string;
}

export default function NexioLogo({ size = 32, className = "" }: NexioLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Nexio logo"
    >
      <defs>
        <linearGradient id="nexio-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      {/* Fond arrondi gradient */}
      <rect width="40" height="40" rx="11" fill="url(#nexio-grad)" />
      {/* Bulle principale */}
      <path
        d="M8 12a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-7l-5 5v-5H11a3 3 0 0 1-3-3V12z"
        fill="white"
        fillOpacity="0.18"
      />
      {/* Lettre N stylisée */}
      <path
        d="M13 27V13h2.5l7 9.5V13H25v14h-2.5l-7-9.5V27H13z"
        fill="white"
      />
    </svg>
  );
}
