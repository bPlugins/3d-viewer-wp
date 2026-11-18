import type { CSSProperties, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

// One 24-grid outline set in currentColor. Inline style, not attributes, so theme or editor CSS
// that sets `fill` on svgs cannot paint the outlines solid; a caller's style still wins.
const STROKE: CSSProperties = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' };

const strokeIcon = (d: string) => ({ size = 35, style, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width={size} height={size} style={{ ...STROKE, ...style }} {...props}>
        <path d={d} style={{ fill: 'none' }} />
    </svg>
);

/** A phone with a cube. */
export const ARQROPenerIcon = strokeIcon('M8 2.5h8a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V4A1.5 1.5 0 0 1 8 2.5zM12 7.8l3 1.7v3.4l-3 1.7-3-1.7V9.5zM9 9.5l3 1.7 3-1.7M12 11.2v3.4M11 18.5h2');

export const Close = strokeIcon('M6 6l12 12M18 6 6 18');

export const Camera = strokeIcon('M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3l1.4-2h5.6l1.4 2h2.3A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z');

export const Download = strokeIcon('M12 4v11M7 10l5 5 5-5M4 19.5h16');

export const ExitFullscreen = strokeIcon('M9 3v4a2 2 0 0 1-2 2H3M15 3v4a2 2 0 0 0 2 2h4M9 21v-4a2 2 0 0 0-2-2H3M15 21v-4a2 2 0 0 1 2-2h4');

export const Fullscreen = strokeIcon('M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3');

export const Plus = strokeIcon('M12 5v14M5 12h14');

export const Minus = strokeIcon('M5 12h14');
