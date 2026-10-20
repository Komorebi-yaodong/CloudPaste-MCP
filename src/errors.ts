export class CloudPasteApiError extends Error {
  public readonly status: number;
  public readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "CloudPasteApiError";
    this.status = status;
    this.code = code;
  }
}

export function redactSensitiveText(value: unknown): string {
  return String(value ?? "")
    .replace(/\b(Bearer|ApiKey)\s+[^\s,;]+/gi, "$1 ***")
    .replace(/\b(authorization|api[_-]?key|token|secret|password)\s*[:=]\s*[^\s,;]+/gi, "$1=***")
    .slice(0, 500);
}

export function toSafeErrorMessage(error: unknown): string {
  if (error instanceof CloudPasteApiError) {
    return `CloudPaste 请求失败（HTTP ${error.status}）：${redactSensitiveText(error.message) || "请求失败"}`;
  }

  if (error instanceof Error) {
    return redactSensitiveText(error.message) || "发生未知错误";
  }

  return "发生未知错误";
}
