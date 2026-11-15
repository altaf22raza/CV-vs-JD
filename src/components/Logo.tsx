import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * CV vs JD Official Brand Emblem
 * Clean flat-vector palette aligned with Primary Navy (#173B65) & Secondary Blue (#3978B8)
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
      {/* Left: CV Sheet (Primary Navy #173B65) */}
      <g transform="rotate(-6 34 50)">
        <rect x="16" y="21" width="34" height="54" rx="5" fill="#173B65" />
        <path d="M 42 21 L 50 29 L 42 29 Z" fill="#3978B8" />
        <circle cx="26" cy="33" r="4" fill="#FFFFFF" opacity="0.92" />
        <rect x="33" y="31" width="12" height="2.6" rx="1.3" fill="#FFFFFF" opacity="0.9" />
        <rect x="33" y="35.5" width="8" height="2" rx="1" fill="#9EC1E6" />
        <rect x="21" y="44" width="24" height="2.2" rx="1.1" fill="#DCE8F5" />
        <rect x="21" y="50" width="20" height="2" rx="1" fill="#9EC1E6" />
        <rect x="21" y="55.5" width="22" height="2" rx="1" fill="#9EC1E6" />
        <rect x="21" y="61" width="15" height="2" rx="1" fill="#9EC1E6" />
      </g>

      {/* Right: Job Description Sheet (Secondary Blue #3978B8) */}
      <g transform="rotate(6 66 50)">
        <rect x="50" y="21" width="34" height="54" rx="5" fill="#3978B8" />
        <rect x="55" y="29" width="17" height="3" rx="1.5" fill="#FFFFFF" />
        <rect x="55" y="34.5" width="11" height="2" rx="1" fill="#DCE8F5" />
        <circle cx="57" cy="44" r="1.8" fill="#FFFFFF" />
        <rect x="61" y="42.8" width="17" height="2.2" rx="1.1" fill="#FFFFFF" opacity="0.95" />
        <circle cx="57" cy="50.5" r="1.8" fill="#FFFFFF" />
        <rect x="61" y="49.3" width="18" height="2.2" rx="1.1" fill="#DCE8F5" />
        <circle cx="57" cy="57" r="1.8" fill="#FFFFFF" />
        <rect x="61" y="55.8" width="14" height="2.2" rx="1.1" fill="#DCE8F5" />
        <circle cx="73" cy="64" r="6" fill="#173B65" stroke="#FFFFFF" strokeWidth="1.5" />
        <path
          d="M 70.4 64 L 72.3 66 L 75.8 62.2"
          stroke="#FFFFFF"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Center VS Crest */}
      <circle cx="50" cy="50" r="11" fill="#FFFFFF" stroke="#173B65" strokeWidth="2.4" />
      <text
        x="50"
        y="53.5"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="9.5"
        fontWeight="800"
        fill="#173B65"
        textAnchor="middle"
        letterSpacing="-0.3"
      >
        VS
      </text>
    </svg>
  );
};

export default Logo;
