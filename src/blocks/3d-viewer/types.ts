/**
 * TypeScript interfaces for the 3D Viewer block attributes.
 * Auto-derived from block.json attribute definitions.
 */

// ── Nested / Shared Types ─────────────────────────────────────────────

export interface ResponsiveValue {
	desktop: string;
	tablet: string;
	mobile: string;
}

export interface ModelSettings {
	modelUrl?: string;
	skyboxImage?: string | null;
	environmentImage?: string | null;
	arEnabled?: boolean;
	arPlacement?: 'floor' | 'wall';
	arMode?: 'quick-look' | 'webxr' | 'scene-viewer';
	arScale?: 'fixed' | 'auto';
	[key: string]: unknown;
}

export interface ModelItem {
	modelUrl: string;
	poster: string;
	useDecoder: 'none' | 'draco' | 'meshopt' | string;
	[key: string]: unknown;
}

export interface O3DVSettings {
	isFullscreen: boolean;
	isPagination: boolean;
	isNavigation: boolean;
	camera: string | null;
	mouseControl: boolean;
	showEdge: boolean;
	zoom: boolean;
	[key: string]: unknown;
}

export interface Styles {
	width: ResponsiveValue;
	height: ResponsiveValue;
	bgColor: string;
	progressBarColor: string;
	thumbSize: string;
	[key: string]: unknown;
}

export interface AdditionalSettings {
	ID: string;
	Class: string;
	CSS: string;
}

export interface AppliedTextures {
	modelUrl: string | null;
	[key: string]: unknown;
}

export interface ViewerAttributes {
	tonMapping: string;
	[key: string]: unknown;
}

export interface Hotspot {
	[key: string]: unknown;
}

// ── Main Block Attributes ─────────────────────────────────────────────

export interface BlockAttributes {
	// Identity
	uniqueId: string;

	// Multi-model
	multiple: boolean;
	model: ModelSettings;
	models: ModelItem[];

	// Viewer type
	currentViewer: string;
	attributes: ViewerAttributes;
	O3DVSettings: O3DVSettings;

	// Loading
	lazyLoad: boolean;
	preload: string;

	// Playback & animation
	autoplay: boolean;
	animation: boolean;
	selectedAnimation: string;

	// Shadow
	shadow: boolean;

	// Rotation
	rotate: boolean;
	autoRotate: boolean;
	rotationPerSecond: number;
	rotateAlongX: number;
	rotateAlongY: number;
	lockXAxisRotation: boolean;
	lockYAxisRotation: boolean;

	// Zoom
	zoom: boolean;
	zoomInOutBtn: boolean;
	zoomLevel: number;

	// Controls / UI
	mouseControl: boolean;
	fullscreen: boolean;
	cameraBtn: boolean;
	variant: boolean;
	loadingPercentage: boolean;
	progressBar: boolean;
	isPagination: boolean;
	isNavigation: boolean;

	// Environment
	exposure: number;
	environmentImage: string;
	useEnvironmentAsSkybox: boolean;
	toneMapping: string;

	// Textures
	appliedTextures: AppliedTextures;

	// Hotspots
	hotspots: Hotspot[];
	hotspotStyle: string;

	// Styles & layout
	styles: Styles;
	stylesheet?: string;
	additional: AdditionalSettings;
	placement: string;

	// WooCommerce
	woo: boolean;

	// Runtime-only (set programmatically, not in block.json)
	isPremium?: boolean;
	isBackend?: boolean;
	preview?: boolean;
}
