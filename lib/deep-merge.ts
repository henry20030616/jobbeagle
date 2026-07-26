/** Shallow-aware deep merge for sample report locale overlays (plain objects / arrays). */
export function deepMerge<T>(base: T, overlay: unknown): T {
  if (overlay == null) return base;
  if (Array.isArray(overlay)) return overlay as T;
  if (typeof overlay !== 'object' || typeof base !== 'object' || base == null || Array.isArray(base)) {
    return overlay as T;
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(overlay as Record<string, unknown>)) {
    if (value === undefined) continue;
    out[key] = deepMerge(out[key], value);
  }
  return out as T;
}
