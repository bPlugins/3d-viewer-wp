/**
 * Safely parses a JSON string, returning a fallback value instead of throwing
 * when the input is empty or malformed.
 *
 * @param json     The JSON string to parse.
 * @param fallback Value returned when parsing fails (defaults to `null`).
 * @returns The parsed value typed as `T`, or the fallback on failure.
 */
const jsonParse = <T = unknown>(
  json: string | null | undefined,
  fallback: T | null = null,
): T | null => {
  if (typeof json !== 'string' || json.trim() === '') {
    return fallback;
  }

  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.warn('jsonParse:', error instanceof Error ? error.message : error);
    return fallback;
  }
};

export default jsonParse;
