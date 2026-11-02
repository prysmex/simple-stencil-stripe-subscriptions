/**
 * Turns a JSON attribute value into its object form; non-string values (set as properties) pass through.
 */
export function parseJsonAttribute<T = unknown>(value: unknown): T | undefined {
  if (typeof value !== 'string') {
    return value as T;
  }
  if (value.trim() === '') {
    return undefined;
  }
  return JSON.parse(value);
}
