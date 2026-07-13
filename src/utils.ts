
import { produce } from 'immer';

// ─── Type Definitions ───────────────────────────────────────────────────────

export type ColorFormat = 'rgb' | 'rgba' | false;
export type RGBAFactor = [number, number, number, number];
export type RGBFactor = [number, number, number];
export type Factor = RGBAFactor | RGBFactor;

export interface MaterialSelectOption {
    label: string;
    value: string;
}

export interface MaterialInfo {
    name: string;
    [key: string]: unknown;
}

interface TextureDefault {
    texture: string | null;
    factor?: number[];
    uri?: string | null;
    textureName?: string | null;
}

interface BaseColorData {
    texture: string | null;
    factor: number[];
    default: TextureDefault;
}

interface MetallicRoughnessData {
    texture: string | null;
    uri: string | null;
    textureName: string | null;
    factor: number[];
    default: TextureDefault;
}

interface NormalData {
    texture: string | null;
    default: TextureDefault;
}

interface EmissiveData {
    texture: string | null;
    factor: number[];
    default: TextureDefault;
}

interface OcclusionData {
    texture: string | null;
    default: TextureDefault;
}

export interface MaterialData {
    baseColor: BaseColorData;
    metallicRoughness: MetallicRoughnessData;
    normal: NormalData;
    emissive: EmissiveData;
    occlusion: OcclusionData;
}

export type AllMaterialData = Record<string, MaterialData>;

interface TextureChannelItem {
    value: string;
    [key: string]: unknown;
}

interface AppliedTextureChannel {
    texture?: {
        name?: string;
        index?: number;
    };
    factor?: string | number[];
}

export type AppliedTextures = Record<string, Record<string, AppliedTextureChannel>>;

// ─── Utility Functions ──────────────────────────────────────────────────────

/**
 * Parses URL query string parameters.
 */
export function getParams(url: string = ''): Record<string, string | null> | undefined {
    url = url || location?.href;
    const queryStart = url.indexOf('?') + 1;
    const queryEnd = (url.indexOf('#') + 1) || (url.length + 1);
    const query = url.slice(queryStart, queryEnd - 1);
    const pairs = query.replace(/\+/g, ' ').split('&');
    const parms: Record<string, string | null> = {};

    if (query === url || query === '') return;

    for (let i = 0; i < pairs.length; i++) {
        const nv = pairs[i].split('=', 2);
        const n = decodeURIComponent(nv[0]);
        const v = decodeURIComponent(nv[1]);

        if (!Object.prototype.hasOwnProperty.call(parms, n)) {
            parms[n] = null;
        }
        parms[n] = nv.length === 2 ? v : null;
    }
    return parms;
}

/**
 * Removes WordPress-style size suffixes (e.g., `-100x100`) from image URLs.
 */
export function restoreOriginalImageSrc(imageSrc: string): string {
    const sizePattern = /-\d{2,4}x\d{2,4}/g;
    return imageSrc.replace(sizePattern, '');
}

/**
 * Checks if a string is an image file path based on common extensions.
 */
export function isImageSource(str: string): boolean {
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i;
    return imageExtensions.test(str);
}

/**
 * Walks up the DOM tree while the parent has only one child.
 * Returns the highest single-child ancestor.
 */
export function findParentUntilMultipleChildren(element: HTMLElement): HTMLElement {
    let parent = element.parentElement;

    while (parent && parent.children.length === 1) {
        element = parent;
        parent = parent.parentElement;
    }

    return element;
}

/**
 * Walks up the DOM tree while the parent is an `<a>` tag.
 */
export function findParentAnchorTag(element: HTMLElement): HTMLElement {
    let parent = element.parentElement;

    while (parent && parent.tagName === 'A') {
        element = parent;
        parent = parent.parentElement;
    }

    return element;
}

/**
 * Extracts material names from a materials array.
 */
export function getMaterials(materials: MaterialInfo[]): string[] {
    if (Array.isArray(materials)) {
        return materials.map((item) => item.name);
    }
    return [];
}

/**
 * Converts material names into options for WordPress SelectControl.
 */
export function getMaterialsNameForSelectControl(
    materials: MaterialInfo[] = []
): MaterialSelectOption[] {
    if (Array.isArray(materials)) {
        return materials.map((item) => {
            const label = item.name.replace('_mtl', '').replaceAll('_', ' ');
            return { label, value: item.name };
        });
    }
    return [];
}

/**
 * Converts RGBA (0–255) values to a normalized 0–1 factor array.
 */
export function rgbaToFactor(r: number, g: number, b: number, a: number = 255): RGBAFactor {
    return [r / 255, g / 255, b / 255, a / 255];
}

/**
 * Converts an sRGB channel value (0–255) to linear color space.
 */
export function sRGBToLinear(value: number): number {
    value /= 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/**
 * Converts an `rgba()` or `rgb()` CSS string to a linear-space factor array.
 */
export function rgbaStringToFactor(rgbaString: string): RGBAFactor | string {
    if (!['rgba', 'rgb'].includes(isRGBorRGBA(rgbaString) as string)) {
        return rgbaString;
    }
    const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (!match) return rgbaString;

    const [, r, g, b, a] = match.map(Number);
    return [sRGBToLinear(r), sRGBToLinear(g), sRGBToLinear(b), a];
}

/**
 * Converts a factor array (0–1 values) back to an `rgba()` or `rgb()` CSS string.
 */
export function factorToRgbaString(factor: unknown): string | unknown {
    if (!Array.isArray(factor) || (factor.length !== 3 && factor.length !== 4)) {
        return factor;
    }

    const r = Math.round(factor[0] * 255);
    const g = Math.round(factor[1] * 255);
    const b = Math.round(factor[2] * 255);
    const a = factor.length === 4 ? factor[3] : 1;

    return factor.length === 4
        ? `rgba(${r}, ${g}, ${b}, ${a})`
        : `rgb(${r}, ${g}, ${b})`;
}

/**
 * Converts an RGBA CSS color string to hex notation.
 */
export function rgbaToHex(rgba: string): string | null {
    try {
        const rgbaValues = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([0-9.]+)?\)/);

        if (!rgbaValues) {
            throw new Error('Invalid RGBA color string');
        }

        const r = parseInt(rgbaValues[1]);
        const g = parseInt(rgbaValues[2]);
        const b = parseInt(rgbaValues[3]);
        const a = rgbaValues[4] !== undefined ? parseFloat(rgbaValues[4]) : 1;

        const toHex = (n: number): string => n.toString(16).padStart(2, '0').toUpperCase();
        const alphaHex = toHex(Math.round(a * 255));

        return `#${toHex(r)}${toHex(g)}${toHex(b)}${a < 1 ? alphaHex : ''}`;
    } catch {
        return null;
    }
}

/**
 * Checks if a color string is valid `rgb()` or `rgba()` format.
 */
export function isRGBorRGBA(color: string): ColorFormat {
    const rgbRegex = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i;
    const rgbaRegex = /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)$/i;

    if (rgbaRegex.test(color)) return 'rgba';
    if (rgbRegex.test(color)) return 'rgb';
    return false;
}

/**
 * Creates a texture from a URL and applies it to a material channel.
 */
export const createAndApplyTexture = async (
    model: HTMLModelViewerElement,
    material: any,
    channel: string,
    value: string,
    name: string = 'raju' + new Date().getTime()
): Promise<void> => {
    const texture = await model.createTexture(value);
    texture.name = name;
    if (channel.includes('base') || channel.includes('metallic')) {
        material.pbrMetallicRoughness[channel + 'Texture'].setTexture(texture);
    } else {
        material[channel + 'Texture'].setTexture(texture);
    }
};



/**
 * Resets a material property (factor or texture) to its default value using Immer.
 */
export function resetMaterialProperty(
    defaultMaterialData: AllMaterialData,
    materialName: string,
    channel: string,
    property: 'factor' | 'texture'
): AllMaterialData {
    if (!defaultMaterialData[materialName]?.[channel as keyof MaterialData]?.default) {
        return defaultMaterialData;
    }
    if (!defaultMaterialData[materialName]) {
        console.warn(`Material '${materialName}' not found in default data.`);
        return defaultMaterialData;
    }

    if (!defaultMaterialData[materialName][channel as keyof MaterialData]) {
        console.warn(`Channel '${channel}' not found for material '${materialName}'.`);
        return defaultMaterialData;
    }

    if (property !== 'factor' && property !== 'texture') {
        console.warn(`Invalid property '${property}'. Use 'factor' or 'texture'.`);
        return defaultMaterialData;
    }

    return produce(defaultMaterialData, (draft: any) => {
        if (property === 'factor') {
            draft[materialName][channel].factor = draft[materialName][channel].default.factor;
        } else if (property === 'texture') {
            draft[materialName][channel].texture = draft[materialName][channel].default.texture;
        }
    });
}

/**
 * Deep merges two objects. Source values overwrite target values.
 */
export function merge<T extends Record<string, unknown>>(
    target: T | null | undefined,
    source: T | null | undefined
): T {
    if (typeof source !== 'object' || source === null) {
        return { ...target } as T;
    }

    if (typeof target !== 'object' || target === null) {
        target = (Array.isArray(source) ? [] : {}) as T;
    }

    const result: any = Array.isArray(target) ? [] : {};

    for (const key in target) {
        if (Object.prototype.hasOwnProperty.call(target, key)) {
            result[key] = target[key];
        }
    }

    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (typeof source[key] === 'object' && source[key] !== null) {
                result[key] = merge(
                    result[key] as Record<string, unknown>,
                    source[key] as Record<string, unknown>
                );
            } else {
                result[key] = source[key];
            }
        }
    }

    return result as T;
}

/**
 * Creates a debounced version of a function.
 */
export function debounce<T extends (...args: unknown[]) => void>(
    callback: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout>;
    return function (this: unknown, ...args: Parameters<T>) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            callback.apply(this, args);
        }, delay);
    };
}
