export function shortcutKeys(keys: string): string {
  return keys.replace(/\bprefix\b/gi, "ctrl + b");
}
