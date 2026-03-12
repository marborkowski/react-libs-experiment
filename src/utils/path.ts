export function getByPath(obj: unknown, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

export function setByPath<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  if (keys.length === 0) return value as T;

  const clone = Array.isArray(obj) ? ([...obj] as unknown as T) : { ...obj };
  let current: Record<string, unknown> = clone as Record<string, unknown>;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const next = current[key];
    const nextClone = Array.isArray(next) ? [...next] : { ...(next as object) };
    current[key] = nextClone;
    current = nextClone as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
  return clone;
}
