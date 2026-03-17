export function resolveMediaPath(path?: string | null): string | null {
  if (!path) {
    return null;
  }

  const normalized = path.trim();
  if (normalized.length === 0) {
    return null;
  }

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  if (normalized.startsWith("/")) {
    return normalized;
  }

  if (normalized.startsWith("qrc:/") || normalized.startsWith("file:///")) {
    return null;
  }

  if (/^[a-zA-Z]:\\/.test(normalized)) {
    return null;
  }

  return `/${normalized.replace(/\\/g, "/").replace(/^\.\//, "")}`;
}
