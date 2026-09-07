import React from 'react';

export interface TikTokVerifiedBadgeProps {
  color?: 'blue' | 'red';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
  tooltipText?: string;
}

/**
 * TikTok-style Verified Badge:
 * Distinctive 8-scallop rosette seal with a centered white checkmark.
 * Available in authentic TikTok cyan-blue (#20D5EC / #0284c7) or TikTok red (#FE2C55 / #E0103A).
 */
export const TikTokVerifiedBadge: React.FC<TikTokVerifiedBadgeProps> = ({
  color = 'blue',
  size = 'sm',
  className = '',
  showTooltip = true,
  tooltipText = 'Verified Student',
}) => {
  const isRed = color === 'red';

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  // Authentic TikTok Scalloped Badge SVG
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 align-middle ${className}`}
      title={showTooltip ? tooltipText : undefined}
      aria-label={tooltipText}
    >
      <svg
        className={`${sizeClasses} drop-shadow-xs transition-transform hover:scale-110`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id={`tiktok-gradient-${color}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            {isRed ? (
              <>
                <stop offset="0%" stopColor="#FE2C55" />
                <stop offset="100%" stopColor="#E0103A" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#20D5EC" />
                <stop offset="100%" stopColor="#0090DF" />
              </>
            )}
          </linearGradient>
        </defs>

        {/* 8-Scalloped TikTok Rosette */}
        <path
          d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.55 2.475 13.18 1.6 11.6 1.6s-2.95.875-3.6 2.148c-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.575 9.55.7 10.92.7 12.5s.875 2.95 2.148 3.6c-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238.65 1.273 2.02 2.148 3.6 2.148s2.95-.875 3.6-2.148c.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z"
          fill={`url(#tiktok-gradient-${color})`}
        />

        {/* Crisp Centered Checkmark */}
        <path
          d="M7.6 12.6l3 3 6.2-6.4"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};
