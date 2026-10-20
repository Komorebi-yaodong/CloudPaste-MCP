const SENSITIVE_KEY_PATTERN = /(?:^|_)(?:password|plain_password|api_?key|token|secret|authorization)(?:$|_)/i;

export function sanitizeForModel<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForModel(item)) as T;
  }

  if (value && typeof value === "object") {
    const sanitized: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) continue;
      sanitized[key] = sanitizeForModel(child);
    }

    return sanitized as T;
  }

  return value;
}
