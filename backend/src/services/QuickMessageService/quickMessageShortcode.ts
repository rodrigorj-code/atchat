/** Normaliza atalho: minúsculas, sem barra inicial, espaços → hífen */
export const normalizeQuickMessageShortcode = (s: string): string =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/^\//, "")
    .replace(/\s+/g, "-");
