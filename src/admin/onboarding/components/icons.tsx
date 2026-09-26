import React from 'react';

/* Lucide-style line icons, inlined so the onboarding stays dependency-free.
   Not swapped for lucide-react: these paths are what the Figma frames were
   measured against, and lucide's own revisions differ by a pixel or two. */

interface IconProps {
    size?: number;
    stroke?: number;
    children?: React.ReactNode;
}

const Svg: React.FC<IconProps> = ({ size = 20, stroke = 2, children }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {children}
    </svg>
);

export const BoxIcon: React.FC<IconProps> = (p) => (
    <Svg {...p}>
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
    </Svg>
);

export const ZapIcon: React.FC<IconProps> = (p) => (
    <Svg {...p}>
        <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </Svg>
);

export const GlobeIcon: React.FC<IconProps> = (p) => (
    <Svg {...p}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
    </Svg>
);

export const CartIcon: React.FC<IconProps> = (p) => (
    <Svg {...p}>
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </Svg>
);

export const PhoneIcon: React.FC<IconProps> = (p) => (
    <Svg {...p}>
        <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
        <path d="M12 18h.01" />
    </Svg>
);

export const GlassesIcon: React.FC<IconProps> = (p) => (
    <Svg {...p}>
        <circle cx="6" cy="15" r="4" />
        <circle cx="18" cy="15" r="4" />
        <path d="M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
        <path d="M2.5 13 5 7c.7-1.3 1.4-2 3-2" />
        <path d="M21.5 13 19 7c-.7-1.3-1.5-2-3-2" />
    </Svg>
);

export const CameraIcon: React.FC<IconProps> = (p) => (
    <Svg {...p}>
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
        <circle cx="12" cy="13" r="3" />
    </Svg>
);

export const SparklesIcon: React.FC<IconProps> = (p) => (
    <Svg {...p}>
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        <path d="M20 3v4" />
        <path d="M22 5h-4" />
        <path d="M4 17v2" />
        <path d="M5 18H3" />
    </Svg>
);

export const LayoutTemplateIcon: React.FC<IconProps> = (p) => (
    <Svg {...p}>
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
    </Svg>
);

export const LayoutGridIcon: React.FC<IconProps> = (p) => (
    <Svg {...p}>
        <rect width="7" height="7" x="3" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="14" rx="1" />
        <rect width="7" height="7" x="3" y="14" rx="1" />
    </Svg>
);

export const MenuIcon: React.FC<IconProps> = (p) => (
    <Svg {...p}>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
    </Svg>
);

export const CodeIcon: React.FC<IconProps> = (p) => (
    <Svg {...p}>
        <path d="m18 16 4-4-4-4" />
        <path d="m6 8-4 4 4 4" />
        <path d="m14.5 4-5 16" />
    </Svg>
);

export const PlayIcon: React.FC<IconProps> = ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7 4.5v15a1 1 0 0 0 1.53.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5z" />
    </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 12 }) => (
    <Svg size={size} stroke={3}>
        <path d="M20 6 9 17l-5-5" />
    </Svg>
);

/* Figma draws "Exit Setup" as one stroked circle-x glyph, not a filled badge
   with a separate X on top. */
export const CircleXIcon: React.FC<IconProps> = ({ size = 21 }) => (
    <Svg size={size} stroke={2}>
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6" />
        <path d="m9 9 6 6" />
    </Svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size = 18 }) => (
    <Svg size={size}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </Svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 16 }) => (
    <Svg size={size}>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
    </Svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 16 }) => (
    <Svg size={size}>
        <path d="m15 18-6-6 6-6" />
    </Svg>
);
