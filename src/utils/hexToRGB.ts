export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

const clamp = (value: number, min = 0, max = 255): number =>
  Math.min(max, Math.max(min, value));

/**
 * Converts a color string to an `{ r, g, b, a }` object with channels in the
 * 0–255 range. Accepts `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb(...)`,
 * `rgba(...)` and the keyword `transparent`.
 *
 * @param hex The color string to convert.
 * @returns The parsed RGBA object, or `null` for empty/invalid input.
 */
const hexToRGB = (hex: string | null | undefined): RGBA | null => {
  if (!hex) return null;

  const value = hex.trim().toLowerCase();

  if (value === 'transparent') {
    return { r: 255, g: 255, b: 255, a: 0 };
  }

  // rgb(...) / rgba(...)
  if (value.startsWith('rgb')) {
    const match = value.match(
      /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/,
    );
    if (!match) return null;

    const [, r, g, b, a] = match;
    // CSS alpha is 0–1; accept 0–255 too, then normalise to 0–255.
    const alpha =
      a === undefined ? 255 : Number(a) <= 1 ? Number(a) * 255 : Number(a);

    return {
      r: clamp(Number(r)),
      g: clamp(Number(g)),
      b: clamp(Number(b)),
      a: clamp(Math.round(alpha)),
    };
  }

  // #rgb, #rgba, #rrggbb, #rrggbbaa
  let normalized = value.replace('#', '');
  if (normalized.length === 3 || normalized.length === 4) {
    normalized = normalized
      .split('')
      .map((char) => char + char)
      .join('');
  }

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(
    normalized,
  );
  if (!result) return null;

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: result[4] === undefined ? 255 : parseInt(result[4], 16),
  };
};

export default hexToRGB;
