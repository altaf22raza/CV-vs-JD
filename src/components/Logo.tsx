import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * CV vs JD Official Brand Emblem
 * Features:
 * - Left: Deep Navy (#1E2B3E) CV Document with A+ Grade badge
 * - Center: Dynamic Gold (#C8973E / #F3CA68) VS Lightning Crest
 * - Right: Forest Emerald (#1D5A3A) Job Description Sheet with Checkmark
 * - Frame: Classic Laurel Wreath & Gold Tie
 */
export const Logo: React.FC<LogoProps> = ({ className = 'w-9 h-9', size }) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      style={style}
      aria-label="CV vs JD Logo"
      fill="none"
    >
      <defs>
        <linearGradient id="logoNavyDoc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A3B52" />
          <stop offset="100%" stopColor="#141E2B" />
        </linearGradient>
        <linearGradient id="logoGreenDoc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#246B46" />
          <stop offset="100%" stopColor="#133D26" />
        </linearGradient>
        <linearGradient id="logoGoldBolt" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F3CA68" />
          <stop offset="50%" stopColor="#D49E35" />
          <stop offset="100%" stopColor="#A26C1C" />
        </linearGradient>
        <linearGradient id="logoGoldRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E5BA55" />
          <stop offset="100%" stopColor="#A67320" />
        </linearGradient>
        <filter id="logoDropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Laurel Wreath (Left side - Executive Navy leaves) */}
      <g fill="#1E2B3E" opacity="0.9">
        <path d="M 12 50 C 10 38 16 26 26 18 C 24 23 23 29 24 35 C 19 39 15 44 12 50 Z" />
        <path d="M 14 55 C 13 67 18 78 28 85 C 26 80 25 74 26 68 C 21 64 17 60 14 55 Z" />
        <path d="M 22 22 C 26 16 32 12 40 10 C 37 14 35 19 35 24 C 30 22 25 22 22 22 Z" />
        <path d="M 24 81 C 28 86 35 90 42 92 C 39 88 38 83 38 78 C 33 79 28 80 24 81 Z" />
        <path d="M 10 36 C 13 32 17 30 22 30 C 18 35 16 41 15 47 C 11 43 10 39 10 36 Z" />
        <path d="M 11 65 C 14 69 18 72 23 72 C 19 67 17 61 16 55 C 12 59 11 62 11 65 Z" />
      </g>

      {/* Laurel Wreath (Right side - Forest Emerald leaves) */}
      <g fill="#1D5A3A" opacity="0.95">
        <path d="M 88 50 C 90 38 84 26 74 18 C 76 23 77 29 76 35 C 81 39 85 44 88 50 Z" />
        <path d="M 86 55 C 87 67 82 78 72 85 C 74 80 75 74 74 68 C 79 64 83 60 86 55 Z" />
        <path d="M 78 22 C 74 16 68 12 60 10 C 63 14 65 19 65 24 C 70 22 75 22 78 22 Z" />
        <path d="M 76 81 C 72 86 65 90 58 92 C 61 88 62 83 62 78 C 67 79 72 80 76 81 Z" />
        <path d="M 90 36 C 87 32 83 30 78 30 C 82 35 84 41 85 47 C 89 43 90 39 90 36 Z" />
        <path d="M 89 65 C 86 69 82 72 77 72 C 81 67 83 61 84 55 C 88 59 89 62 89 65 Z" />
      </g>

      {/* Bottom Gold Ribbon Tie */}
      <path d="M 44 91 C 47 89 53 89 56 91 C 58 94 54 96 50 95 C 46 96 42 94 44 91 Z" fill="url(#logoGoldRibbon)" />
      <path d="M 46 94 L 40 98 L 44 95 Z" fill="#A26C1C" />
      <path d="M 54 94 L 60 98 L 56 95 Z" fill="#A26C1C" />

      {/* LEFT: The CV Resume Sheet (Navy + Gold Highlights) */}
      <g filter="url(#logoDropShadow)" transform="rotate(-6 32 50)">
        {/* Back page shadow */}
        <rect x="18" y="27" width="28" height="42" rx="3" fill="#152130" opacity="0.6" />
        {/* Main CV page */}
        <rect x="20" y="25" width="28" height="42" rx="3" fill="url(#logoNavyDoc)" stroke="#4A6182" strokeWidth="0.8" />
        {/* Folded corner */}
        <path d="M 42 25 L 48 31 L 42 31 Z" fill="#3B4F6D" />
        {/* Candidate avatar */}
        <circle cx="27" cy="33" r="3.2" fill="#D49E35" />
        <path d="M 23 40 C 23 37 25 36 27 36 C 29 36 31 37 31 40 Z" fill="#D49E35" />
        {/* Headline bars */}
        <rect x="33" y="32" width="11" height="2" rx="1" fill="#E5BA55" />
        <rect x="33" y="36" width="7" height="1.5" rx="0.75" fill="#8FA4C2" />
        {/* Resume lines */}
        <rect x="23" y="43" width="22" height="1.6" rx="0.8" fill="#9FB5D4" />
        <rect x="23" y="47" width="18" height="1.4" rx="0.7" fill="#6C82A3" />
        <rect x="23" y="51" width="20" height="1.4" rx="0.7" fill="#6C82A3" />
        <rect x="23" y="55" width="15" height="1.4" rx="0.7" fill="#6C82A3" />
        {/* A+ Gold Grade Badge */}
        <g transform="translate(37, 56)">
          <circle cx="5" cy="5" r="5" fill="#D49E35" stroke="#FFFFFF" strokeWidth="0.6" />
          <text x="5" y="7.2" fontFamily="system-ui, sans-serif" fontSize="5" fontWeight="900" fill="#141E2B" textAnchor="middle">
            A+
          </text>
        </g>
      </g>

      {/* RIGHT: The Job Description Sheet (Emerald Green + Gold Checkmark) */}
      <g filter="url(#logoDropShadow)" transform="rotate(6 68 50)">
        {/* Main JD page */}
        <rect x="52" y="25" width="28" height="42" rx="3" fill="url(#logoGreenDoc)" stroke="#3E8E62" strokeWidth="0.8" />
        {/* Header title */}
        <rect x="56" y="31" width="14" height="2.5" rx="1" fill="#F3CA68" />
        <rect x="56" y="36" width="9" height="1.5" rx="0.75" fill="#88C4A2" />
        {/* Checklist */}
        <circle cx="58" cy="42" r="1.3" fill="#D49E35" />
        <rect x="62" y="41.2" width="14" height="1.6" rx="0.8" fill="#E2F5EB" />
        <circle cx="58" cy="46" r="1.3" fill="#D49E35" />
        <rect x="62" y="45.2" width="16" height="1.6" rx="0.8" fill="#C2E6D2" />
        <circle cx="58" cy="50" r="1.3" fill="#D49E35" />
        <rect x="62" y="49.2" width="13" height="1.6" rx="0.8" fill="#C2E6D2" />
        <circle cx="58" cy="54" r="1.3" fill="#D49E35" />
        <rect x="62" y="53.2" width="15" height="1.6" rx="0.8" fill="#C2E6D2" />
        {/* Gold Matching Checkmark badge */}
        <g transform="translate(68, 54)">
          <circle cx="5" cy="5" r="5" fill="#246B46" stroke="#D49E35" strokeWidth="1" />
          <path d="M 3 5 L 4.5 6.8 L 7.5 3.5" fill="none" stroke="#F3CA68" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>

      {/* CENTER: The Dynamic "VS" Lightning Badge */}
      <g filter="url(#logoDropShadow)">
        {/* Central Lightning Blade */}
        <polygon points="52,14 45,46 51,46 47,82 56,43 50,43" fill="url(#logoGoldBolt)" stroke="#74490C" strokeWidth="0.7" />
        {/* VS Round Crest Backing */}
        <circle cx="50" cy="48" r="9.5" fill="#1C1814" stroke="url(#logoGoldBolt)" strokeWidth="1.2" />
        {/* VS Text */}
        <text
          x="50"
          y="52"
          fontFamily="system-ui, sans-serif"
          fontSize="9"
          fontWeight="900"
          fontStyle="italic"
          fill="#FFFFFF"
          textAnchor="middle"
          letterSpacing="-0.5"
        >
          <tspan fill="#F3CA68">V</tspan>
          <tspan fill="#FFFFFF">S</tspan>
        </text>
      </g>
    </svg>
  );
};
export default Logo;
