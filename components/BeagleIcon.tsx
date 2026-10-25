import React from 'react';
/** Navy rim — high contrast on every Beagle fill (header slate, report tier blues). */
export const BRAND_BEAGLE_GLASSES = '#1e3a8a';
const LOUPE_LENS_FILL = 'rgba(255,255,255,0.72)';
const LOUPE_HANDLE_CORE = '#93c5fd';
const LOUPE_SHINE = '#ffffff';

/** Magnifying glass: thick navy rim, light lens, visible handle. Reads at 48px nav and 160px report. */
const BeagleLoupe = ({ accent = BRAND_BEAGLE_GLASSES }: { accent?: string }) => (
  <g aria-hidden="true">
    <circle cx="60" cy="40" r="12.5" fill={LOUPE_LENS_FILL} stroke={BRAND_BEAGLE_GLASSES} strokeWidth="4.5" />
    <circle cx="60" cy="40" r="12.5" fill="none" stroke={accent} strokeWidth="1.25" />
    <path d="M69.2 49.2 L86.5 64.5" stroke={BRAND_BEAGLE_GLASSES} strokeWidth="7" strokeLinecap="round" />
    <path d="M69.2 49.2 L86.5 64.5" stroke={LOUPE_HANDLE_CORE} strokeWidth="3.5" strokeLinecap="round" />
  </g>
);

const BeagleLoupeShine = () => (
  <path
    d="M52.5 34.5 A8.5 8.5 0 0 1 62 30"
    stroke={LOUPE_SHINE}
    strokeWidth="2.4"
    strokeLinecap="round"
    fill="none"
    opacity="0.95"
    aria-hidden="true"
  />
);

export const BeagleIcon = ({
  className,
  color = '#475569',
  spotColor = '#5d4037',
  bellyColor = '#5d4037',
  /** Inner accent on the loupe; outer rim stays navy so score dogs never camouflage the glass. */
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
    <BeagleLoupe accent={glassesColor} />
    <circle cx="42" cy="40" r="3" fill="#333" />
    <circle cx="58" cy="40" r="3" fill="#333" />
    <ellipse cx="50" cy="46" rx="4" ry="2.5" fill="#000" />
    <BeagleLoupeShine />
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
    <circle cx="60" cy="40" r="12.5" fill="${LOUPE_LENS_FILL}" stroke="${BRAND_BEAGLE_GLASSES}" stroke-width="4.5" />
    <circle cx="60" cy="40" r="12.5" fill="none" stroke="${glassesColor}" stroke-width="1.25" />
    <path d="M69.2 49.2 L86.5 64.5" stroke="${BRAND_BEAGLE_GLASSES}" stroke-width="7" stroke-linecap="round" />
    <path d="M69.2 49.2 L86.5 64.5" stroke="${LOUPE_HANDLE_CORE}" stroke-width="3.5" stroke-linecap="round" />
    <circle cx="42" cy="40" r="3" fill="#333" />
    <circle cx="58" cy="40" r="3" fill="#333" />
    <ellipse cx="50" cy="46" rx="4" ry="2.5" fill="#000" />
    <path d="M52.5 34.5 A8.5 8.5 0 0 1 62 30" stroke="${LOUPE_SHINE}" stroke-width="2.4" stroke-linecap="round" fill="none" opacity="0.95" />
  </svg>`;
};
