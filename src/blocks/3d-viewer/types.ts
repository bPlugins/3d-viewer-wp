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
	model: ModelSettings;
	// Viewer type
	currentViewer: string;
	attributes: ViewerAttributes;
	O3DVSettings: O3DVSettings;

	// Loading
	lazyLoad: boolean;
	preload: string;


	// Zoom
	zoom: boolean;
	zoomInOutBtn: boolean;

	// Controls / UI
	mouseControl: boolean;
	fullscreen: boolean;
	cameraBtn: boolean;
	loadingPercentage: boolean;
	progressBar: boolean;

	// Styles & layout
	styles: Styles;
	stylesheet?: string;
	placement: string;

	// Exposure
	exposure: number;

	shadow: boolean;

	// WooCommerce
	woo: boolean;

	// Runtime-only (set programmatically, not in block.json)
	isBackend?: boolean;
	preview?: boolean;
}
