import React from 'react';

/** Tailwind blue-500 — matches BrandLogo wordmark “beagle” */
export const BRAND_BEAGLE_GLASSES = '#3B82F6';

export const BeagleIcon = ({
  className,
  color = '#475569',
  spotColor = '#5d4037',
  bellyColor = '#5d4037',
  /** Monocle / glasses stroke; defaults to brand blue (score dogs pass body color to keep tier look) */
  glassesColor = BRAND_BEAGLE_GLASSES,
}: {
  className?: string;
  color?: string;
  spotColor?: string;
  bellyColor?: string;
  glassesColor?: string;
}) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M35 65 C30 75 30 85 35 90 C40 95 60 95 65 90 C70 85 70 75 65 65" fill={color} stroke={color} strokeWidth="1.5" />
    <path d="M40 70 Q50 65 60 70 L62 85 Q50 90 38 85 Z" fill="#f5f5f5" />
    <ellipse cx="50" cy="80" rx="8" ry="4" fill={bellyColor} opacity="0.3" />
    <path d="M50 20 C65 20 75 30 75 45 C75 55 65 65 50 65 C35 65 25 55 25 45 C25 30 35 20 50 20Z" fill={color} stroke={color} strokeWidth="2" />
    <path d="M28 28 C20 30 15 45 15 55 C15 65 22 70 28 65" fill={spotColor} stroke={color} strokeWidth="1.5" />
    <path d="M72 28 C80 30 85 45 85 55 C85 65 78 70 72 65" fill={spotColor} stroke={color} strokeWidth="1.5" />
    <circle cx="58" cy="40" r="8" stroke={glassesColor} strokeWidth="1.5" fill="rgba(255,255,255,0.2)" />
    <path d="M64 46 L82 50" stroke={glassesColor} strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="42" cy="40" r="3" fill="#333" />
    <circle cx="58" cy="40" r="3" fill="#333" />
    <ellipse cx="50" cy="46" rx="4" ry="2.5" fill="#000" />
  </svg>
);

/** SVG HTML string for PDF / non-React surfaces — keep in sync with BeagleIcon. */
export const getBeagleIconSvg = (
  color: string,
  spotColor: string,
  bellyColor: string = '#5d4037',
  size: string = '64',
  glassesColor: string = BRAND_BEAGLE_GLASSES,
) => {
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block;">
    <path d="M35 65 C30 75 30 85 35 90 C40 95 60 95 65 90 C70 85 70 75 65 65" fill="${color}" stroke="${color}" stroke-width="1.5" />
    <path d="M40 70 Q50 65 60 70 L62 85 Q50 90 38 85 Z" fill="#f5f5f5" />
    <ellipse cx="50" cy="80" rx="8" ry="4" fill="${bellyColor}" opacity="0.3" />
    <path d="M50 20 C65 20 75 30 75 45 C75 55 65 65 50 65 C35 65 25 55 25 45 C25 30 35 20 50 20Z" fill="${color}" stroke="${color}" stroke-width="2" />
    <path d="M28 28 C20 30 15 45 15 55 C15 65 22 70 28 65" fill="${spotColor}" stroke="${color}" stroke-width="1.5" />
    <path d="M72 28 C80 30 85 45 85 55 C85 65 78 70 72 65" fill="${spotColor}" stroke="${color}" stroke-width="1.5" />
    <circle cx="58" cy="40" r="8" stroke="${glassesColor}" stroke-width="1.5" fill="rgba(255,255,255,0.2)" />
    <path d="M64 46 L82 50" stroke="${glassesColor}" stroke-width="2.5" stroke-linecap="round" />
    <circle cx="42" cy="40" r="3" fill="#333" />
    <circle cx="58" cy="40" r="3" fill="#333" />
    <ellipse cx="50" cy="46" rx="4" ry="2.5" fill="#000" />
  </svg>`;
};
